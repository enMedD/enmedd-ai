import concurrent.futures
import json
from datetime import datetime
from datetime import timezone

import httpx
from retry import retry

from enmedd.connectors.cross_connector_utils.miscellaneous_utils import (
    get_experts_stores_representations,
)
from enmedd.document_index.document_index_utils import get_uuid_from_chunk
from enmedd.document_index.vespa.shared_utils.utils import remove_invalid_unicode_chars
from enmedd.document_index.vespa.shared_utils.utils import (
    replace_invalid_doc_id_characters,
)
from enmedd.document_index.vespa_constants import ACCESS_CONTROL_LIST
from enmedd.document_index.vespa_constants import BLURB
from enmedd.document_index.vespa_constants import BOOST
from enmedd.document_index.vespa_constants import CHUNK_ID
from enmedd.document_index.vespa_constants import CONTENT
from enmedd.document_index.vespa_constants import CONTENT_SUMMARY
from enmedd.document_index.vespa_constants import DOC_UPDATED_AT
from enmedd.document_index.vespa_constants import DOCUMENT_ID
from enmedd.document_index.vespa_constants import DOCUMENT_ID_ENDPOINT
from enmedd.document_index.vespa_constants import DOCUMENT_SETS
from enmedd.document_index.vespa_constants import EMBEDDINGS
from enmedd.document_index.vespa_constants import LARGE_CHUNK_REFERENCE_IDS
from enmedd.document_index.vespa_constants import METADATA
from enmedd.document_index.vespa_constants import METADATA_LIST
from enmedd.document_index.vespa_constants import METADATA_SUFFIX
from enmedd.document_index.vespa_constants import NUM_THREADS
from enmedd.document_index.vespa_constants import PRIMARY_OWNERS
from enmedd.document_index.vespa_constants import SECONDARY_OWNERS
from enmedd.document_index.vespa_constants import SECTION_CONTINUATION
from enmedd.document_index.vespa_constants import SEMANTIC_IDENTIFIER
from enmedd.document_index.vespa_constants import SKIP_TITLE_EMBEDDING
from enmedd.document_index.vespa_constants import SOURCE_LINKS
from enmedd.document_index.vespa_constants import SOURCE_TYPE
from enmedd.document_index.vespa_constants import TITLE
from enmedd.document_index.vespa_constants import TITLE_EMBEDDING
from enmedd.indexing.models import DocMetadataAwareIndexChunk
from enmedd.utils.logger import setup_logger

logger = setup_logger()


@retry(tries=3, delay=1, backoff=2)
def _does_document_exist(
    doc_chunk_id: str,
    index_name: str,
    http_client: httpx.Client,
) -> bool:
    """Returns whether the document already exists and the users/group whitelists
    Specifically in this case, document refers to a vespa document which is equivalent to a Vanguard AI
    chunk. This checks for whether the chunk exists already in the index"""
    doc_url = f"{DOCUMENT_ID_ENDPOINT.format(index_name=index_name)}/{doc_chunk_id}"
    doc_fetch_response = http_client.get(doc_url)

    if doc_fetch_response.status_code == 404:
        return False

    if doc_fetch_response.status_code != 200:
        logger.debug(f"Failed to check for document with URL {doc_url}")
        raise RuntimeError(
            f"Unexpected fetch document by ID value from Vespa "
            f"with error {doc_fetch_response.status_code}"
        )
    return True


def _vespa_get_updated_at_attribute(t: datetime | None) -> int | None:
    if not t:
        return None

    if t.tzinfo != timezone.utc:
        raise ValueError("Connectors must provide document update time in UTC")

    return int(t.timestamp())


def get_existing_documents_from_chunks(
    chunks: list[DocMetadataAwareIndexChunk],
    index_name: str,
    http_client: httpx.Client,
    executor: concurrent.futures.ThreadPoolExecutor | None = None,
) -> set[str]:
    external_executor = True

    if not executor:
        external_executor = False
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=NUM_THREADS)

    document_ids: set[str] = set()
    try:
        chunk_existence_future = {
            executor.submit(
                _does_document_exist,
                str(get_uuid_from_chunk(chunk)),
                index_name,
                http_client,
            ): chunk
            for chunk in chunks
        }
        for future in concurrent.futures.as_completed(chunk_existence_future):
            chunk = chunk_existence_future[future]
            chunk_already_existed = future.result()
            if chunk_already_existed:
                document_ids.add(chunk.source_document.id)

    finally:
        if not external_executor:
            executor.shutdown(wait=True)

    return document_ids


@retry(tries=3, delay=1, backoff=2)
def _index_vespa_chunk(
    chunk: DocMetadataAwareIndexChunk, index_name: str, http_client: httpx.Client
) -> None:
    json_header = {
        "Content-Type": "application/json",
    }
    document = chunk.source_document

    # No minichunk documents in vespa, minichunk vectors are stored in the chunk itself
    vespa_chunk_id = str(get_uuid_from_chunk(chunk))
    embeddings = chunk.embeddings

    embeddings_name_vector_map = {"full_chunk": embeddings.full_embedding}

    if embeddings.mini_chunk_embeddings:
        for ind, m_c_embed in enumerate(embeddings.mini_chunk_embeddings):
            embeddings_name_vector_map[f"mini_chunk_{ind}"] = m_c_embed

    title = document.get_title_for_document_index()

    vespa_document_fields = {
        DOCUMENT_ID: document.id,
        CHUNK_ID: chunk.chunk_id,
        BLURB: remove_invalid_unicode_chars(chunk.blurb),
        TITLE: remove_invalid_unicode_chars(title) if title else None,
        SKIP_TITLE_EMBEDDING: not title,
        # For the BM25 index, the keyword suffix is used, the vector is already generated with the more
        # natural language representation of the metadata section
        CONTENT: remove_invalid_unicode_chars(
            f"{chunk.title_prefix}{chunk.content}{chunk.metadata_suffix_keyword}"
        ),
        # This duplication of `content` is needed for keyword highlighting
        # Note that it's not exactly the same as the actual content
        # which contains the title prefix and metadata suffix
        CONTENT_SUMMARY: remove_invalid_unicode_chars(chunk.content),
        SOURCE_TYPE: str(document.source.value),
        SOURCE_LINKS: json.dumps(chunk.source_links),
        SEMANTIC_IDENTIFIER: remove_invalid_unicode_chars(document.semantic_identifier),
        SECTION_CONTINUATION: chunk.section_continuation,
        LARGE_CHUNK_REFERENCE_IDS: chunk.large_chunk_reference_ids,
        METADATA: json.dumps(document.metadata),
        # Save as a list for efficient extraction as an Attribute
        METADATA_LIST: chunk.source_document.get_metadata_str_attributes(),
        METADATA_SUFFIX: chunk.metadata_suffix_keyword,
        EMBEDDINGS: embeddings_name_vector_map,
        TITLE_EMBEDDING: chunk.title_embedding,
        DOC_UPDATED_AT: _vespa_get_updated_at_attribute(document.doc_updated_at),
        PRIMARY_OWNERS: get_experts_stores_representations(document.primary_owners),
        SECONDARY_OWNERS: get_experts_stores_representations(document.secondary_owners),
        # the only `set` vespa has is `weightedset`, so we have to give each
        # element an arbitrary weight
        # rkuo: acl, docset and boost metadata are also updated through the metadata sync queue
        # which only calls VespaIndex.update
        ACCESS_CONTROL_LIST: {acl_entry: 1 for acl_entry in chunk.access.to_acl()},
        DOCUMENT_SETS: {document_set: 1 for document_set in chunk.document_sets},
        BOOST: chunk.boost,
    }

    vespa_url = f"{DOCUMENT_ID_ENDPOINT.format(index_name=index_name)}/{vespa_chunk_id}"
    logger.debug(f'Indexing to URL "{vespa_url}"')
    res = http_client.post(
        vespa_url, headers=json_header, json={"fields": vespa_document_fields}
    )
    try:
        res.raise_for_status()
    except Exception as e:
        logger.exception(
            f"Failed to index document: '{document.id}'. Got response: '{res.text}'"
        )
        raise e


def batch_index_vespa_chunks(
    chunks: list[DocMetadataAwareIndexChunk],
    index_name: str,
    http_client: httpx.Client,
    executor: concurrent.futures.ThreadPoolExecutor | None = None,
) -> None:
    external_executor = True

    if not executor:
        external_executor = False
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=NUM_THREADS)

    try:
        chunk_index_future = {
            executor.submit(_index_vespa_chunk, chunk, index_name, http_client): chunk
            for chunk in chunks
        }
        for future in concurrent.futures.as_completed(chunk_index_future):
            # Will raise exception if any indexing raised an exception
            future.result()

    finally:
        if not external_executor:
            executor.shutdown(wait=True)


def clean_chunk_id_copy(
    chunk: DocMetadataAwareIndexChunk,
) -> DocMetadataAwareIndexChunk:
    clean_chunk = chunk.copy(
        update={
            "source_document": chunk.source_document.copy(
                update={
                    "id": replace_invalid_doc_id_characters(chunk.source_document.id)
                }
            )
        }
    )
    return clean_chunk