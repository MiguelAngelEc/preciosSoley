"""remove_proforma_tables

Revision ID: remove_proforma_tables
Revises: eb21e70e1128
Create Date: 2025-10-15 02:18:30.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_proforma_tables'
down_revision: Union[str, None] = 'eb21e70e1128'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop proforma_items table first (due to foreign key constraint)
    op.drop_table('proforma_items')

    # Drop proformas table
    op.drop_table('proformas')


def downgrade() -> None:
    # Recreate proformas table
    op.create_table('proformas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('numero_proforma', sa.String(), nullable=False),
        sa.Column('tipo_cliente', sa.String(), nullable=False),
        sa.Column('cliente_nombre', sa.String(), nullable=False),
        sa.Column('cliente_empresa', sa.String(), nullable=True),
        sa.Column('cliente_ruc', sa.String(), nullable=True),
        sa.Column('cliente_direccion', sa.String(), nullable=True),
        sa.Column('cliente_telefono', sa.String(), nullable=True),
        sa.Column('cliente_email', sa.String(), nullable=True),
        sa.Column('fecha_emision', sa.DateTime(), nullable=False),
        sa.Column('fecha_validez', sa.DateTime(), nullable=False),
        sa.Column('iva_aplicado', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_iva', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_final', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_proforma')
    )

    # Recreate proforma_items table
    op.create_table('proforma_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('proforma_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('cantidad', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('precio_unitario', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal_item', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['proforma_id'], ['proformas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )