"""baseline schema

Revision ID: 0001_baseline
Revises:
Create Date: 2026-06-11
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Baseline migration.
    The current project still relies on existing tables in runtime environments.
    Next revisions should move to full declarative migrations.
    """
    pass


def downgrade() -> None:
    pass
