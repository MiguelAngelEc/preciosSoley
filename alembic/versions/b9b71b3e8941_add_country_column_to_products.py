"""add_country_column_to_products

Revision ID: b9b71b3e8941
Revises: 66dcbc9af747
Create Date: 2025-09-22 08:43:23.815026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9b71b3e8941'
down_revision: Union[str, None] = '66dcbc9af747'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add country column to products table
    op.add_column('products', sa.Column('country', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove country column from products table
    op.drop_column('products', 'country')
