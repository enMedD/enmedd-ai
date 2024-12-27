from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import Response
from sqlalchemy.orm import Session

from enmedd.auth.users import current_user
from enmedd.db.engine import get_session
from enmedd.db.models import User
from enmedd.db.search_settings import get_current_search_settings
from enmedd.document_index.factory import get_default_document_index
from enmedd.document_index.interfaces import VespaChunkRequest
from enmedd.file_store.file_store import get_default_file_store
from enmedd.natural_language_processing.utils import get_tokenizer
from enmedd.prompts.prompt_utils import build_doc_context_str
from enmedd.search.models import IndexFilters
from enmedd.search.preprocessing.access_filters import build_access_filters_for_user
from enmedd.server.documents.models import ChunkInfo
from enmedd.server.documents.models import DocumentInfo
from enmedd.server.documents.models import FileRequest
from enmedd.utils.logger import setup_logger

logger = setup_logger()

router = APIRouter(prefix="/document")


# Have to use a query parameter as FastAPI is interpreting the URL type document_ids
# as a different path
@router.get("/document-size-info")
def get_document_info(
    document_id: str = Query(...),
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> DocumentInfo:
    search_settings = get_current_search_settings(db_session)

    document_index = get_default_document_index(
        primary_index_name=search_settings.index_name, secondary_index_name=None
    )

    user_acl_filters = build_access_filters_for_user(user, db_session)
    inference_chunks = document_index.id_based_retrieval(
        chunk_requests=[VespaChunkRequest(document_id=document_id)],
        filters=IndexFilters(access_control_list=user_acl_filters),
    )

    if not inference_chunks:
        raise HTTPException(status_code=404, detail="Document not found")

    contents = [chunk.content for chunk in inference_chunks]

    combined_contents = "\n".join(contents)

    # get actual document context used for LLM
    first_chunk = inference_chunks[0]
    tokenizer_encode = get_tokenizer(
        provider_type=search_settings.provider_type,
        model_name=search_settings.model_name,
    ).encode
    full_context_str = build_doc_context_str(
        semantic_identifier=first_chunk.semantic_identifier,
        source_type=first_chunk.source_type,
        content=combined_contents,
        metadata_dict=first_chunk.metadata,
        updated_at=first_chunk.updated_at,
        ind=0,
    )

    return DocumentInfo(
        num_chunks=len(inference_chunks),
        num_tokens=len(tokenizer_encode(full_context_str)),
    )


@router.get("/chunk-info")
def get_chunk_info(
    document_id: str = Query(...),
    chunk_id: int = Query(...),
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> ChunkInfo:
    search_settings = get_current_search_settings(db_session)

    document_index = get_default_document_index(
        primary_index_name=search_settings.index_name, secondary_index_name=None
    )

    user_acl_filters = build_access_filters_for_user(user, db_session)
    chunk_request = VespaChunkRequest(
        document_id=document_id,
        min_chunk_ind=chunk_id,
        max_chunk_ind=chunk_id,
    )
    inference_chunks = document_index.id_based_retrieval(
        chunk_requests=[chunk_request],
        filters=IndexFilters(access_control_list=user_acl_filters),
        batch_retrieval=True,
    )

    if not inference_chunks:
        raise HTTPException(status_code=404, detail="Chunk not found")

    chunk_content = inference_chunks[0].content

    tokenizer_encode = get_tokenizer(
        provider_type=search_settings.provider_type,
        model_name=search_settings.model_name,
    ).encode

    return ChunkInfo(
        content=chunk_content, num_tokens=len(tokenizer_encode(chunk_content))
    )


@router.get("/file")
def fetch_documnet_file(
    file_request: FileRequest,
    db_session: Session = Depends(get_session),
    _: User | None = Depends(current_user),
) -> Response:
    try:
        file_name = file_request.file_name
        file_store = get_default_file_store(db_session)

        # Retrieve file metadata to determine the file type
        file_record = file_store.read_file_record(file_name)
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")

        file_type = file_record.file_type.lower()
        file_io = file_store.read_file(file_name, mode="b")

        # Determine the correct media type
        SUPPORTED_FILE_TYPES = {
            "text/plain",
            "application/pdf",
            "text/csv",
            "image/png",
            "application/zip",
            "image/webp",
            "image/jpeg",
            "image/jpg",
        }

        if file_type not in SUPPORTED_FILE_TYPES:
            raise HTTPException(status_code=415, detail="Unsupported file type")

        # Read and return the file content
        return Response(content=file_io.read(), media_type=file_type)
    except Exception as e:
        logger.exception(e)
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve file: {str(e)}"
        )
