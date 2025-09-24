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
    # Add new cost fields to products table
    op.add_column('products', sa.Column('costo_etiqueta', sa.Numeric(10, 2), nullable=True, default=0.0))
    op.add_column('products', sa.Column('costo_envase', sa.Numeric(10, 2), nullable=True, default=0.0))
    op.add_column('products', sa.Column('costo_caja', sa.Numeric(10, 2), nullable=True, default=0.0))
    op.add_column('products', sa.Column('costo_transporte', sa.Numeric(10, 2), nullable=False, default=0.0))
    # Update existing products to have default value for costo_transporte
    op.execute("UPDATE products SET costo_transporte = 0.0 WHERE costo_transporte IS NULL")


def downgrade() -> None:
    pass
