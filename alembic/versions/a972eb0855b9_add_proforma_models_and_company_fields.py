"""add_proforma_models_and_company_fields

Revision ID: a972eb0855b9
Revises: 13c4b03c9cd5
Create Date: 2025-09-25 15:47:03.473995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a972eb0855b9'
down_revision: Union[str, None] = '13c4b03c9cd5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add company fields to users table (check if they don't exist)
    # Note: These might already exist from previous manual additions
    try:
        op.add_column('users', sa.Column('nombre_empresa', sa.String(), nullable=True))
    except:
        pass  # Column might already exist
    try:
        op.add_column('users', sa.Column('ruc', sa.String(), nullable=True))
    except:
        pass
    try:
        op.add_column('users', sa.Column('direccion', sa.String(), nullable=True))
    except:
        pass
    try:
        op.add_column('users', sa.Column('telefono', sa.String(), nullable=True))
    except:
        pass
    try:
        op.add_column('users', sa.Column('email_empresa', sa.String(), nullable=True))
    except:
        pass

    # Create proformas table
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
        sa.Column('cliente_direccion', sa.Text(), nullable=True),
        sa.Column('cliente_telefono', sa.String(), nullable=True),
        sa.Column('cliente_email', sa.String(), nullable=True),
        sa.Column('fecha_emision', sa.DateTime(), nullable=True),
        sa.Column('fecha_validez', sa.DateTime(), nullable=False),
        sa.Column('iva_aplicado', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_iva', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_final', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_proforma')
    )

    # Create proforma_items table
    op.create_table('proforma_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('proforma_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('precio_unitario', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal_item', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['proforma_id'], ['proformas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop proforma_items table
    op.drop_table('proforma_items')

    # Drop proformas table
    op.drop_table('proformas')

    # Remove company fields from users table
    op.drop_column('users', 'email_empresa')
    op.drop_column('users', 'telefono')
    op.drop_column('users', 'direccion')
    op.drop_column('users', 'ruc')
    op.drop_column('users', 'nombre_empresa')
