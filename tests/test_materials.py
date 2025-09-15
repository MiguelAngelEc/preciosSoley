import pytest
from decimal import Decimal
from sqlalchemy.orm import Session

from app.schemas.material import MaterialCreate, CantidadQuery
from app.models.user import User

@pytest.fixture
def user() -> User:
    # Assume a user is created in test setup
    return User(id=1, username="testuser", email="test@example.com", hashed_password="hashed", role="user")

def test_create_material(client, user: User, session: Session):
    # Mock auth for simplicity; in full test, use token
    response = client.post(
        "/api/materials/",
        json={
            "nombre": "Texapon",
            "precio_base": "3.45",
            "unidad_base": "kg",
            "cantidades_deseadas": ["250", "500", "1200"]
        },
        headers={"Authorization": "Bearer dummy_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Texapon"
    assert Decimal(data["precio_unidad_pequena"]) == Decimal("0.00345")

def test_get_materials(client, user: User):
    # Assume material exists
    response = client.get("/api/materials/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_calculate_costs(client, user: User):
    # Assume material_id 1 exists
    response = client.get("/api/materials/1/costos?cantidades=250&cantidades=500")
    assert response.status_code == 200
    data = response.json()
    assert "costos" in data
    assert "250" in data["costos"]
    assert Decimal(data["costos"]["250"]) == Decimal("0.8625")

def test_update_material(client, user: User):
    # Assume material_id 1 exists
    response = client.put(
        "/api/materials/1",
        json={"precio_base": "4.50"}
    )
    assert response.status_code == 200
    data = response.json()
    assert Decimal(data["precio_base"]) == Decimal("4.50")
    assert Decimal(data["precio_unidad_pequena"]) == Decimal("0.0045")

def test_delete_material(client, user: User):
    # Assume material_id 1 exists
    response = client.delete("/api/materials/1")
    assert response.status_code == 200