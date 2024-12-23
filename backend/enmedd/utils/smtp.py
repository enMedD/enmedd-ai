import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from enmedd.configs.app_configs import SMTP_PASS
from enmedd.configs.app_configs import SMTP_PORT
from enmedd.configs.app_configs import SMTP_SERVER
from enmedd.configs.app_configs import SMTP_USER

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