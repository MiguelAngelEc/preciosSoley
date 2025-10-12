# Precios Soley - Phase P0 (Quick Wins)

## Overview
Precios Soley is a full-stack system for managing materials, products, inventory, and proformas for a cleaning products company.

Phase P0 implements the core quick wins: authentication, materials CRUD, and basic product management with Docker containerization.

## Architecture
- **Backend**: FastAPI (Python 3.12) with PostgreSQL
- **Frontend**: React 18 + TypeScript + MUI
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Authentication**: JWT tokens with bcrypt password hashing
- **Containerization**: Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Run the System
```bash
# Clone the repository
git clone <repository-url>
cd precios-soley

# Start all services
docker-compose up --build
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **PgAdmin**: http://localhost:5050 (admin@admin.com / admin)

### Default Credentials
- **PgAdmin**: admin@admin.com / admin
- **Database**: postgres / password

## Features Implemented

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes

### Materials Management
- Create, read, update, delete materials
- Price per kg and per unit calculations
- Cost calculations for quantities

### Products Management
- Basic product CRUD (with auth fixes in progress)
- Material associations
- Cost calculations

### Testing
- Backend unit and integration tests with pytest
- Test database setup

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Materials
- `GET /api/materials/` - List materials
- `POST /api/materials/` - Create material
- `PUT /api/materials/{id}` - Update material
- `DELETE /api/materials/{id}` - Delete material
- `POST /api/materials/{id}/costos` - Calculate costs

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Database
```bash
# Run migrations
alembic upgrade head

# Run tests
pytest
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/precios_soley
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8001
```

## Next Steps (Phase P1)
- Complete product auth integration
- Inventory management UI
- Proforma generation
- Advanced cost calculations
- User roles and permissions
- Production deployment setup