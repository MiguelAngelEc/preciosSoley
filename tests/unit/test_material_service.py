
import pytest
from unittest.mock import Mock, MagicMock
from decimal import Decimal
from fastapi import HTTPException

from app.services.material_service import (
    create_material,
    get_material,
    get_materials,
    update_material,
    delete_material,
    calculate_costs,
)
from app.models.material import Material
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialUpdate, CantidadQuery, CostosResponse
from app.utils.calculator import calcular_precio_unidad_pequena


def test_create_material_success(mocker):
    mock_db = Mock()
    mock_query = Mock()
    mock_query.filter.return_value.first.return_value = None
    mock_db.query.return_value = mock_query
    
    mock_user = User(id=1, username="testuser", role="user")
    
    material_create = MaterialCreate(
        nombre="Test Material",
        precio_base=Decimal("10.50"),
        unidad_base="kg",
        cantidades_deseadas=[Decimal("100"), Decimal("500")]
    )
    
    result = create_material(mock_db, material_create, mock_user)
    
    assert isinstance(result, Material)
    assert result.nombre == "Test Material"
    assert result.precio_base == Decimal("10.50")
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()