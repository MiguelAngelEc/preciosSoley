from fastapi import FastAPI

from app.database import Base, engine
from app.api import auth, materials

app = FastAPI(
    title="Precios Soley API",
    description="API for managing materials and prices",
    version="0.1.0"
)

app.include_router(auth.router)
app.include_router(materials.router)
