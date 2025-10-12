import pytest
from decimal import Decimal
from sqlalchemy.orm import Session

from app.schemas.material import MaterialCreate, CantidadQuery
from app.models.user import User

@pytest.fixture
def authenticated_client(client):
    # Register and login to get a valid token
    client.post(
        "/auth/register",
        json={"username": "testuser", "email": "test@example.com", "password": "testpass123"}
    )
    response = client.post(
        "/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return client, token

def test_create_material(authenticated_client, session: Session):
    client, token = authenticated_client
    response = client.post(
        "/api/materials/",
        json={
            "nombre": "Texapon",
            "precio_base": "3.45",
            "unidad_base": "kg",
            "cantidades_deseadas": ["250", "500", "1200"]
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Texapon"
    assert Decimal(data["precio_unidad_pequena"]) == Decimal("0.00345")

def test_get_materials(authenticated_client):
    client, token = authenticated_client
    response = client.get("/api/materials/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_calculate_costs(authenticated_client):
    client, token = authenticated_client
    # First create a material
    material_response = client.post(
        "/api/materials/",
        json={"nombre": "Test Material", "precio_base": "3.45", "unidad_base": "kg"},
        headers={"Authorization": f"Bearer {token}"}
    )
    material_id = material_response.json()["id"]

    # Then test cost calculation
    response = client.post(
        f"/api/materials/{material_id}/costos",
        json={"cantidades": ["250", "500"]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "costos" in data

def test_update_material(authenticated_client):
    client, token = authenticated_client
    # First create a material
    material_response = client.post(
        "/api/materials/",
        json={"nombre": "Test Material", "precio_base": "3.45", "unidad_base": "kg"},
        headers={"Authorization": f"Bearer {token}"}
    )
    material_id = material_response.json()["id"]

    # Then update it
    response = client.put(
        f"/api/materials/{material_id}",
        json={"precio_base": "4.50"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert Decimal(data["precio_base"]) == Decimal("4.50")

def test_delete_material(authenticated_client):
    client, token = authenticated_client
    # First create a material
    material_response = client.post(
        "/api/materials/",
        json={"nombre": "Test Material", "precio_base": "3.45", "unidad_base": "kg"},
        headers={"Authorization": f"Bearer {token}"}
    )
    material_id = material_response.json()["id"]

    # Then delete it
    response = client.delete(f"/api/materials/{material_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200