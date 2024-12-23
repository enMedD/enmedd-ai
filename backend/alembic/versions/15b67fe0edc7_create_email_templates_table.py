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
        sa.Column("workspace_id", sa.Integer(), nullable=False)
    )

    op.execute("""
        INSERT INTO email_templates (id, type, title, description, subject, body, workspace_id)
        VALUES (
            1,
            'invite',
            'Invite to Teamspace Mail Template',
            'Mail template sent when inviting users to join the teamspace',
            'You are Invite to Join The AI Platform - Activate Your Account Now!',
            E'<p>Hi,</p>
<p>We are excited to invite you to join <strong>The AI Platform</strong>! To get started, simply click the link to activate your account: {{signup_link}}</p>
<p></p>
<p>If you did not request this invitation or believe this email was sent by mistake, please disregard it. If you have any questions or need assistance, feel free to reach out to our support team at tech@arnoldai.io.</p>
<p></p>
<p>We look forward to having you with us!</p>
<p></p>
<p>Best regards,</p>
<p>The AI Platform Team</p>',
            0
        )
    """)

def downgrade() -> None:
    op.drop_table("email_templates")
