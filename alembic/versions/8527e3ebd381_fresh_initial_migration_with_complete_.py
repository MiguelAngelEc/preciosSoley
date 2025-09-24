"""Fresh initial migration with complete schema

Revision ID: 8527e3ebd381
Revises: 
Create Date: 2025-09-24 09:29:49.324486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8527e3ebd381'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
