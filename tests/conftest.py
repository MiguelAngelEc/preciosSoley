import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Set test database URL before any imports
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Import all models to ensure they're registered with Base.metadata
from app.models.base import BaseEntity
from app.models.user import User
from app.models.material import Material
from app.models.audit_log import AuditLog

# Import app after models are loaded
from app.main import app
from app.database import Base

# Create test engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up tables after each test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(session):
    """Create a test client that uses the test database session."""
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    from app.database import get_db
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up dependency override
    app.dependency_overrides.clear()