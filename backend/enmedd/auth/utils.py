from typing import Optional

from sqlalchemy.orm import Session

from enmedd.db.email_template import get_active_email_template
from enmedd.utils.logger import setup_logger


logger = setup_logger()


# password reset email here
def generate_password_reset_email(email: str, reset_url: str, db_session: Session):
    email_template_password_reset = get_active_email_template("passreset", db_session)
    subject = email_template_password_reset.subject

    body = email_template_password_reset.body
    body = body.replace("{{reset_url}}", reset_url).replace("{{email}}", email)
    return subject, body


# generation of user verification email here
def generate_user_verification_email(
    full_name: Optional[str], verify_url: str, db_session: Session
):
    email_template_user_verification = get_active_email_template("verify", db_session)
    subject = email_template_user_verification.subject

    body = email_template_user_verification.body
    body = body.replace("{{full_name}}", full_name).replace(
        "{{verify_url}}", verify_url
    )
    return subject, body


# generation of 2fa here
def generate_2fa_email(full_name: Optional[str], code: str, db_session: Session):
    email_template_2fa = get_active_email_template("2fa", db_session)
    subject = email_template_2fa.subject

    body = email_template_2fa.body
    body = body.replace("{{full_name}}", full_name).replace("{{code}}", code)
    return subject, body
