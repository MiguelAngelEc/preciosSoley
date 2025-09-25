"""add_unit_conversion_fields

Revision ID: 152949fbca26
Revises: 8527e3ebd381
Create Date: 2025-09-24 15:22:51.822963

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '152949fbca26'
down_revision: Union[str, None] = '8527e3ebd381'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new nullable columns to products table
    op.add_column('products', sa.Column('peso_ingredientes_base', sa.Numeric(10, 2), nullable=True, comment="Total weight of base ingredients"))
    op.add_column('products', sa.Column('peso_final_producido', sa.Numeric(10, 2), nullable=True, comment="Final production weight/volume"))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('products', 'peso_final_producido')
    op.drop_column('products', 'peso_ingredientes_base')
