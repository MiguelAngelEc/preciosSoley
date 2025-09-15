import pytest
from decimal import Decimal
from app.schemas.material import MaterialCreate, MaterialUpdate, CantidadQuery


def test_create_material(client, session):
    # First, register and login
    user_data = {
        "username": "matuser",
        "email": "mat@example.com",
        "password": "matpass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "matuser",
        "password": "matpass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    material_data = {
        "nombre": "Test Material",
        "precio_base": "10.00",
        "unidad_base": "kg"
    }
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/materials/", json=material_data, headers=headers)

    assert response.status_code == 200
    material = response.json()
    assert material["nombre"] == "Test Material"
    assert material["precio_base"] == "10.00"
    assert material["precio_unidad_pequena"] == "0.010000"
    assert material["is_active"] is True
    assert "id" in material


def test_create_material_unauthorized(client):
    material_data = {
        "nombre": "Unauthorized Material",
        "precio_base": "5.00",
        "unidad_base": "litros"
    }
    response = client.post("/api/materials/", json=material_data)
    assert response.status_code == 403
    assert "Not authenticated" in response.json()["detail"]


def test_get_materials(client, session):
    # Register, login, create material
    user_data = {
        "username": "getuser",
        "email": "get@example.com",
        "password": "getpass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "getuser",
        "password": "getpass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    material_data = {
        "nombre": "Get Material",
        "precio_base": "20.00",
        "unidad_base": "kg"
    }
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/materials/", json=material_data, headers=headers)

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/materials/", headers=headers)

    assert response.status_code == 200
    materials = response.json()
    assert len(materials) == 1
    assert materials[0]["nombre"] == "Get Material"


def test_get_material_not_found(client, session):
    # Register and login
    user_data = {
        "username": "notfounduser",
        "email": "notfound@example.com",
        "password": "pass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "notfounduser",
        "password": "pass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/materials/999", headers=headers)

    assert response.status_code == 404
    assert "Material not found" in response.json()["detail"]


def test_update_material(client, session):
    # Register, login, create material, then update
    user_data = {
        "username": "updateuser",
        "email": "update@example.com",
        "password": "updatepass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "updateuser",
        "password": "updatepass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    # Create
    material_data = {
        "nombre": "Update Material",
        "precio_base": "15.00",
        "unidad_base": "kg"
    }
    headers = {"Authorization": f"Bearer {token}"}
    create_response = client.post("/api/materials/", json=material_data, headers=headers)
    material_id = create_response.json()["id"]

    # Update
    update_data = {
        "nombre": "Updated Material",
        "precio_base": "25.00"
    }
    response = client.put(f"/api/materials/{material_id}", json=update_data, headers=headers)

    assert response.status_code == 200
    updated = response.json()
    assert updated["nombre"] == "Updated Material"
    assert updated["precio_base"] == "25.00"
    assert updated["precio_unidad_pequena"] == "0.025000"


def test_delete_material(client, session):
    # Register, login, create, delete
    user_data = {
        "username": "deleteuser",
        "email": "delete@example.com",
        "password": "deletepass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "deleteuser",
        "password": "deletepass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    material_data = {
        "nombre": "Delete Material",
        "precio_base": "30.00",
        "unidad_base": "litros"
    }
    headers = {"Authorization": f"Bearer {token}"}
    create_response = client.post("/api/materials/", json=material_data, headers=headers)
    material_id = create_response.json()["id"]

    response = client.delete(f"/api/materials/{material_id}", headers=headers)
    assert response.status_code == 200

    # Verify soft delete
    get_response = client.get(f"/api/materials/{material_id}", headers=headers)
    assert get_response.status_code == 404  # Since is_active=False, not found


def test_calculate_costs(client, session):
    # Register, login, create, calculate
    user_data = {
        "username": "calcuser",
        "email": "calc@example.com",
        "password": "calcpass"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "calcuser",
        "password": "calcpass"
    }
    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    material_data = {
        "nombre": "Calc Material",
        "precio_base": "10.00",
        "unidad_base": "kg"
    }
    headers = {"Authorization": f"Bearer {token}"}
    create_response = client.post("/api/materials/", json=material_data, headers=headers)
    material_id = create_response.json()["id"]

    query_data = {
        "cantidades": [1000, 500]
    }
    response = client.post(f"/api/materials/{material_id}/costos", json=query_data, headers=headers)

    assert response.status_code == 200
    costs = response.json()
    assert costs["material"]["id"] == material_id
    assert costs["costos"]["1000"] == "10.000000"
    assert costs["costos"]["500"] == "5.000000"