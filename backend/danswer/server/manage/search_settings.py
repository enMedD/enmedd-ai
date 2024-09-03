from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from danswer.auth.users import current_admin_user
from danswer.auth.users import current_user
from danswer.configs.app_configs import DISABLE_INDEX_UPDATE_ON_SWAP
from danswer.db.connector_credential_pair import get_connector_credential_pairs
from danswer.db.connector_credential_pair import resync_cc_pair
from danswer.db.engine import get_session
from danswer.db.index_attempt import expire_index_attempts
from danswer.db.models import IndexModelStatus
from danswer.db.models import User
from danswer.db.search_settings import create_search_settings
from danswer.db.search_settings import get_current_search_settings
from danswer.db.search_settings import get_embedding_provider_from_provider_type
from danswer.db.search_settings import get_secondary_search_settings
from danswer.db.search_settings import update_current_search_settings
from danswer.db.search_settings import update_search_settings_status
from danswer.document_index.factory import get_default_document_index
from danswer.natural_language_processing.search_nlp_models import clean_model_name
from danswer.search.models import SavedSearchSettings
from danswer.search.models import SearchSettingsCreationRequest
from danswer.server.manage.models import FullModelVersionResponse
from danswer.server.models import IdReturn
from danswer.utils.logger import setup_logger
from shared_configs.configs import ALT_INDEX_SUFFIX


router = APIRouter(prefix="/search-settings")
logger = setup_logger()


@router.post("/set-new-search-settings")
def set_new_search_settings(
    search_settings_new: SearchSettingsCreationRequest,
    _: User | None = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
) -> IdReturn:
    """Creates a new EmbeddingModel row and cancels the previous secondary indexing if any
    Gives an error if the same model name is used as the current or secondary index
    """
    if search_settings_new.index_name:
        logger.warning("Index name was specified by request, this is not suggested")

    # Validate cloud provider exists or create new LiteLLM provider
    if search_settings_new.provider_type is not None:
        cloud_provider = get_embedding_provider_from_provider_type(
            db_session, provider_type=search_settings_new.provider_type
        )

        if cloud_provider is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No embedding provider exists for cloud embedding type {search_settings_new.provider_type}",
            )

    search_settings = get_current_search_settings(db_session)

    if search_settings_new.index_name is None:
        # We define index name here
        index_name = f"danswer_chunk_{clean_model_name(search_settings_new.model_name)}"
        if (
            search_settings_new.model_name == search_settings.model_name
            and not search_settings.index_name.endswith(ALT_INDEX_SUFFIX)
        ):
            index_name += ALT_INDEX_SUFFIX
        search_values = search_settings_new.dict()
        search_values["index_name"] = index_name
        new_search_settings_request = SavedSearchSettings(**search_values)
    else:
        new_search_settings_request = SavedSearchSettings(**search_settings_new.dict())

    secondary_search_settings = get_secondary_search_settings(db_session)

    if secondary_search_settings:
        # Cancel any background indexing jobs
        expire_index_attempts(
            search_settings_id=secondary_search_settings.id, db_session=db_session
        )

        # Mark previous model as a past model directly
        update_search_settings_status(
            search_settings=secondary_search_settings,
            new_status=IndexModelStatus.PAST,
            db_session=db_session,
        )

    new_search_settings = create_search_settings(
        search_settings=new_search_settings_request, db_session=db_session
    )

    # Ensure Vespa has the new index immediately
    document_index = get_default_document_index(
        primary_index_name=search_settings.index_name,
        secondary_index_name=new_search_settings.index_name,
    )
    document_index.ensure_indices_exist(
        index_embedding_dim=search_settings.model_dim,
        secondary_index_embedding_dim=new_search_settings.model_dim,
    )

    # Pause index attempts for the currently in use index to preserve resources
    if DISABLE_INDEX_UPDATE_ON_SWAP:
        expire_index_attempts(
            search_settings_id=search_settings.id, db_session=db_session
        )
        for cc_pair in get_connector_credential_pairs(db_session):
            resync_cc_pair(cc_pair, db_session=db_session)

    return IdReturn(id=new_search_settings.id)


@router.post("/cancel-new-embedding")
def cancel_new_embedding(
    _: User | None = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
) -> None:
    secondary_search_settings = get_secondary_search_settings(db_session)

    if secondary_search_settings:
        expire_index_attempts(
            search_settings_id=secondary_search_settings.id, db_session=db_session
        )

        update_search_settings_status(
            search_settings=secondary_search_settings,
            new_status=IndexModelStatus.PAST,
            db_session=db_session,
        )


@router.get("/get-current-search-settings")
def get_current_search_settings_endpoint(
    _: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> SavedSearchSettings:
    current_search_settings = get_current_search_settings(db_session)
    return SavedSearchSettings.from_db_model(current_search_settings)


@router.get("/get-secondary-search-settings")
def get_secondary_search_settings_endpoint(
    _: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> SavedSearchSettings | None:
    secondary_search_settings = get_secondary_search_settings(db_session)
    if not secondary_search_settings:
        return None

    return SavedSearchSettings.from_db_model(secondary_search_settings)


@router.get("/get-all-search-settings")
def get_all_search_settings(
    _: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> FullModelVersionResponse:
    current_search_settings = get_current_search_settings(db_session)
    secondary_search_settings = get_secondary_search_settings(db_session)
    return FullModelVersionResponse(
        current_settings=SavedSearchSettings.from_db_model(current_search_settings),
        secondary_settings=SavedSearchSettings.from_db_model(secondary_search_settings)
        if secondary_search_settings
        else None,
    )


# Updates current non-reindex search settings
@router.post("/update-inference-settings")
def update_saved_search_settings(
    search_settings: SavedSearchSettings,
    _: User | None = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
) -> None:
    update_current_search_settings(
        search_settings=search_settings, db_session=db_session
    )