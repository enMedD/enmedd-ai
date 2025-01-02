from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import cast
from typing import List
from typing import Optional

import jwt
from sqlalchemy import desc
from sqlalchemy.orm import Session

from enmedd.configs.app_configs import SECRET_KEY
from enmedd.db.email_template import get_active_email_template
from enmedd.db.models import InviteToken
from enmedd.db.users import delete_user_by_email
from enmedd.db.users import update_invite_token_status
from enmedd.key_value_store.factory import get_kv_store
from enmedd.key_value_store.interface import JSON_ro
from enmedd.key_value_store.interface import KvKeyNotFoundError
from enmedd.utils.logger import setup_logger

logger = setup_logger()

USER_STORE_KEY = "INVITED_USERS"
TEAMSPACE_INVITE_USER = "TEAMSPACE_INVITE_USER"


def get_invited_users(
    teamspace_id: Optional[int] = None,
    all: bool = False,
) -> list[str]:
    try:
        store = get_kv_store()

        if all:
            try:
                teamspace_users = cast(dict, store.load(TEAMSPACE_INVITE_USER))
            except KvKeyNotFoundError:
                teamspace_users = {}

            try:
                user_store = cast(list, store.load(USER_STORE_KEY))
            except KvKeyNotFoundError:
                user_store = []

            all_emails = set()
            for users in teamspace_users.values():
                all_emails.update(users)
            all_emails.update(user_store)

            return list(all_emails)

        else:
            if teamspace_id:
                try:
                    teamspace_users = cast(dict, store.load(TEAMSPACE_INVITE_USER))
                except KvKeyNotFoundError:
                    return []

                return teamspace_users.get(str(teamspace_id), [])
            else:
                try:
                    return cast(list, store.load(USER_STORE_KEY))
                except KvKeyNotFoundError:
                    return []
    except KvKeyNotFoundError:
        return []


def write_invited_users(emails: list[str], teamspace_id: Optional[int] = None) -> int:
    store = get_kv_store()

    if teamspace_id:
        try:
            teamspace_users = store.load(TEAMSPACE_INVITE_USER)
        except KvKeyNotFoundError:
            teamspace_users = {}

        teamspace_users[str(teamspace_id)] = emails

        store.store(TEAMSPACE_INVITE_USER, cast(JSON_ro, teamspace_users))

    else:
        store.store(USER_STORE_KEY, cast(JSON_ro, emails))

    return len(emails)


def generate_invite_token(
    db_session: Session,
    teamspace_id: Optional[int],
    emails: Optional[List[str]] = None,
) -> str:
    # Define token expiration (e.g., 7 days)
    expiration = datetime.now(timezone.utc) + timedelta(days=7)

    payload = {"teamspace_id": teamspace_id, "exp": expiration}

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    # Default to invite link placeholder if no emails are provided
    emails = emails or ["invite_link"]

    invite_token = InviteToken(
        token=token, emails=emails, teamspace_id=teamspace_id, expires_at=expiration
    )
    db_session.add(invite_token)
    db_session.commit()

    return token


def decode_invite_token(token: str, email: str, db_session: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        teamspace_id = payload.get("teamspace_id")

        invite_token = db_session.query(InviteToken).filter_by(token=token).first()

        if invite_token.expires_at < datetime.now(timezone.utc):
            update_invite_token_status(invite_token, db_session)
            delete_user_by_email(email, db_session)
            return "Token has expired"
        elif invite_token and email in invite_token.emails:
            if not teamspace_id:
                return "Missing teamspace_id"
            return teamspace_id
        elif invite_token.emails == ["invite_link"]:
            return teamspace_id
        else:
            delete_user_by_email(email, db_session)
            return "Invalid token"

    except jwt.ExpiredSignatureError:
        delete_user_by_email(email, db_session)
        return "Token has expired"
    except jwt.InvalidTokenError:
        delete_user_by_email(email, db_session)
        return "Invalid token"


def generate_invite_email(signup_link: str, db_session: Session):
    active_email_template = get_active_email_template("invite", db_session)
    subject = active_email_template.subject

    # load the subject with the actual value
    body = active_email_template.body
    body = body.replace("{{signup_link}}", signup_link)

    return subject, body


def get_token_status_by_email(
    db: Session, email: str, teamspace_id: Optional[int] = None
):
    # Update is_expired to True if expires_at is in the past
    db.query(InviteToken).filter(
        InviteToken.expires_at < datetime.now(timezone.utc)
    ).update({"is_expired": True}, synchronize_session=False)
    db.commit()

    query = db.query(InviteToken).filter(InviteToken.emails.contains([email]))

    if teamspace_id is not None:
        query = query.filter(InviteToken.teamspace_id == teamspace_id)
    else:
        query = query.filter(InviteToken.teamspace_id.is_(None))

    invite_token = query.order_by(desc(InviteToken.created_at)).first()

    if invite_token:
        return {
            "is_expired": invite_token.is_expired,
            "expires_at": invite_token.expires_at,
        }

    return None
