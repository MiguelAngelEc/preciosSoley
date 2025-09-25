"""add_peso_empaque_field

Revision ID: 13c4b03c9cd5
Revises: 152949fbca26
Create Date: 2025-09-25 08:34:38.892125

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13c4b03c9cd5'
down_revision: Union[str, None] = '152949fbca26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add peso_empaque column to products table
    op.add_column('products', sa.Column('peso_empaque', sa.Numeric(10, 2), nullable=True, comment="Selected package weight in grams"))


def downgrade() -> None:
    # Remove peso_empaque column from products table
    op.drop_column('products', 'peso_empaque')
