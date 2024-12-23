import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from ee.enmedd.utils.encryption import decrypt_password
from enmedd.configs.app_configs import SMTP_PASS
from enmedd.configs.app_configs import SMTP_PORT
from enmedd.configs.app_configs import SMTP_SERVER
from enmedd.configs.app_configs import SMTP_USER
from enmedd.db.models import WorkspaceSettings


def get_smtp_credentials(db_session: Session):
    """Fetch SMTP credentials for a given workspace."""
    workspace_settings = db_session.query(WorkspaceSettings).first()

    if not workspace_settings:
        raise ValueError("No SMTP settings found for workspace")

    smtp_server = workspace_settings.smtp_server
    smtp_port = workspace_settings.smtp_port
    smtp_user = workspace_settings.smtp_username
    smtp_password_encrypted = workspace_settings.smtp_password

    # Decrypt the password
    smtp_password = (
        decrypt_password(smtp_password_encrypted) if smtp_password_encrypted else None
    )

    return {
        "smtp_server": smtp_server,
        "smtp_port": smtp_port,
        "smtp_user": smtp_user,
        "smtp_password": smtp_password,
    }


def send_mail(
    to_email: str,
    subject: str,
    body: str,
    smtp_credentials: dict,
    render_html=False,
) -> None:
    sender_email = smtp_credentials["smtp_user"] or SMTP_USER
    sender_password = smtp_credentials["smtp_password"] or SMTP_PASS
    smtp_server = smtp_credentials["smtp_server"] or SMTP_SERVER
    smtp_port = smtp_credentials["smtp_port"] or SMTP_PORT

    # Create MIME message
    message = MIMEMultipart()
    message["To"] = to_email
    message["Subject"] = subject
    if sender_email:
        message["From"] = sender_email
    message.attach(MIMEText(body, "plain" if not render_html else "html"))

    # Send email
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)
        print(f"Invite email has been send to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email invitation to {to_email}: {str(e)}")
        return False
