"""Add usage_report__teamspace relationship

Revision ID: a2d61fc58c5b
Revises: 052983cf1bc1
Create Date: 2024-11-11 10:07:37.389874

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a2d61fc58c5b"
down_revision = "052983cf1bc1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "usage_report__teamspace",
        sa.Column("report_id", sa.Integer(), nullable=False),
        sa.Column("teamspace_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["report_id"],
            ["usage_reports.id"],
        ),
        sa.ForeignKeyConstraint(
            ["teamspace_id"],
            ["teamspace.id"],
        ),
        sa.PrimaryKeyConstraint("report_id", "teamspace_id"),
    )


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("usage_report__teamspace")
    # ### end Alembic commands ###