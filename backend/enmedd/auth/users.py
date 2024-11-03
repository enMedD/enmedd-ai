import uuid
from collections.abc import AsyncGenerator
from datetime import datetime
from datetime import timezone
from typing import Optional
from typing import Tuple

from email_validator import EmailNotValidError
from email_validator import validate_email
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from fastapi import Response
from fastapi import status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager
from fastapi_users import exceptions
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
from enmedd.configs.app_configs import TRACK_EXTERNAL_IDP_EXPIRY
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
from enmedd.db.engine import get_sqlalchemy_engine
from enmedd.db.models import AccessToken
from enmedd.db.models import User
from enmedd.db.models import User__Teamspace
from enmedd.db.users import get_user_by_email
from enmedd.utils.logger import setup_logger
from enmedd.utils.telemetry import optional_telemetry
from enmedd.utils.telemetry import RecordType
from enmedd.utils.variable_functionality import fetch_versioned_implementation

logger = setup_logger()


def is_user_admin(user: User | None) -> bool:
    if AUTH_TYPE == AuthType.DISABLED:
        return True
    if user and user.role == UserRole.ADMIN:
        return True
    return False


def verify_auth_setting() -> None:
    if AUTH_TYPE not in [AuthType.DISABLED, AuthType.BASIC, AuthType.GOOGLE_OAUTH]:
        raise ValueError(
            "User must choose a valid user authentication method: "
            "disabled, basic, or google_oauth"
        )
    logger.notice(f"Using Auth Type: {AUTH_TYPE.value}")


def get_display_email(email: str | None, space_less: bool = False) -> str:
    if email and email.endswith(API_KEY_DUMMY_EMAIL_DOMAIN):
        name = email.split("@")[0]
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


def verify_email_is_invited(email: str) -> None:
    whitelist = get_invited_users()
    if not whitelist:
        return

    if not email:
        raise PermissionError("Email must be specified")

    email_info = validate_email(email)  # can raise EmailNotValidError

    for email_whitelist in whitelist:
        try:
            # normalized emails are now being inserted into the db
            # we can remove this normalization on read after some time has passed
            email_info_whitelist = validate_email(email_whitelist)
        except EmailNotValidError:
            continue

        # oddly, normalization does not include lowercasing the user part of the
        # email address ... which we want to allow
        if email_info.normalized.lower() == email_info_whitelist.normalized.lower():
            return

    raise PermissionError("User not on allowed user whitelist")


def verify_email_in_whitelist(email: str) -> None:
    with Session(get_sqlalchemy_engine()) as db_session:
        if not get_user_by_email(email, db_session):
            verify_email_is_invited(email)


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
    ) -> User:
        verify_email_is_invited(user_create.email)
        verify_email_domain(user_create.email)
        if hasattr(user_create, "role"):
            user_count = await get_user_count()
            if user_count == 0 or user_create.email in get_default_admin_user_emails():
                user_create.role = UserRole.ADMIN
            else:
                user_create.role = UserRole.BASIC
        user = None
        try:
            user = await super().create(user_create, safe=safe, request=request)  # type: ignore
        except exceptions.UserAlreadyExists:
            user = await self.get_by_email(user_create.email)
            # Handle case where user has used product outside of web and is now creating an account through web
            raise exceptions.UserAlreadyExists()
        return user

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

        user = await super().oauth_callback(  # type: ignore
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

        # NOTE: Most IdPs have very short expiry times, and we don't want to force the user to
        # re-authenticate that frequently, so by default this is disabled
        if expires_at and TRACK_EXTERNAL_IDP_EXPIRY:
            oidc_expiry = datetime.fromtimestamp(expires_at, tz=timezone.utc)
            await self.user_db.update(user, update_dict={"oidc_expiry": oidc_expiry})

        # this is needed if an organization goes from `TRACK_EXTERNAL_IDP_EXPIRY=true` to `false`
        # otherwise, the oidc expiry will always be old, and the user will never be able to login
        if user.oidc_expiry and not TRACK_EXTERNAL_IDP_EXPIRY:
            await self.user_db.update(user, update_dict={"oidc_expiry": None})

        return user

    async def on_after_register(
        self, user: User, request: Optional[Request] = None
    ) -> None:
        logger.notice(f"User {user.id} has registered.")
        optional_telemetry(
            record_type=RecordType.SIGN_UP,
            data={"action": "create"},
            user_id=str(user.id),
        )

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        logger.notice(f"User {user.id} has forgot their password. Reset token: {token}")

        reset_url = f"{WEB_DOMAIN}/auth/reset-password?token={token}"
        subject, body = generate_password_reset_email(user.email, reset_url)
        send_reset_password_email(user.email, subject, body)

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ) -> None:
        verify_email_domain(user.email)

        logger.notice(
            f"Verification requested for user {user.id}. Verification token: {token}"
        )
        link = f"{WEB_DOMAIN}/auth/verify-email?token={token}"
        subject, body = generate_user_verification_email(user.full_name, link)
        send_user_verification_email(user.email, subject, body)

    async def authenticate(
        self, credentials: OAuth2PasswordRequestForm
    ) -> Optional[User]:
        try:
            user = await self.get_by_email(credentials.username)
        except exceptions.UserNotExists:
            self.password_helper.hash(credentials.password)
            return None

        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None

        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})

        return user


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
    strategy = DatabaseStrategy(
        access_token_db, lifetime_seconds=SESSION_EXPIRE_TIME_SECONDS  # type: ignore
    )
    return strategy


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
    include_expired: bool = False,
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

    if (
        user.oidc_expiry
        and user.oidc_expiry < datetime.now(timezone.utc)
        and not include_expired
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User's OIDC token has expired.",
        )

    return user


async def current_user_with_expired_token(
    user: User | None = Depends(optional_user),
) -> User | None:
    return await double_check_user(user, include_expired=True)


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
            detail="Access denied. User must be an admin to perform this action.",
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
