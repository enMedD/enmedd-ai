import random
import re
import string
from datetime import datetime
from datetime import timezone
from typing import Optional

from email_validator import validate_email
from fastapi import APIRouter
from fastapi import Body
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Response
from fastapi import status
from fastapi import UploadFile
from fastapi_users.password import PasswordHelper
from pydantic import BaseModel
from sqlalchemy import Column
from sqlalchemy import delete
from sqlalchemy import desc
from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from ee.enmedd.db.api_key import is_api_key_email_address
from ee.enmedd.db.external_perm import delete_user__ext_teamspace_for_user__no_commit
from ee.enmedd.server.workspace.store import _PROFILE_FILENAME
from ee.enmedd.server.workspace.store import upload_profile
from enmedd.auth.invited_users import decode_invite_token
from enmedd.auth.invited_users import generate_invite_email
from enmedd.auth.invited_users import generate_invite_token
from enmedd.auth.invited_users import get_invited_users
from enmedd.auth.invited_users import send_invite_user_email
from enmedd.auth.invited_users import write_invited_users
from enmedd.auth.noauth_user import fetch_no_auth_user
from enmedd.auth.noauth_user import set_no_auth_user_preferences
from enmedd.auth.schemas import ChangePassword
from enmedd.auth.schemas import UserRole
from enmedd.auth.schemas import UserStatus
from enmedd.auth.users import current_admin_user
from enmedd.auth.users import current_admin_user_based_on_teamspace_id
from enmedd.auth.users import current_user
from enmedd.auth.users import current_workspace_admin_user
from enmedd.auth.users import optional_user
from enmedd.auth.utils import generate_2fa_email
from enmedd.auth.utils import get_smtp_credentials
from enmedd.auth.utils import send_2fa_email
from enmedd.configs.app_configs import AUTH_TYPE
from enmedd.configs.app_configs import SESSION_EXPIRE_TIME_SECONDS
from enmedd.configs.app_configs import VALID_EMAIL_DOMAINS
from enmedd.configs.app_configs import WEB_DOMAIN
from enmedd.configs.constants import AuthType
from enmedd.db.engine import get_async_session
from enmedd.db.engine import get_session
from enmedd.db.models import AccessToken
from enmedd.db.models import Assistant__User
from enmedd.db.models import DocumentSet__User
from enmedd.db.models import InviteToken
from enmedd.db.models import SamlAccount
from enmedd.db.models import TwofactorAuth
from enmedd.db.models import User
from enmedd.db.models import User__Teamspace
from enmedd.db.users import change_user_password
from enmedd.db.users import get_user_by_email
from enmedd.db.users import list_users
from enmedd.file_store.file_store import get_default_file_store
from enmedd.key_value_store.factory import get_kv_store
from enmedd.server.feature_flags.models import feature_flag
from enmedd.server.manage.models import AllUsersResponse
from enmedd.server.manage.models import UserByEmail
from enmedd.server.manage.models import UserInfo
from enmedd.server.manage.models import UserPreferences
from enmedd.server.manage.models import UserRoleResponse
from enmedd.server.middleware.tenant_identification import db_session_filter
from enmedd.server.middleware.tenant_identification import get_tenant_id
from enmedd.server.models import FullUserSnapshot
from enmedd.server.models import InvitedUserSnapshot
from enmedd.server.models import MinimalUserwithNameSnapshot
from enmedd.utils.logger import setup_logger

logger = setup_logger()


router = APIRouter()


USERS_PAGE_SIZE = 10


@router.patch("/users/generate-otp")
async def generate_otp(
    email: str,
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
):
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    current_user = get_user_by_email(email, db_session)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid email"
        )

    otp_code = "".join(random.choices(string.digits, k=6))

    smtp_credentials = get_smtp_credentials(db_session)

    subject, body = generate_2fa_email(current_user.full_name, otp_code)
    send_2fa_email(current_user.email, subject, body, smtp_credentials)

    existing_otp = (
        db_session.query(TwofactorAuth)
        .filter(TwofactorAuth.user_id == current_user.id)
        .first()
    )

    if existing_otp:
        existing_otp.code = otp_code
        existing_otp.created_at = datetime.now(timezone.utc)
    else:
        new_otp = TwofactorAuth(user_id=current_user.id, code=otp_code)
        db_session.add(new_otp)

    db_session.commit()

    return {"message": "OTP code generated and sent!"}


@router.post("/users/validate-token-invite")
async def validate_token_invite(
    email: str,
    token: str,
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
):
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user = get_user_by_email(email=email, db_session=db_session)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    teamspace_id = decode_invite_token(token, email, db_session)

    if teamspace_id == "Invalid token":
        raise HTTPException(status_code=400, detail="Invalid token")
    elif teamspace_id == "Token has expired":
        raise HTTPException(status_code=400, detail="Token has expired")

    if teamspace_id == "Missing teamspace_id":
        user_emails = get_invited_users()
        remaining_users = [
            invited_user for invited_user in user_emails if invited_user != email
        ]
        write_invited_users(remaining_users)
        return HTTPException(status_code=200, detail="Token is valid")

    user_emails = get_invited_users(teamspace_id)
    remaining_users = [
        invited_user for invited_user in user_emails if invited_user != email
    ]
    write_invited_users(remaining_users, teamspace_id)

    teamspace = (
        db_session.query(User__Teamspace)
        .filter_by(teamspace_id=teamspace_id, user_id=user.id)
        .first()
    )
    if not teamspace:
        db_session.add(
            User__Teamspace(
                teamspace_id=teamspace_id, user_id=user.id, role=UserRole.BASIC
            )
        )
        db_session.commit()

    return HTTPException(status_code=200, detail="Token is valid from teamspace")


@router.post("/users/change-password", tags=["users"])
async def change_password(
    request: ChangePassword,
    current_user: User = Depends(current_user),
    db_session: Session = Depends(get_session),
    async_session: AsyncSession = Depends(get_async_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
):
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    password_helper = PasswordHelper()
    verified, updated_hashed_password = password_helper.verify_and_update(
        hashed_password=current_user.hashed_password,
        plain_password=request.current_password,
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    hashed_new_password = password_helper.hash(password=request.new_password)
    change_user_password(
        user_id=current_user.id, new_password=hashed_new_password, db_session=db_session
    )
    # clear all the access token for that user - automatically logging out
    # the current user on all devices
    await async_session.execute(
        delete(AccessToken).where(AccessToken.user_id == current_user.id)
    )
    await async_session.commit()
    logger.info("Password updated and tokens invalidated")


# @router.patch("/manage/set-user-role")
# def set_user_role(
#     user_role_update_request: UserRoleUpdateRequest,
#     current_user: User = Depends(current_workspace_admin_user),
#     db_session: Session = Depends(get_session),
# ) -> None:
#     user_to_update = get_user_by_email(
#         email=user_role_update_request.user_email, db_session=db_session
#     )
#     if not user_to_update:
#         raise HTTPException(status_code=404, detail="User not found")

#     if user_to_update.role == user_role_update_request.new_role:
#         return

#     if current_user.id == user_to_update.id:
#         raise HTTPException(
#             status_code=400,
#             detail="An admin cannot demote themselves from admin role!",
#         )

#     user_to_update.role = user_role_update_request.new_role.value

#     db_session.commit()


@router.patch("/manage/promote-user-to-admin")
def promote_admin(
    user_email: UserByEmail,
    _: User = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_promote = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_promote:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_promote.role = UserRole.ADMIN
    db_session.add(user_to_promote)
    db_session.commit()


@router.patch("/manage/demote-admin-to-basic")
def demote_admin(
    user_email: UserByEmail,
    user: User = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_demote = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_demote:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_demote.id == user.id:
        raise HTTPException(
            status_code=400, detail="Cannot demote yourself from admin role!"
        )

    user_to_demote.role = UserRole.BASIC
    db_session.add(user_to_demote)
    db_session.commit()


@router.patch("/manage/promote-workspace-user-to-admin")
def promote_workspace_admin(
    user_email: UserByEmail,
    _: User = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_promote = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_promote:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_promote.role = UserRole.ADMIN
    db_session.add(user_to_promote)
    db_session.commit()


@router.patch("/manage/demote-workspace-admin-to-basic")
def demote_workspace_admin(
    user_email: UserByEmail,
    user: User = Depends(current_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_demote = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_demote:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_demote.id == user.id:
        raise HTTPException(
            status_code=400, detail="Cannot demote yourself from admin role!"
        )

    user_to_demote.role = UserRole.BASIC
    db_session.add(user_to_demote)
    db_session.commit()


@router.get("/manage/users")
def list_all_users(
    q: str | None = None,
    teamspace_id: int | None = None,
    _: User | None = Depends(current_admin_user_based_on_teamspace_id),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> AllUsersResponse:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    if teamspace_id:
        users_with_roles = (
            db_session.query(User, User__Teamspace.role)
            .join(User__Teamspace)
            .filter(User__Teamspace.teamspace_id == teamspace_id)
            .all()
        )
    else:
        users_with_roles = db_session.query(User, User.role).all()

    accepted_users = [
        FullUserSnapshot(
            id=user.id,
            email=user.email,
            role=role,
            status=UserStatus.LIVE if user.is_active else UserStatus.DEACTIVATED,
            full_name=user.full_name,
            billing_email_address=user.billing_email_address,
            company_billing=user.company_billing,
            company_email=user.company_email,
            company_name=user.company_name,
            vat=user.vat,
            profile=user.profile,
        )
        for user, role in users_with_roles
        if not is_api_key_email_address(user.email)
    ]

    # Sort accepted users by company_name, then by full_name
    accepted_users.sort(key=lambda x: (x.company_name.lower(), x.full_name.lower()))

    invited_emails = get_invited_users(teamspace_id=teamspace_id)
    accepted_emails = {user.email for user, _ in users_with_roles}

    filtered_invited_emails = [
        email for email in invited_emails if email not in accepted_emails
    ]

    if q:
        invited_emails = [
            email for email in invited_emails if re.search(r"{}".format(q), email, re.I)
        ]

    return AllUsersResponse(
        accepted=accepted_users,
        invited=[InvitedUserSnapshot(email=email) for email in filtered_invited_emails],
    )


@router.put("/manage/admin/users")
def bulk_invite_users(
    emails: list[str] = Body(..., embed=True),
    teamspace_id: Optional[int] = None,
    user: User | None = Depends(current_admin_user_based_on_teamspace_id),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> int:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    """emails are string validated. If any email fails validation, no emails are
    invited and an exception is raised."""
    if user is None:
        raise HTTPException(
            status_code=400, detail="Auth is disabled, cannot invite users"
        )

    normalized_emails = []
    for email in emails:
        email_info = validate_email(email)
        normalized_emails.append(email_info.normalized)

    if not normalized_emails:
        raise HTTPException(status_code=400, detail="No valid emails found")

    smtp_credentials = get_smtp_credentials(db_session)

    token = generate_invite_token(teamspace_id, normalized_emails, db_session)

    for email in normalized_emails:
        signup_link = f"{WEB_DOMAIN}/auth/signup?email={email}&invitetoken={token}"
        subject, body = generate_invite_email(signup_link)
        send_invite_user_email(email, subject, body, smtp_credentials)

    all_emails = list(set(normalized_emails) | set(get_invited_users(teamspace_id)))

    return write_invited_users(all_emails, teamspace_id)


def remove_email_from_invite_tokens(
    db_session: Session,
    user_email: str,
    teamspace_id: Optional[int] = None,
) -> int:
    if teamspace_id:
        result = db_session.execute(
            update(InviteToken)
            .where(InviteToken.teamspace_id == teamspace_id)
            .values(emails=InviteToken.emails.op("-")(user_email))
        )
    else:
        result = db_session.execute(
            update(InviteToken)
            .where(InviteToken.teamspace_id.is_(None))
            .values(emails=InviteToken.emails.op("-")(user_email))
        )
    db_session.commit()

    return result.rowcount


@router.patch("/manage/admin/remove-invited-user")
def remove_invited_user(
    user_email: UserByEmail,
    teamspace_id: Optional[int] = None,
    _: User | None = Depends(current_admin_user_based_on_teamspace_id),
    db_session: Session = Depends(get_session),
) -> int:
    user_emails = get_invited_users(teamspace_id)
    remaining_users = [user for user in user_emails if user != user_email.user_email]
    write_invited_users(remaining_users, teamspace_id)

    rows_updated = remove_email_from_invite_tokens(
        db_session=db_session,
        user_email=user_email.user_email,
        teamspace_id=teamspace_id,
    )

    return rows_updated


@router.patch("/manage/admin/deactivate-user")
def deactivate_user(
    user_email: UserByEmail,
    current_user: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    if current_user is None:
        raise HTTPException(
            status_code=400, detail="Auth is disabled, cannot deactivate user"
        )

    if current_user.email == user_email.user_email:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")

    user_to_deactivate = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )

    if not user_to_deactivate:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_deactivate.is_active is False:
        logger.warning("{} is already deactivated".format(user_to_deactivate.email))

    user_to_deactivate.is_active = False
    db_session.add(user_to_deactivate)
    db_session.commit()


@router.delete("/manage/admin/delete-user")
async def delete_user(
    user_email: UserByEmail,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_delete = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_delete.is_active is True:
        logger.warning(
            "{} must be deactivated before deleting".format(user_to_delete.email)
        )
        raise HTTPException(
            status_code=400, detail="User must be deactivated before deleting"
        )

    # Detach the user from the current session
    db_session.expunge(user_to_delete)

    try:
        for oauth_account in user_to_delete.oauth_accounts:
            db_session.delete(oauth_account)

        delete_user__ext_teamspace_for_user__no_commit(
            db_session=db_session,
            user_id=user_to_delete.id,
        )
        db_session.query(SamlAccount).filter(
            SamlAccount.user_id == user_to_delete.id
        ).delete()
        db_session.query(DocumentSet__User).filter(
            DocumentSet__User.user_id == user_to_delete.id
        ).delete()
        db_session.query(Assistant__User).filter(
            Assistant__User.user_id == user_to_delete.id
        ).delete()
        db_session.query(User__Teamspace).filter(
            User__Teamspace.user_id == user_to_delete.id
        ).delete()
        db_session.delete(user_to_delete)
        db_session.commit()

        # NOTE: edge case may exist with race conditions
        # with this `invited user` scheme generally.
        user_emails = get_invited_users()
        remaining_users = [
            user for user in user_emails if user != user_email.user_email
        ]
        write_invited_users(remaining_users)

        logger.info(f"Deleted user {user_to_delete.email}")
    except Exception as e:
        import traceback

        full_traceback = traceback.format_exc()
        logger.error(f"Full stack trace:\n{full_traceback}")
        db_session.rollback()
        logger.error(f"Error deleting user {user_to_delete.email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting user")


@router.patch("/manage/admin/activate-user")
def activate_user(
    user_email: UserByEmail,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    user_to_activate = get_user_by_email(
        email=user_email.user_email, db_session=db_session
    )
    if not user_to_activate:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_activate.is_active is True:
        logger.warning("{} is already activated".format(user_to_activate.email))

    user_to_activate.is_active = True
    db_session.add(user_to_activate)
    db_session.commit()


@router.get("/manage/admin/valid-domains")
def get_valid_domains(
    _: User | None = Depends(current_workspace_admin_user),
) -> list[str]:
    return VALID_EMAIL_DOMAINS


"""Endpoints for all"""


@router.get("/users")
def list_all_users_basic_info(
    _: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
    teamspace_id: Optional[int] = None,
    include_teamspace_user: bool = True,
    q: str = "",
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> list[MinimalUserwithNameSnapshot]:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    users = list_users(
        db_session,
        q=q,
        teamspace_id=teamspace_id,
        include_teamspace_user=include_teamspace_user,
    )
    filtered_users = [
        user for user in users if not is_api_key_email_address(user.email)
    ]

    return [
        MinimalUserwithNameSnapshot(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            profile=user.profile,
        )
        for user in filtered_users
    ]


@router.get("/get-user-role")
async def get_user_role(user: User = Depends(current_user)) -> UserRoleResponse:
    if user is None:
        raise ValueError("Invalid or missing user.")
    return UserRoleResponse(role=user.role)


def get_current_token_creation(
    user: User | None, db_session: Session
) -> datetime | None:
    tenant_id = "public"
    db_session_filter(tenant_id, db_session)
    if user is None:
        return None
    try:
        result = db_session.execute(
            select(AccessToken)
            .where(AccessToken.user_id == user.id)  # type: ignore
            .order_by(desc(Column("created_at")))
            .limit(1)
        )
        access_token = result.scalar_one_or_none()

        if access_token:
            return access_token.created_at
        else:
            logger.error("No AccessToken found for user")
            return None

    except Exception as e:
        logger.error(f"Error fetching AccessToken: {e}")
        return None


@router.put("/me/profile")
@feature_flag("profile_page")
def put_profile(
    file: UploadFile,
    db_session: Session = Depends(get_session),
    current_user: User = Depends(current_user),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    upload_profile(file=file, db_session=db_session, user=current_user)


@router.get("/me/profile")
@feature_flag("profile_page")
def fetch_profile(
    db_session: Session = Depends(get_session),
    current_user: User = Depends(current_user),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> Response:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    try:
        file_path = f"{current_user.id}{_PROFILE_FILENAME}"

        file_store = get_default_file_store(db_session)
        file_io = file_store.read_file(file_path, mode="b")

        return Response(content=file_io.read(), media_type="image/jpeg")
    except Exception:
        raise HTTPException(status_code=404, detail="No profile file found")


@router.delete("/me/profile")
@feature_flag("profile_page")
def remove_profile(
    db_session: Session = Depends(get_session),
    current_user: User = Depends(current_user),  # Get the current user
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> dict:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    try:
        current_user.profile = None

        file_name = f"{current_user.id}{_PROFILE_FILENAME}"

        file_store = get_default_file_store(db_session)

        file_store.delete_file(file_name)

        db_session.commit()

        return {"detail": "Profile picture removed successfully."}
    except Exception as e:
        logger.error(f"Error removing profile picture: {str(e)}")
        raise HTTPException(status_code=404, detail="Profile picture not found.")


@router.get("/me")
def verify_user_logged_in(
    user: User | None = Depends(optional_user),
    teamspace_id: Optional[int] = None,
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> UserInfo:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    # NOTE: this does not use `current_user` / `current_workspace_admin_user` because we don't want
    # to enforce user verification here - the frontend always wants to get the info about
    # the current user regardless of if they are currently verified
    if user is None:
        # if auth type is disabled, return a dummy user with preferences from
        # the key-value store
        if AUTH_TYPE == AuthType.DISABLED:
            store = get_kv_store()
            return fetch_no_auth_user(store)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User Not Authenticated"
        )

    if user.oidc_expiry and user.oidc_expiry < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. User's OIDC token has expired.",
        )

    role = user.role
    if teamspace_id:
        user_teamspace = (
            db_session.query(User__Teamspace)
            .filter(
                User__Teamspace.user_id == user.id,
                User__Teamspace.teamspace_id == teamspace_id,
            )
            .first()
        )

        if user_teamspace is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teamspace role not found",
            )

        role = user_teamspace.role

    token_created_at = get_current_token_creation(user, db_session)
    user_info = UserInfo.from_model(
        user,
        current_token_created_at=token_created_at,
        expiry_length=SESSION_EXPIRE_TIME_SECONDS,
    )
    user_info.role = role

    return user_info


"""APIs to adjust user preferences"""


class ChosenDefaultModelRequest(BaseModel):
    default_model: str | None = None


@router.patch("/user/default-model")
def update_user_default_model(
    request: ChosenDefaultModelRequest,
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    if user is None:
        if AUTH_TYPE == AuthType.DISABLED:
            store = get_kv_store()
            no_auth_user = fetch_no_auth_user(store)
            no_auth_user.preferences.default_model = request.default_model
            set_no_auth_user_preferences(store, no_auth_user.preferences)
            return
        else:
            raise RuntimeError("This should never happen")

    db_session.execute(
        update(User)
        .where(User.id == user.id)  # type: ignore
        .values(default_model=request.default_model)
    )
    db_session.commit()


class ChosenAssistantsRequest(BaseModel):
    chosen_assistants: list[int]


@router.patch("/user/assistant-list")
def update_user_assistant_list(
    request: ChosenAssistantsRequest,
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    if user is None:
        if AUTH_TYPE == AuthType.DISABLED:
            store = get_kv_store()

            no_auth_user = fetch_no_auth_user(store)
            no_auth_user.preferences.chosen_assistants = request.chosen_assistants
            set_no_auth_user_preferences(store, no_auth_user.preferences)
            return
        else:
            raise RuntimeError("This should never happen")

    db_session.execute(
        update(User)
        .where(User.id == user.id)  # type: ignore
        .values(chosen_assistants=request.chosen_assistants)
    )
    db_session.commit()


def update_assistant_list(
    preferences: UserPreferences, assistant_id: int, show: bool
) -> UserPreferences:
    visible_assistants = preferences.visible_assistants or []
    hidden_assistants = preferences.hidden_assistants or []
    chosen_assistants = preferences.chosen_assistants or []

    if show:
        if assistant_id not in visible_assistants:
            visible_assistants.append(assistant_id)
        if assistant_id in hidden_assistants:
            hidden_assistants.remove(assistant_id)
        if assistant_id not in chosen_assistants:
            chosen_assistants.append(assistant_id)
    else:
        if assistant_id in visible_assistants:
            visible_assistants.remove(assistant_id)
        if assistant_id not in hidden_assistants:
            hidden_assistants.append(assistant_id)
        if assistant_id in chosen_assistants:
            chosen_assistants.remove(assistant_id)

    preferences.visible_assistants = visible_assistants
    preferences.hidden_assistants = hidden_assistants
    preferences.chosen_assistants = chosen_assistants
    return preferences


@router.patch("/user/assistant-list/update/{assistant_id}")
def update_user_assistant_visibility(
    assistant_id: int,
    show: bool,
    user: User | None = Depends(current_user),
    db_session: Session = Depends(get_session),
    tenant_id: Optional[str] = Depends(get_tenant_id),
) -> None:
    if tenant_id:
        db_session_filter(tenant_id, db_session)
    if user is None:
        if AUTH_TYPE == AuthType.DISABLED:
            store = get_kv_store()
            no_auth_user = fetch_no_auth_user(store)
            preferences = no_auth_user.preferences
            updated_preferences = update_assistant_list(preferences, assistant_id, show)
            set_no_auth_user_preferences(store, updated_preferences)
            return
        else:
            raise RuntimeError("This should never happen")

    user_preferences = UserInfo.from_model(user).preferences
    updated_preferences = update_assistant_list(user_preferences, assistant_id, show)

    db_session.execute(
        update(User)
        .where(User.id == user.id)  # type: ignore
        .values(
            hidden_assistants=updated_preferences.hidden_assistants,
            visible_assistants=updated_preferences.visible_assistants,
            chosen_assistants=updated_preferences.chosen_assistants,
        )
    )
    db_session.commit()
