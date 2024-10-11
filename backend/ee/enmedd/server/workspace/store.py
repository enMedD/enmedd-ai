import os
from io import BytesIO
from typing import Any
from typing import cast
from typing import IO

from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi import UploadFile
from sqlalchemy.orm import Session

from ee.enmedd.server.workspace.models import AnalyticsScriptUpload
from enmedd.configs.constants import FileOrigin
from enmedd.db.models import User
from enmedd.dynamic_configs.factory import get_dynamic_config_store
from enmedd.dynamic_configs.interface import ConfigNotFoundError
from enmedd.file_store.file_store import get_default_file_store
from enmedd.utils.logger import setup_logger

load_dotenv()
# TODO : replace the value name
logger = setup_logger()

_CUSTOM_ANALYTICS_SCRIPT_KEY = "__custom_analytics_script__"
_CUSTOM_ANALYTICS_SECRET_KEY = os.environ.get("CUSTOM_ANALYTICS_SECRET_KEY")


def load_analytics_script() -> str | None:
    dynamic_config_store = get_dynamic_config_store()
    try:
        return cast(str, dynamic_config_store.load(_CUSTOM_ANALYTICS_SCRIPT_KEY))
    except ConfigNotFoundError:
        return None


def store_analytics_script(analytics_script_upload: AnalyticsScriptUpload) -> None:
    if (
        not _CUSTOM_ANALYTICS_SECRET_KEY
        or analytics_script_upload.secret_key != _CUSTOM_ANALYTICS_SECRET_KEY
    ):
        raise ValueError("Invalid secret key")

    get_dynamic_config_store().store(
        _CUSTOM_ANALYTICS_SCRIPT_KEY, analytics_script_upload.script
    )


_LOGO_FILENAME = "__logo__"
_PROFILE_FILENAME = "__profile__"


def is_valid_file_type(filename: str) -> bool:
    valid_extensions = (".png", ".jpg", ".jpeg")
    return filename.endswith(valid_extensions)


def guess_file_type(filename: str) -> str:
    if filename.lower().endswith(".png"):
        return "image/png"
    elif filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
        return "image/jpeg"
    return "application/octet-stream"


def upload_logo(
    db_session: Session,
    file: UploadFile | str,
) -> bool:
    content: IO[Any]

    if isinstance(file, str):
        logger.info(f"Uploading logo from local path {file}")
        if not os.path.isfile(file) or not is_valid_file_type(file):
            logger.error(
                "Invalid file type- only .png, .jpg, and .jpeg files are allowed"
            )
            return False

        with open(file, "rb") as file_handle:
            file_content = file_handle.read()
        content = BytesIO(file_content)
        display_name = file
        file_type = guess_file_type(file)

    else:
        logger.info("Uploading logo from uploaded file")
        if not file.filename or not is_valid_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type- only .png, .jpg, and .jpeg files are allowed",
            )
        content = file.file
        display_name = file.filename
        file_type = file.content_type or "image/jpeg"

    file_store = get_default_file_store(db_session)
    file_store.save_file(
        file_name=_LOGO_FILENAME,
        content=content,
        display_name=display_name,
        file_origin=FileOrigin.OTHER,
        file_type=file_type,
    )
    return True


def upload_profile(db_session: Session, file: UploadFile | str, user: User) -> bool:
    content: IO[Any]

    if isinstance(file, str):
        logger.info(f"Uploading profile from local path {file}")
        if not os.path.isfile(file) or not is_valid_file_type(file):
            logger.error(
                "Invalid file type - only .png, .jpg, and .jpeg files are allowed"
            )
            return False

        with open(file, "rb") as file_handle:
            file_content = file_handle.read()
        content = BytesIO(file_content)
        display_name = file
        file_type = guess_file_type(file)

    else:
        logger.info("Uploading profile from uploaded file")
        if not file.filename or not is_valid_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type - only .png, .jpg, and .jpeg files are allowed",
            )
        content = file.file
        display_name = file.filename
        file_type = file.content_type or "image/jpeg"

    file_name = f"{user.id}/{_PROFILE_FILENAME}"

    file_store = get_default_file_store(db_session)
    file_store.save_file(
        file_name=file_name,
        content=content,
        display_name=display_name,
        file_origin=FileOrigin.OTHER,
        file_type=file_type,
    )
    return True


def upload_teamspace_logo(
    db_session: Session,
    teamspace_id: int,
    file: UploadFile | str,
) -> bool:
    content: IO[Any]

    if isinstance(file, str):
        logger.info(f"Uploading teamspace logo from local path {file}")
        if not os.path.isfile(file) or not is_valid_file_type(file):
            logger.error(
                "Invalid file type - only .png, .jpg, and .jpeg files are allowed"
            )
            return False

        with open(file, "rb") as file_handle:
            file_content = file_handle.read()
        content = BytesIO(file_content)
        display_name = file
        file_type = guess_file_type(file)

    else:
        logger.info("Uploading teamspace logo from uploaded file")
        if not file.filename or not is_valid_file_type(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type - only .png, .jpg, and .jpeg files are allowed",
            )
        content = file.file
        display_name = file.filename
        file_type = file.content_type or "image/jpeg"

    file_name = f"{teamspace_id}/{_LOGO_FILENAME}"

    file_store = get_default_file_store(db_session)
    file_store.save_file(
        file_name=file_name,
        content=content,
        display_name=display_name,
        file_origin=FileOrigin.OTHER,
        file_type=file_type,
    )
    return True
