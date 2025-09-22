#!/usr/bin/env python3
import sys
sys.path.append('.')
from app.database import get_db
from app.models.user import User
from app.models.material import Material
from app.services.auth_service import create_user
from app.schemas.user import UserCreate
from decimal import Decimal

db = next(get_db())

# Create test user if doesn't exist
user = db.query(User).first()
if not user:
    user = create_user(db, UserCreate(username='test', email='test@test.com', password='test'))
    print(f'Created test user: {user.username}')
else:
    print(f'Using existing user: {user.username}')

# Create test materials with proper precio_unidad_pequena calculation
materials_data = [
    {'nombre': 'Harina', 'precio_base': '2.50', 'unidad_base': 'kg'},
    {'nombre': 'Azucar', 'precio_base': '1.80', 'unidad_base': 'kg'},
    {'nombre': 'Mantequilla', 'precio_base': '4.20', 'unidad_base': 'kg'},
    {'nombre': 'Huevos', 'precio_base': '3.00', 'unidad_base': 'kg'},
]

for mat_data in materials_data:
    existing = db.query(Material).filter(Material.nombre == mat_data['nombre'], Material.user_id == user.id).first()
    if not existing:
        precio_base = Decimal(mat_data['precio_base'])
        # Convert from price per kg to price per gram (divide by 1000)
        precio_unidad_pequena = precio_base / 1000

        material = Material(
            user_id=user.id,
            nombre=mat_data['nombre'],
            precio_base=precio_base,
            unidad_base=mat_data['unidad_base'],
            precio_unidad_pequena=precio_unidad_pequena
        )
        db.add(material)
        print(f'Created material: {mat_data["nombre"]} - ${precio_base}/kg = ${precio_unidad_pequena}/g')
    else:
        print(f'Material already exists: {mat_data["nombre"]}')

db.commit()
print('Test materials created successfully!')

# Show created materials
materials = db.query(Material).filter(Material.user_id == user.id).all()
print(f'\nTotal materials in database: {len(materials)}')
for mat in materials:
    print(f'- {mat.id}: {mat.nombre} (${mat.precio_base}/kg = ${mat.precio_unidad_pequena}/g)')