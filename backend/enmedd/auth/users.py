import uuid
from collections.abc import AsyncGenerator
from typing import Optional
from typing import Tuple

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from fastapi import Response
from fastapi import status
from fastapi_users import BaseUserManager
from fastapi_users import FastAPIUsers
from fastapi_users import models
from fastapi_users import schemas
from fastapi_users import UUIDIDMixin
from fastapi_users.authentication import AuthenticationBackend
from fastapi_users.authentication import CookieTransport
from fastapi_users.authentication import Strategy
from fastapi_users.authentication.strategy.db import AccessTokenDatabase
from fastapi_users.authentication.strategy.db import DatabaseStrategy
from fastapi_users.openapi import OpenAPIResponseType
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.orm import Session

from enmedd.auth.invited_users import get_invited_users
from enmedd.auth.schemas import UserCreate
from enmedd.auth.schemas import UserRole
from enmedd.auth.utils import generate_password_reset_email
from enmedd.auth.utils import generate_user_verification_email
from enmedd.auth.utils import send_reset_password_email
from enmedd.auth.utils import send_user_verification_email
from enmedd.configs.app_configs import AUTH_TYPE
from enmedd.configs.app_configs import DISABLE_AUTH
from enmedd.configs.app_configs import REQUIRE_EMAIL_VERIFICATION
from enmedd.configs.app_configs import SESSION_EXPIRE_TIME_SECONDS
from enmedd.configs.app_configs import USER_AUTH_SECRET
from enmedd.configs.app_configs import VALID_EMAIL_DOMAINS
from enmedd.configs.app_configs import WEB_DOMAIN
from enmedd.configs.constants import API_KEY_DUMMY_EMAIL_DOMAIN
from enmedd.configs.constants import API_KEY_PREFIX
from enmedd.configs.constants import AuthType
from enmedd.configs.constants import UNNAMED_KEY_PLACEHOLDER
from enmedd.db.auth import get_access_token_db
from enmedd.db.auth import get_default_admin_user_emails
from enmedd.db.auth import get_user_count
from enmedd.db.auth import get_user_db
from enmedd.db.engine import get_session
from enmedd.db.models import AccessToken
from enmedd.db.models import User
from enmedd.db.models import User__Teamspace
from enmedd.utils.logger import setup_logger
from enmedd.utils.telemetry import optional_telemetry
from enmedd.utils.telemetry import RecordType
from enmedd.utils.variable_functionality import (
    fetch_versioned_implementation,
)


logger = setup_logger()


def verify_auth_setting() -> None:
    if AUTH_TYPE not in [AuthType.DISABLED, AuthType.BASIC, AuthType.GOOGLE_OAUTH]:
        raise ValueError(
            "User must choose a valid user authentication method: "
            "disabled, basic, or google_oauth"
        )
    logger.info(f"Using Auth Type: {AUTH_TYPE.value}")


def get_display_email(email: str | None, space_less: bool = False) -> str:
    if email and email.endswith(API_KEY_DUMMY_EMAIL_DOMAIN):
        name = email.split("@")[0]
        # TODO: change env variable name
        if name == API_KEY_PREFIX + UNNAMED_KEY_PLACEHOLDER:
            return "Unnamed API Key"

        if space_less:
            return name

        return name.replace("API_KEY__", "API Key: ")

    return email or ""


def user_needs_to_be_verified() -> bool:
    # all other auth types besides basic should require users to be
    # verified
    return AUTH_TYPE != AuthType.BASIC or REQUIRE_EMAIL_VERIFICATION


def verify_email_in_whitelist(email: str) -> None:
    whitelist = get_invited_users()
    if (whitelist and email not in whitelist) or not email:
        raise PermissionError("User not on allowed user whitelist")


def verify_email_domain(email: str) -> None:
    if VALID_EMAIL_DOMAINS:
        if email.count("@") != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is not valid",
            )
        domain = email.split("@")[-1]
        if domain not in VALID_EMAIL_DOMAINS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email domain is not valid",
            )


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = USER_AUTH_SECRET
    verification_token_secret = USER_AUTH_SECRET

    async def create(
        self,
        user_create: schemas.UC | UserCreate,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> models.UP:
        verify_email_in_whitelist(user_create.email)
        verify_email_domain(user_create.email)
        if hasattr(user_create, "role"):
            user_count = await get_user_count()
            if user_count == 0 or user_create.email in get_default_admin_user_emails():
                user_create.role = UserRole.ADMIN
            else:
                user_create.role = UserRole.BASIC
        return await super().create(user_create, safe=safe, request=request)  # type: ignore

    async def oauth_callback(
        self: "BaseUserManager[models.UOAP, models.ID]",
        oauth_name: str,
        access_token: str,
        account_id: str,
        account_email: str,
        expires_at: Optional[int] = None,
        refresh_token: Optional[str] = None,
        request: Optional[Request] = None,
        *,
        associate_by_email: bool = False,
        is_verified_by_default: bool = False,
    ) -> models.UOAP:
        verify_email_in_whitelist(account_email)
        verify_email_domain(account_email)

        return await super().oauth_callback(  # type: ignore
            oauth_name=oauth_name,
            access_token=access_token,
            account_id=account_id,
            account_email=account_email,
            expires_at=expires_at,
            refresh_token=refresh_token,
            request=request,
            associate_by_email=associate_by_email,
            is_verified_by_default=is_verified_by_default,
        )

    async def on_after_register(
        self, user: User, request: Optional[Request] = None
    ) -> None:
        logger.info(f"User {user.id} has registered.")
        optional_telemetry(
            record_type=RecordType.SIGN_UP,
            data={"action": "create"},
            user_id=str(user.id),
        )

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        logger.info(f"User {user.id} has forgot their password. Reset token: {token}")

        reset_url = f"{WEB_DOMAIN}/auth/reset-password?token={token}"
        subject, body = generate_password_reset_email(user.email, reset_url)
        send_reset_password_email(user.email, subject, body)

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        verify_email_domain(user.email)
        logger.info(
            f"Verification requested for user {user.id}. Verification token: {token}"
        )
        link = f"{WEB_DOMAIN}/auth/verify-email?token={token}"
        subject, body = generate_user_verification_email(user.full_name, link)
        send_user_verification_email(user.email, subject, body)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


cookie_transport = CookieTransport(
    cookie_max_age=SESSION_EXPIRE_TIME_SECONDS,
    cookie_secure=WEB_DOMAIN.startswith("https"),
)


def get_database_strategy(
    access_token_db: AccessTokenDatabase[AccessToken] = Depends(get_access_token_db),
) -> DatabaseStrategy:
    return DatabaseStrategy(
        access_token_db, lifetime_seconds=SESSION_EXPIRE_TIME_SECONDS  # type: ignore
    )


auth_backend = AuthenticationBackend(
    name="database",
    transport=cookie_transport,
    get_strategy=get_database_strategy,
)


class FastAPIUserWithLogoutRouter(FastAPIUsers[models.UP, models.ID]):
    def get_logout_router(
        self,
        backend: AuthenticationBackend,
        requires_verification: bool = REQUIRE_EMAIL_VERIFICATION,
    ) -> APIRouter:
        """
        Provide a router for logout only for OAuth/OIDC Flows.
        This way the login router does not need to be included
        """
        router = APIRouter()
        get_current_user_token = self.authenticator.current_user_token(
            active=True, verified=requires_verification
        )
        logout_responses: OpenAPIResponseType = {
            **{
                status.HTTP_401_UNAUTHORIZED: {
                    "description": "Missing token or inactive user."
                }
            },
            **backend.transport.get_openapi_logout_responses_success(),
        }

        @router.post(
            "/logout", name=f"auth:{backend.name}.logout", responses=logout_responses
        )
        async def logout(
            user_token: Tuple[models.UP, str] = Depends(get_current_user_token),
            strategy: Strategy[models.UP, models.ID] = Depends(backend.get_strategy),
        ) -> Response:
            user, token = user_token
            return await backend.logout(strategy, user, token)

        return router


fastapi_users = FastAPIUserWithLogoutRouter[User, uuid.UUID](
    get_user_manager, [auth_backend]
)


# NOTE: verified=REQUIRE_EMAIL_VERIFICATION is not used here since we
# take care of that in `double_check_user` ourself. This is needed, since
# we want the /me endpoint to still return a user even if they are not
# yet verified, so that the frontend knows they exist
optional_fastapi_current_user = fastapi_users.current_user(active=True, optional=True)


async def optional_user_(
    request: Request,
    user: User | None,
    db_session: Session,
) -> User | None:
    """NOTE: `request` and `db_session` are not used here, but are included
    for the EE version of this function."""
    return user


async def optional_user(
    request: Request,
    user: User | None = Depends(optional_fastapi_current_user),
    db_session: Session = Depends(get_session),
) -> User | None:
    versioned_fetch_user = fetch_versioned_implementation(
        "enmedd.auth.users", "optional_user_"
    )
    return await versioned_fetch_user(request, user, db_session)


async def double_check_user(
    user: User | None,
    optional: bool = DISABLE_AUTH,
) -> User | None:
    if optional:
        return None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not authenticated.",
        )

    if user_needs_to_be_verified() and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not verified.",
        )

    return user


async def current_user(
    user: User | None = Depends(optional_user),
) -> User | None:
    return await double_check_user(user)


async def current_admin_user(user: User | None = Depends(current_user)) -> User | None:
    if DISABLE_AUTH:
        return None

    if not user or not hasattr(user, "role") or user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not an admin.",
        )
    return user


async def current_teamspace_admin_user(
    teamspace_id: Optional[int] = None,
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not authenticated.",
        )

    if teamspace_id is None:
        return await current_admin_user(user=user)

    user_teamspace = (
        db_session.query(User__Teamspace)
        .filter_by(teamspace_id=teamspace_id, user_id=user.id)
        .first()
    )

    if not user_teamspace or user_teamspace.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User is not an admin in this teamspace.",
        )

    return user
