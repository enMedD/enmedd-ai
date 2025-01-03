from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from enmedd.db.models import EmailTemplates
from enmedd.utils.smtp import get_smtp_credentials
from enmedd.utils.smtp import send_mail


# retrieves all email templates
def get_all_email_templates(
    workspace_id: int | None, db_session: Session
) -> list[EmailTemplates]:
    if workspace_id is None:
        return db_session.query(EmailTemplates).order_by(EmailTemplates.id.asc())

    return (
        db_session.query(EmailTemplates)
        .filter(EmailTemplates.workspace_id == workspace_id)
        .order_by(EmailTemplates.id.asc())
    )


# gets a specific email template (w/out workspace id)
def get_email_template(id: int, db_session: Session) -> EmailTemplates | None:
    return db_session.query(EmailTemplates).filter(EmailTemplates.id == id).first()


# TODO soon: should identify different workspaces
# email_type can be "invite", "2fa", or "passreset"
def get_active_email_template(
    email_type: str, db_session: Session
) -> EmailTemplates | None:
    return (
        db_session.query(EmailTemplates)
        .filter(
            and_(EmailTemplates.type == email_type, EmailTemplates.workspace_id == 0)
        )
        .first()
    )


# sends a sample email
def send_sample_email(target_mail: str, subject: str, body: str, db_session: Session):
    smtp_credentials = get_smtp_credentials(db_session)
    return send_mail(target_mail, subject, body, smtp_credentials, True)


# activates the email template selected
def activate_email_template(id: int, db_session: Session):
    # deactivates the last activated mail template
    active_email_template = get_active_email_template(db_session)
    if active_email_template is not None:
        active_email_template.selected = False

    # activates the target mail template
    target_email_template = get_email_template(id, db_session)
    if target_email_template is not None:
        target_email_template.selected = False

    db_session.commit()
    return target_email_template


# creates a new email template
def create_email_template(title: str, subject: str, body: str, db_session: Session):
    db_session.add(
        EmailTemplates(
            title=title,
            subject=subject,
            body=body,
        )
    )


def update_email_template(
    id: int,
    db_session: Session,
    title: str = None,
    subject: str = None,
    body: str = None,
) -> EmailTemplates:
    target_email_template = get_email_template(id, db_session)

    if target_email_template is None:
        raise HTTPException(status_code=404, detail="Email template not found")

    if subject is not None:
        target_email_template.subject = subject

    if body is not None:
        target_email_template.body = body

    db_session.commit()
    return target_email_template


def delete_email_template(id: int, db_session: Session) -> EmailTemplates:
    target_email_template = get_email_template(id, db_session)

    if target_email_template is not None:
        db_session.delete(target_email_template)
