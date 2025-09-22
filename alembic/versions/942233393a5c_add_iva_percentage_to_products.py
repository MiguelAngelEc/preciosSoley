"""add iva_percentage to products

Revision ID: 942233393a5c
Revises: bd15a248eac8
Create Date: 2025-09-22 16:14:43.377021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '942233393a5c'
down_revision: Union[str, None] = 'bd15a248eac8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('iva_percentage', sa.Numeric(5, 2), nullable=True, server_default='21.0'))


def downgrade() -> None:
    op.drop_column('products', 'iva_percentage')
