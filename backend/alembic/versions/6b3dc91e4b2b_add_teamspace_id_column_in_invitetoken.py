"""Add teamspace_id column in InviteToken

Revision ID: 6b3dc91e4b2b
Revises: 800ea858cae8
Create Date: 2024-12-03 11:06:35.512027

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "6b3dc91e4b2b"
down_revision = "800ea858cae8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "invite_token", sa.Column("teamspace_id", sa.Integer(), nullable=True)
    )
    op.create_table(
        "workspaces",
        sa.Column("name", sa.String(), nullable=False, primary_key=True),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("logo", sa.String(), nullable=True),
        sa.Column(
            "creator_id",
            sa.UUID(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("num_users", sa.Integer(), nullable=True),
        sa.Column("num_connectors", sa.Integer(), nullable=True),
        sa.Column("num_assistants", sa.Integer(), nullable=True),
        sa.Column("num_teamspace", sa.Integer(), nullable=True),
        sa.Column("embedding_storage", sa.Integer(), nullable=True),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("workspaces")
    op.drop_column("invite_token", "teamspace_id")
    # ### end Alembic commands ###