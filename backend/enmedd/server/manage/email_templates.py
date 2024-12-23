from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from enmedd.auth.users import current_workspace_admin_user
from enmedd.db.email_template import get_all_email_templates
from enmedd.db.email_template import send_sample_email
from enmedd.db.email_template import update_email_template
from enmedd.db.engine import get_session
from enmedd.db.models import User
from enmedd.server.manage.models import EmailTemplates
from enmedd.server.manage.models import SendMailTemplate
from enmedd.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()


@router.get("/email-templates")
async def get_all_email_templates_route(
    workspace_id: int | None = None,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
) -> list[EmailTemplates]:
    current_workspace_admin_user()
    active_email_templates = get_all_email_templates(0, db_session)
    if not active_email_templates:
        logger.error("No Email templates retrieved from the db")
        logger.info("Make sure you have migrated the latest alembic head")
        raise HTTPException(status_code=404, detail="No email templates found")

    return [
        EmailTemplates(
            id=active.id,
            body=active.body,
            description=active.description,
            subject=active.subject,
            title=active.title,
            workspace_id=active.workspace_id,
            type=active.type,
        )
        for active in active_email_templates
    ]


@router.put("/email-templates/{mail_template_id}")
async def update_email_template_route(
    mail_template_id: int,
    mailData: EmailTemplates,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
):
    logger.info(f"Updating mail temaplate with id={mail_template_id}")

    updated_email_template = update_email_template(
        db_session=db_session,
        id=mail_template_id,
        body=mailData.body,
        subject=mailData.subject,
    )

    return EmailTemplates(
        id=updated_email_template.id,
        body=updated_email_template.body,
        description=updated_email_template.description,
        subject=updated_email_template.subject,
        title=updated_email_template.title,
        workspace_id=updated_email_template.workspace_id,
        type=active.type,
    )


@router.post("/email-templates/send-sample")
async def send_sample_mail_route(
    mailData: SendMailTemplate,
    _: User | None = Depends(current_workspace_admin_user),
    db_session: Session = Depends(get_session),
):
    logger.info(f"Sending mail to email: {mailData.email}")
    if not send_sample_email(
        mailData.email, mailData.subject + " (sample mail)", mailData.body, db_session
    ):
        raise HTTPException(status_code=400, detail="Sending sample mail failed")
