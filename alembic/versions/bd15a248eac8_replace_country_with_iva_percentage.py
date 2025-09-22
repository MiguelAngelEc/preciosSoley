"""replace_country_with_iva_percentage

Revision ID: bd15a248eac8
Revises: b9b71b3e8941
Create Date: 2025-09-22 09:20:32.766569

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd15a248eac8'
down_revision: Union[str, None] = 'b9b71b3e8941'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop country column
    op.drop_column('products', 'country')
    # Add iva_percentage column
    op.add_column('products', sa.Column('iva_percentage', sa.Numeric(5, 2), nullable=False, server_default='21.0'))


def downgrade() -> None:
    # Drop iva_percentage column
    op.drop_column('products', 'iva_percentage')
    # Add back country column
    op.add_column('products', sa.Column('country', sa.String(), nullable=True))
