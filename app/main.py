from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api import auth, materials, products, proformas, inventory
# Import all models to ensure they are registered with SQLAlchemy
from app.models import User, Material, Product, ProductMaterial, Proforma, ProformaItem, Inventory, InventoryMovement

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Precios Soley API",
    description="API for managing materials and prices",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8001", "http://127.0.0.1:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(products.router)
app.include_router(proformas.router)
app.include_router(inventory.router)
