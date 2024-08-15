from fastapi import APIRouter

from enmedd_ai import __version__
from enmedd_ai.auth.users import user_needs_to_be_verified
from enmedd_ai.configs.app_configs import AUTH_TYPE
from enmedd_ai.server.manage.models import AuthTypeResponse
from enmedd_ai.server.manage.models import VersionResponse
from enmedd_ai.server.models import StatusResponse

router = APIRouter()


@router.get("/health")
def healthcheck() -> StatusResponse:
    return StatusResponse(success=True, message="ok")


@router.get("/auth/type")
def get_auth_type() -> AuthTypeResponse:
    return AuthTypeResponse(
        auth_type=AUTH_TYPE, requires_verification=user_needs_to_be_verified()
    )


@router.get("/version")
def get_version() -> VersionResponse:
    return VersionResponse(backend_version=__version__)
