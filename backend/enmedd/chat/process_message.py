import traceback
from collections.abc import Callable
from collections.abc import Iterator
from functools import partial
from typing import cast

from sqlalchemy.orm import Session

from enmedd.chat.chat_utils import create_chat_chain
from enmedd.chat.models import AllCitations
from enmedd.chat.models import AnswerPiece
from enmedd.chat.models import CitationInfo
from enmedd.chat.models import CustomToolResponse
from enmedd.chat.models import FinalUsedContextDocsResponse
from enmedd.chat.models import ImageGenerationDisplay
from enmedd.chat.models import LLMRelevanceFilterResponse
from enmedd.chat.models import MessageResponseIDInfo
from enmedd.chat.models import MessageSpecificCitations
from enmedd.chat.models import QADocsResponse
from enmedd.chat.models import StreamingError
from enmedd.configs.chat_configs import BING_API_KEY
from enmedd.configs.chat_configs import CHAT_TARGET_CHUNK_PERCENTAGE
from enmedd.configs.chat_configs import DISABLE_LLM_CHOOSE_SEARCH
from enmedd.configs.chat_configs import MAX_CHUNKS_FED_TO_CHAT
from enmedd.configs.constants import MessageType
from enmedd.configs.model_configs import GEN_AI_TEMPERATURE
from enmedd.db.assistant import get_assistant_by_id
from enmedd.db.chat import attach_files_to_chat_message
from enmedd.db.chat import create_db_search_doc
from enmedd.db.chat import create_new_chat_message
from enmedd.db.chat import get_chat_message
from enmedd.db.chat import get_chat_session_by_id
from enmedd.db.chat import get_db_search_doc_by_id
from enmedd.db.chat import get_doc_query_identifiers_from_model
from enmedd.db.chat import get_or_create_root_message
from enmedd.db.chat import reserve_message_id
from enmedd.db.chat import translate_db_message_to_chat_message_detail
from enmedd.db.chat import translate_db_search_doc_to_server_search_doc
from enmedd.db.engine import get_session_context_manager
from enmedd.db.llm import fetch_existing_llm_providers
from enmedd.db.models import SearchDoc as DbSearchDoc
from enmedd.db.models import ToolCall
from enmedd.db.models import User
from enmedd.db.search_settings import get_current_search_settings
from enmedd.document_index.factory import get_default_document_index
from enmedd.file_store.models import ChatFileType
from enmedd.file_store.models import FileDescriptor
from enmedd.file_store.utils import load_all_chat_files
from enmedd.file_store.utils import save_files_from_urls
from enmedd.llm.answering.answer import Answer
from enmedd.llm.answering.models import AnswerStyleConfig
from enmedd.llm.answering.models import CitationConfig
from enmedd.llm.answering.models import DocumentPruningConfig
from enmedd.llm.answering.models import PreviousMessage
from enmedd.llm.answering.models import PromptConfig
from enmedd.llm.exceptions import GenAIDisabledException
from enmedd.llm.factory import get_llms_for_assistant
from enmedd.llm.factory import get_main_llm_from_tuple
from enmedd.llm.interfaces import LLMConfig
from enmedd.llm.utils import litellm_exception_to_error_msg
from enmedd.natural_language_processing.utils import get_tokenizer
from enmedd.search.enums import LLMEvaluationType
from enmedd.search.enums import OptionalSearchSetting
from enmedd.search.enums import QueryFlow
from enmedd.search.enums import SearchType
from enmedd.search.models import InferenceSection
from enmedd.search.retrieval.search_runner import inference_sections_from_ids
from enmedd.search.utils import chunks_or_sections_to_search_docs
from enmedd.search.utils import dedupe_documents
from enmedd.search.utils import drop_llm_indices
from enmedd.search.utils import relevant_sections_to_indices
from enmedd.server.query_and_chat.models import ChatMessageDetail
from enmedd.server.query_and_chat.models import CreateChatMessageRequest
from enmedd.server.utils import get_json_line
from enmedd.tools.built_in_tools import get_built_in_tool_by_id
from enmedd.tools.custom.custom_tool import (
    build_custom_tools_from_openapi_schema_and_headers,
)
from enmedd.tools.custom.custom_tool import CUSTOM_TOOL_RESPONSE_ID
from enmedd.tools.custom.custom_tool import CustomToolCallSummary
from enmedd.tools.force import ForceUseTool
from enmedd.tools.images.image_generation_tool import IMAGE_GENERATION_RESPONSE_ID
from enmedd.tools.images.image_generation_tool import ImageGenerationResponse
from enmedd.tools.images.image_generation_tool import ImageGenerationTool
from enmedd.tools.internet_search.internet_search_tool import (
    INTERNET_SEARCH_RESPONSE_ID,
)
from enmedd.tools.internet_search.internet_search_tool import (
    internet_search_response_to_search_docs,
)
from enmedd.tools.internet_search.internet_search_tool import InternetSearchResponse
from enmedd.tools.internet_search.internet_search_tool import InternetSearchTool
from enmedd.tools.models import DynamicSchemaInfo
from enmedd.tools.search.search_tool import FINAL_CONTEXT_DOCUMENTS_ID
from enmedd.tools.search.search_tool import SEARCH_RESPONSE_SUMMARY_ID
from enmedd.tools.search.search_tool import SearchResponseSummary
from enmedd.tools.search.search_tool import SearchTool
from enmedd.tools.search.search_tool import SECTION_RELEVANCE_LIST_ID
from enmedd.tools.tool import Tool
from enmedd.tools.tool import ToolResponse
from enmedd.tools.tool_runner import ToolCallFinalResult
from enmedd.tools.utils import compute_all_tool_tokens
from enmedd.tools.utils import explicit_tool_calling_supported
from enmedd.utils.logger import setup_logger
from enmedd.utils.timing import log_generator_function_time

logger = setup_logger()


def _translate_citations(
    citations_list: list[CitationInfo], db_docs: list[DbSearchDoc]
) -> MessageSpecificCitations:
    """Always cites the first instance of the document_id, assumes the db_docs
    are sorted in the order displayed in the UI"""
    doc_id_to_saved_doc_id_map: dict[str, int] = {}
    for db_doc in db_docs:
        if db_doc.document_id not in doc_id_to_saved_doc_id_map:
            doc_id_to_saved_doc_id_map[db_doc.document_id] = db_doc.id

    citation_to_saved_doc_id_map: dict[int, int] = {}
    for citation in citations_list:
        if citation.citation_num not in citation_to_saved_doc_id_map:
            citation_to_saved_doc_id_map[
                citation.citation_num
            ] = doc_id_to_saved_doc_id_map[citation.document_id]

    return MessageSpecificCitations(citation_map=citation_to_saved_doc_id_map)


def _handle_search_tool_response_summary(
    packet: ToolResponse,
    db_session: Session,
    selected_search_docs: list[DbSearchDoc] | None,
    dedupe_docs: bool = False,
) -> tuple[QADocsResponse, list[DbSearchDoc], list[int] | None]:
    response_sumary = cast(SearchResponseSummary, packet.response)

    dropped_inds = None
    if not selected_search_docs:
        top_docs = chunks_or_sections_to_search_docs(response_sumary.top_sections)

        deduped_docs = top_docs
        if dedupe_docs:
            deduped_docs, dropped_inds = dedupe_documents(top_docs)

        reference_db_search_docs = [
            create_db_search_doc(server_search_doc=doc, db_session=db_session)
            for doc in deduped_docs
        ]
    else:
        reference_db_search_docs = selected_search_docs

    response_docs = [
        translate_db_search_doc_to_server_search_doc(db_search_doc)
        for db_search_doc in reference_db_search_docs
    ]
    return (
        QADocsResponse(
            rephrased_query=response_sumary.rephrased_query,
            top_documents=response_docs,
            predicted_flow=response_sumary.predicted_flow,
            predicted_search=response_sumary.predicted_search,
            applied_source_filters=response_sumary.final_filters.source_type,
            applied_time_cutoff=response_sumary.final_filters.time_cutoff,
            recency_bias_multiplier=response_sumary.recency_bias_multiplier,
        ),
        reference_db_search_docs,
        dropped_inds,
    )


def _handle_internet_search_tool_response_summary(
    packet: ToolResponse,
    db_session: Session,
) -> tuple[QADocsResponse, list[DbSearchDoc]]:
    internet_search_response = cast(InternetSearchResponse, packet.response)
    server_search_docs = internet_search_response_to_search_docs(
        internet_search_response
    )

    reference_db_search_docs = [
        create_db_search_doc(server_search_doc=doc, db_session=db_session)
        for doc in server_search_docs
    ]
    response_docs = [
        translate_db_search_doc_to_server_search_doc(db_search_doc)
        for db_search_doc in reference_db_search_docs
    ]
    return (
        QADocsResponse(
            rephrased_query=internet_search_response.revised_query,
            top_documents=response_docs,
            predicted_flow=QueryFlow.QUESTION_ANSWER,
            predicted_search=SearchType.SEMANTIC,
            applied_source_filters=[],
            applied_time_cutoff=None,
            recency_bias_multiplier=1.0,
        ),
        reference_db_search_docs,
    )


def _get_force_search_settings(
    new_msg_req: CreateChatMessageRequest, tools: list[Tool]
) -> ForceUseTool:
    internet_search_available = any(
        isinstance(tool, InternetSearchTool) for tool in tools
    )
    search_tool_available = any(isinstance(tool, SearchTool) for tool in tools)

    if not internet_search_available and not search_tool_available:
        # Does not matter much which tool is set here as force is false and neither tool is available
        return ForceUseTool(force_use=False, tool_name=SearchTool._NAME)

    tool_name = SearchTool._NAME if search_tool_available else InternetSearchTool._NAME
    # Currently, the internet search tool does not support query override
    args = (
        {"query": new_msg_req.query_override}
        if new_msg_req.query_override and tool_name == SearchTool._NAME
        else None
    )

    if new_msg_req.file_descriptors:
        # If user has uploaded files they're using, don't run any of the search tools
        return ForceUseTool(force_use=False, tool_name=tool_name)

    should_force_search = any(
        [
            new_msg_req.retrieval_options
            and new_msg_req.retrieval_options.run_search
            == OptionalSearchSetting.ALWAYS,
            new_msg_req.search_doc_ids,
            DISABLE_LLM_CHOOSE_SEARCH,
        ]
    )

    if should_force_search:
        # If we are using selected docs, just put something here so the Tool doesn't need to build its own args via an LLM call
        args = {"query": new_msg_req.message} if new_msg_req.search_doc_ids else args
        return ForceUseTool(force_use=True, tool_name=tool_name, args=args)

    return ForceUseTool(force_use=False, tool_name=tool_name, args=args)


ChatPacket = (
    StreamingError
    | QADocsResponse
    | LLMRelevanceFilterResponse
    | FinalUsedContextDocsResponse
    | ChatMessageDetail
    | AnswerPiece
    | AllCitations
    | CitationInfo
    | ImageGenerationDisplay
    | CustomToolResponse
    | MessageSpecificCitations
    | MessageResponseIDInfo
)
ChatPacketStream = Iterator[ChatPacket]


def stream_chat_message_objects(
    new_msg_req: CreateChatMessageRequest,
    user: User | None,
    db_session: Session,
    # Needed to translate assistant num_chunks to tokens to the LLM
    default_num_chunks: float = MAX_CHUNKS_FED_TO_CHAT,
    # For flow with search, don't include as many chunks as possible since we need to leave space
    # for the chat history, for smaller models, we likely won't get MAX_CHUNKS_FED_TO_CHAT chunks
    max_document_percentage: float = CHAT_TARGET_CHUNK_PERCENTAGE,
    # if specified, uses the last user message and does not create a new user message based
    # on the `new_msg_req.message`. Currently, requires a state where the last message is a
    use_existing_user_message: bool = False,
    litellm_additional_headers: dict[str, str] | None = None,
    is_connected: Callable[[], bool] | None = None,
    enforce_chat_session_id_for_search_docs: bool = True,
) -> ChatPacketStream:
    """Streams in order:
    1. [conditional] Retrieved documents if a search needs to be run
    2. [conditional] LLM selected chunk indices if LLM chunk filtering is turned on
    3. [always] A set of streamed LLM tokens or an error anywhere along the line if something fails
    4. [always] Details on the final AI response message that is created
    """
    # Currently surrounding context is not supported for chat
    # Chat is already token heavy and harder for the model to process plus it would roll history over much faster
    new_msg_req.chunks_above = 0
    new_msg_req.chunks_below = 0

    try:
        user_id = user.id if user is not None else None

        chat_session = get_chat_session_by_id(
            chat_session_id=new_msg_req.chat_session_id,
            user_id=user_id,
            db_session=db_session,
        )

        message_text = new_msg_req.message
        chat_session_id = new_msg_req.chat_session_id
        parent_id = new_msg_req.parent_message_id
        reference_doc_ids = new_msg_req.search_doc_ids
        retrieval_options = new_msg_req.retrieval_options
        alternate_assistant_id = new_msg_req.alternate_assistant_id

        # use alternate assistant if alternative assistant id is passed in
        if alternate_assistant_id is not None:
            assistant = get_assistant_by_id(
                alternate_assistant_id,
                user=user,
                db_session=db_session,
                is_for_edit=False,
            )
        else:
            assistant = chat_session.assistant

        prompt_id = new_msg_req.prompt_id
        if prompt_id is None and assistant.prompts:
            prompt_id = sorted(assistant.prompts, key=lambda x: x.id)[-1].id

        if reference_doc_ids is None and retrieval_options is None:
            raise RuntimeError(
                "Must specify a set of documents for chat or specify search options"
            )

        try:
            llm, fast_llm = get_llms_for_assistant(
                assistant=assistant,
                llm_override=new_msg_req.llm_override or chat_session.llm_override,
                additional_headers=litellm_additional_headers,
            )
        except GenAIDisabledException:
            raise RuntimeError("LLM is disabled. Can't use chat flow without LLM.")

        llm_provider = llm.config.model_provider
        llm_model_name = llm.config.model_name

        llm_tokenizer = get_tokenizer(
            model_name=llm_model_name,
            provider_type=llm_provider,
        )
        llm_tokenizer_encode_func = cast(
            Callable[[str], list[int]], llm_tokenizer.encode
        )

        search_settings = get_current_search_settings(db_session)
        document_index = get_default_document_index(
            primary_index_name=search_settings.index_name, secondary_index_name=None
        )

        # Every chat Session begins with an empty root message
        root_message = get_or_create_root_message(
            chat_session_id=chat_session_id, db_session=db_session
        )

        if parent_id is not None:
            parent_message = get_chat_message(
                chat_message_id=parent_id,
                user_id=user_id,
                db_session=db_session,
            )
        else:
            parent_message = root_message

        user_message = None

        if new_msg_req.regenerate:
            final_msg, history_msgs = create_chat_chain(
                stop_at_message_id=parent_id,
                chat_session_id=chat_session_id,
                db_session=db_session,
            )

        elif not use_existing_user_message:
            # Create new message at the right place in the tree and update the parent's child pointer
            # Don't commit yet until we verify the chat message chain
            user_message = create_new_chat_message(
                chat_session_id=chat_session_id,
                parent_message=parent_message,
                prompt_id=prompt_id,
                message=message_text,
                token_count=len(llm_tokenizer_encode_func(message_text)),
                message_type=MessageType.USER,
                files=None,  # Need to attach later for optimization to only load files once in parallel
                db_session=db_session,
                commit=False,
            )
            # re-create linear history of messages
            final_msg, history_msgs = create_chat_chain(
                chat_session_id=chat_session_id, db_session=db_session
            )
            if final_msg.id != user_message.id:
                db_session.rollback()
                raise RuntimeError(
                    "The new message was not on the mainline. "
                    "Be sure to update the chat pointers before calling this."
                )

            # NOTE: do not commit user message - it will be committed when the
            # assistant message is successfully generated
        else:
            # re-create linear history of messages
            final_msg, history_msgs = create_chat_chain(
                chat_session_id=chat_session_id, db_session=db_session
            )
            if final_msg.message_type != MessageType.USER:
                raise RuntimeError(
                    "The last message was not a user message. Cannot call "
                    "`stream_chat_message_objects` with `is_regenerate=True` "
                    "when the last message is not a user message."
                )

        # Disable Query Rephrasing for the first message
        # This leads to a better first response since the LLM rephrasing the question
        # leads to worst search quality
        if not history_msgs:
            new_msg_req.query_override = (
                new_msg_req.query_override or new_msg_req.message
            )

        # load all files needed for this chat chain in memory
        files = load_all_chat_files(
            history_msgs, new_msg_req.file_descriptors, db_session
        )
        latest_query_files = [
            file
            for file in files
            if file.file_id in [f["id"] for f in new_msg_req.file_descriptors]
        ]

        if user_message:
            attach_files_to_chat_message(
                chat_message=user_message,
                files=[
                    new_file.to_file_descriptor() for new_file in latest_query_files
                ],
                db_session=db_session,
                commit=False,
            )

        selected_db_search_docs = None
        selected_sections: list[InferenceSection] | None = None
        if reference_doc_ids:
            identifier_tuples = get_doc_query_identifiers_from_model(
                search_doc_ids=reference_doc_ids,
                chat_session=chat_session,
                user_id=user_id,
                db_session=db_session,
                enforce_chat_session_id_for_search_docs=enforce_chat_session_id_for_search_docs,
            )

            # Generates full documents currently
            # May extend to use sections instead in the future
            selected_sections = inference_sections_from_ids(
                doc_identifiers=identifier_tuples,
                document_index=document_index,
            )
            document_pruning_config = DocumentPruningConfig(
                is_manually_selected_docs=True
            )

            # In case the search doc is deleted, just don't include it
            # though this should never happen
            db_search_docs_or_none = [
                get_db_search_doc_by_id(doc_id=doc_id, db_session=db_session)
                for doc_id in reference_doc_ids
            ]

            selected_db_search_docs = [
                db_sd for db_sd in db_search_docs_or_none if db_sd
            ]

        else:
            document_pruning_config = DocumentPruningConfig(
                max_chunks=int(
                    assistant.num_chunks
                    if assistant.num_chunks is not None
                    else default_num_chunks
                ),
                max_window_percentage=max_document_percentage,
            )
        reserved_message_id = reserve_message_id(
            db_session=db_session,
            chat_session_id=chat_session_id,
            parent_message=user_message.id
            if user_message is not None
            else parent_message.id,
            message_type=MessageType.ASSISTANT,
        )
        yield MessageResponseIDInfo(
            user_message_id=user_message.id if user_message else None,
            reserved_assistant_message_id=reserved_message_id,
        )

        overridden_model = (
            new_msg_req.llm_override.model_version if new_msg_req.llm_override else None
        )

        # Cannot determine these without the LLM step or breaking out early
        partial_response = partial(
            create_new_chat_message,
            chat_session_id=chat_session_id,
            parent_message=final_msg,
            prompt_id=prompt_id,
            overridden_model=overridden_model,
            # message=,
            # rephrased_query=,
            # token_count=,
            message_type=MessageType.ASSISTANT,
            alternate_assistant_id=new_msg_req.alternate_assistant_id,
            # error=,
            # reference_docs=,
            db_session=db_session,
            commit=False,
        )

        if not final_msg.prompt:
            raise RuntimeError("No Prompt found")

        prompt_config = (
            PromptConfig.from_model(
                final_msg.prompt,
                prompt_override=(
                    new_msg_req.prompt_override or chat_session.prompt_override
                ),
            )
            if not assistant
            else PromptConfig.from_model(assistant.prompts[0])
        )

        # find out what tools to use
        search_tool: SearchTool | None = None
        tool_dict: dict[int, list[Tool]] = {}  # tool_id to tool
        for db_tool_model in assistant.tools:
            # handle in-code tools specially
            if db_tool_model.in_code_tool_id:
                tool_cls = get_built_in_tool_by_id(db_tool_model.id, db_session)
                if tool_cls.__name__ == SearchTool.__name__ and not latest_query_files:
                    search_tool = SearchTool(
                        db_session=db_session,
                        user=user,
                        assistant=assistant,
                        retrieval_options=retrieval_options,
                        prompt_config=prompt_config,
                        llm=llm,
                        fast_llm=fast_llm,
                        pruning_config=document_pruning_config,
                        selected_sections=selected_sections,
                        chunks_above=new_msg_req.chunks_above,
                        chunks_below=new_msg_req.chunks_below,
                        full_doc=new_msg_req.full_doc,
                        evaluation_type=LLMEvaluationType.BASIC
                        if assistant.llm_relevance_filter
                        else LLMEvaluationType.SKIP,
                    )
                    tool_dict[db_tool_model.id] = [search_tool]
                elif tool_cls.__name__ == ImageGenerationTool.__name__:
                    img_generation_llm_config: LLMConfig | None = None
                    if (
                        llm
                        and llm.config.api_key
                        and llm.config.model_provider == "openai"
                    ):
                        img_generation_llm_config = llm.config
                    else:
                        llm_providers = fetch_existing_llm_providers(db_session)
                        openai_provider = next(
                            iter(
                                [
                                    llm_provider
                                    for llm_provider in llm_providers
                                    if llm_provider.provider == "openai"
                                ]
                            ),
                            None,
                        )
                        if not openai_provider or not openai_provider.api_key:
                            raise ValueError(
                                "Image generation tool requires an OpenAI API key"
                            )
                        img_generation_llm_config = LLMConfig(
                            model_provider=openai_provider.provider,
                            model_name=openai_provider.default_model_name,
                            temperature=GEN_AI_TEMPERATURE,
                            api_key=openai_provider.api_key,
                            api_base=openai_provider.api_base,
                            api_version=openai_provider.api_version,
                        )
                    tool_dict[db_tool_model.id] = [
                        ImageGenerationTool(
                            api_key=cast(str, img_generation_llm_config.api_key),
                            api_base=img_generation_llm_config.api_base,
                            api_version=img_generation_llm_config.api_version,
                            additional_headers=litellm_additional_headers,
                        )
                    ]
                elif tool_cls.__name__ == InternetSearchTool.__name__:
                    bing_api_key = BING_API_KEY
                    if not bing_api_key:
                        raise ValueError(
                            "Internet search tool requires a Bing API key, please contact your Arnold AI admin to get it added!"
                        )
                    tool_dict[db_tool_model.id] = [
                        InternetSearchTool(api_key=bing_api_key)
                    ]

                continue

            # handle all custom tools
            if db_tool_model.openapi_schema:
                tool_dict[db_tool_model.id] = cast(
                    list[Tool],
                    build_custom_tools_from_openapi_schema_and_headers(
                        db_tool_model.openapi_schema,
                        dynamic_schema_info=DynamicSchemaInfo(
                            chat_session_id=chat_session_id,
                            message_id=user_message.id if user_message else None,
                        ),
                        custom_headers=db_tool_model.custom_headers,
                    ),
                )

        tools: list[Tool] = []
        for tool_list in tool_dict.values():
            tools.extend(tool_list)

        # factor in tool definition size when pruning
        document_pruning_config.tool_num_tokens = compute_all_tool_tokens(
            tools, llm_tokenizer
        )
        document_pruning_config.using_tool_message = explicit_tool_calling_supported(
            llm_provider, llm_model_name
        )

        # LLM prompt building, response capturing, etc.
        answer = Answer(
            is_connected=is_connected,
            question=final_msg.message,
            latest_query_files=latest_query_files,
            answer_style_config=AnswerStyleConfig(
                citation_config=CitationConfig(
                    all_docs_useful=selected_db_search_docs is not None
                ),
                document_pruning_config=document_pruning_config,
            ),
            prompt_config=prompt_config,
            llm=(
                llm
                or get_main_llm_from_tuple(
                    get_llms_for_assistant(
                        assistant=assistant,
                        llm_override=(
                            new_msg_req.llm_override or chat_session.llm_override
                        ),
                        additional_headers=litellm_additional_headers,
                    )
                )
            ),
            message_history=[
                PreviousMessage.from_chat_message(msg, files) for msg in history_msgs
            ],
            tools=tools,
            force_use_tool=_get_force_search_settings(new_msg_req, tools),
        )

        reference_db_search_docs = None
        qa_docs_response = None
        ai_message_files = None  # any files to associate with the AI message e.g. dall-e generated images
        dropped_indices = None
        tool_result = None

        for packet in answer.processed_streamed_output:
            if isinstance(packet, ToolResponse):
                if packet.id == SEARCH_RESPONSE_SUMMARY_ID:
                    (
                        qa_docs_response,
                        reference_db_search_docs,
                        dropped_indices,
                    ) = _handle_search_tool_response_summary(
                        packet=packet,
                        db_session=db_session,
                        selected_search_docs=selected_db_search_docs,
                        # Deduping happens at the last step to avoid harming quality by dropping content early on
                        dedupe_docs=(
                            retrieval_options.dedupe_docs
                            if retrieval_options
                            else False
                        ),
                    )
                    yield qa_docs_response
                elif packet.id == SECTION_RELEVANCE_LIST_ID:
                    relevance_sections = packet.response

                    if reference_db_search_docs is not None:
                        llm_indices = relevant_sections_to_indices(
                            relevance_sections=relevance_sections,
                            items=[
                                translate_db_search_doc_to_server_search_doc(doc)
                                for doc in reference_db_search_docs
                            ],
                        )

                        if dropped_indices:
                            llm_indices = drop_llm_indices(
                                llm_indices=llm_indices,
                                search_docs=reference_db_search_docs,
                                dropped_indices=dropped_indices,
                            )

                        yield LLMRelevanceFilterResponse(
                            llm_selected_doc_indices=llm_indices
                        )

                elif packet.id == FINAL_CONTEXT_DOCUMENTS_ID:
                    yield FinalUsedContextDocsResponse(
                        final_context_docs=packet.response
                    )

                elif packet.id == IMAGE_GENERATION_RESPONSE_ID:
                    img_generation_response = cast(
                        list[ImageGenerationResponse], packet.response
                    )

                    file_ids = save_files_from_urls(
                        [img.url for img in img_generation_response]
                    )
                    ai_message_files = [
                        FileDescriptor(id=str(file_id), type=ChatFileType.IMAGE)
                        for file_id in file_ids
                    ]
                    yield ImageGenerationDisplay(
                        file_ids=[str(file_id) for file_id in file_ids]
                    )
                elif packet.id == INTERNET_SEARCH_RESPONSE_ID:
                    (
                        qa_docs_response,
                        reference_db_search_docs,
                    ) = _handle_internet_search_tool_response_summary(
                        packet=packet,
                        db_session=db_session,
                    )
                    yield qa_docs_response
                elif packet.id == CUSTOM_TOOL_RESPONSE_ID:
                    custom_tool_response = cast(CustomToolCallSummary, packet.response)
                    yield CustomToolResponse(
                        response=custom_tool_response.tool_result,
                        tool_name=custom_tool_response.tool_name,
                    )

            else:
                if isinstance(packet, ToolCallFinalResult):
                    tool_result = packet
                yield cast(ChatPacket, packet)
        logger.debug("Reached end of stream")
    except ValueError as e:
        logger.exception("Failed to process chat message.")

        error_msg = str(e)
        yield StreamingError(error=error_msg)
        db_session.rollback()
        return

    except Exception as e:
        logger.exception("Failed to process chat message.")

        error_msg = str(e)
        stack_trace = traceback.format_exc()
        client_error_msg = litellm_exception_to_error_msg(e, llm)
        if llm.config.api_key and len(llm.config.api_key) > 2:
            error_msg = error_msg.replace(llm.config.api_key, "[REDACTED_API_KEY]")
            stack_trace = stack_trace.replace(llm.config.api_key, "[REDACTED_API_KEY]")

        yield StreamingError(error=client_error_msg, stack_trace=stack_trace)
        db_session.rollback()
        return

    # Post-LLM answer processing
    try:
        message_specific_citations: MessageSpecificCitations | None = None
        if reference_db_search_docs:
            message_specific_citations = _translate_citations(
                citations_list=answer.citations,
                db_docs=reference_db_search_docs,
            )
            yield AllCitations(citations=answer.citations)

        # Saving Gen AI answer and responding with message info
        tool_name_to_tool_id: dict[str, int] = {}
        for tool_id, tool_list in tool_dict.items():
            for tool in tool_list:
                tool_name_to_tool_id[tool.name] = tool_id

        gen_ai_response_message = partial_response(
            reserved_message_id=reserved_message_id,
            message=answer.llm_answer,
            rephrased_query=(
                qa_docs_response.rephrased_query if qa_docs_response else None
            ),
            reference_docs=reference_db_search_docs,
            files=ai_message_files,
            token_count=len(llm_tokenizer_encode_func(answer.llm_answer)),
            citations=message_specific_citations.citation_map
            if message_specific_citations
            else None,
            error=None,
            tool_calls=(
                [
                    ToolCall(
                        tool_id=tool_name_to_tool_id[tool_result.tool_name],
                        tool_name=tool_result.tool_name,
                        tool_arguments=tool_result.tool_args,
                        tool_result=tool_result.tool_result,
                    )
                ]
                if tool_result
                else []
            ),
        )

        logger.debug("Committing messages")
        db_session.commit()  # actually save user / assistant message

        msg_detail_response = translate_db_message_to_chat_message_detail(
            gen_ai_response_message
        )

        yield msg_detail_response
    except Exception as e:
        error_msg = str(e)
        logger.exception(error_msg)

        # Frontend will erase whatever answer and show this instead
        yield StreamingError(error="Failed to parse LLM output")


@log_generator_function_time()
def stream_chat_message(
    new_msg_req: CreateChatMessageRequest,
    user: User | None,
    use_existing_user_message: bool = False,
    litellm_additional_headers: dict[str, str] | None = None,
    is_connected: Callable[[], bool] | None = None,
) -> Iterator[str]:
    with get_session_context_manager() as db_session:
        objects = stream_chat_message_objects(
            new_msg_req=new_msg_req,
            user=user,
            db_session=db_session,
            use_existing_user_message=use_existing_user_message,
            litellm_additional_headers=litellm_additional_headers,
            is_connected=is_connected,
        )
        for obj in objects:
            yield get_json_line(obj.model_dump())
