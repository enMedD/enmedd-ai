"""create email templates table

Revision ID: 15b67fe0edc7
Revises: 6b3dc91e4b2b
Create Date: 2024-12-16 21:11:21.049532

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "15b67fe0edc7"
down_revision = "6b3dc91e4b2b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_templates",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
    )

    initial_row_values = [
        (
            0,
            "invite",
            "Invite to Teamspace Mail Template",
            "Mail template sent when inviting users to join the teamspace",
            "You are Invite to Join The AI Platform - Activate Your Account Now!",
            """<p>Hi,</p>
<p>We are excited to invite you to join <strong>The AI Platform</strong>! To get started, simply click \
the link to activate your account: {{signup_link}}</p> \
<p></p><p>If you did not request this invitation or believe this email was sent by mistake, please disregard it. \
If you have any questions or need assistance, feel free to reach out to our support team at tech@arnoldai.io.</p> \
<p>We look forward to having you with us!</p><p></p><p>Best regards,</p><p>The AI Platform Team</p>""",
            0,
        ),
        (
            1,
            "passreset",
            "Password Reset Mail Template",
            "Mail template sent when a password reset is requested",
            "Password Reset Request",
            """<p>Dear User,</p><p></p><p>We received a request to reset the password for your account ({{email}}).</p> \
<p>To reset your password, please click on the following link:</p><p>{{reset_url}}</p><p>This link will expire in 1 hour. \
If you did not request a password reset, please ignore this email or contact support if you have concerns.&nbsp;</p><p></p>\
<p>Best regards,</p><p>The Arnold AI Team</p>""",
            0,
        ),
        (
            2,
            "verify",
            "User Verification Mail Template",
            "Mail template sent when for completing the user registration",
            "Almost There! Confirm Your Email to Activate Your Account",
            """<p>Hi {{full_name}},</p>\
<p></p><p>Thank you for signing up!</p>\
<p></p><p>To complete your registration, please verify your email address by clicking the link: {{verify_url}}</p>\
<p>If you did not request this email, please ignore it.</p><p></p><p>Best regards,</p><p>The Arnold AI Team</p>""",
            0,
        ),
        (
            3,
            "2fa",
            "2FA Mail Template",
            "Mail template sent when for two factor authentication",
            "Arnold AI Two-Factor Authentication (2FA) Code",
            """<p>Dear {{full_name}},</p>
<p>Your two-factor authentication code is: <strong>{{code}}</strong></p>\
<p>Please enter this code within the next 10 minutes to complete your sign-in. For your security, do not share this\
code with anyone. If you did not request this code, please contact our support team immediately.</p>\
<p>Best regards,</p><p>The Arnold AI Team</p>""",
            0,
        ),
    ]

    for row_values in initial_row_values:
        op.execute(
            f"""
            INSERT INTO email_templates (id, type, title, description, subject, body, workspace_id)
            VALUES (
                {row_values[0]}, '{row_values[1]}', '{row_values[2]}',
                '{row_values[3]}', '{row_values[4]}', '{row_values[5]}',
                {row_values[6]}
            )
        """,
        )


def downgrade() -> None:
    op.drop_table("email_templates")
