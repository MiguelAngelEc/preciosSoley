# Precios Soley - Gestión de Materiales y Productos

Un sistema completo de gestión para jabonería que permite administrar materiales, productos, inventario y proformas con cálculos automáticos de costos, márgenes y precios.

## 📋 Descripción del Proyecto

Este proyecto es una aplicación full-stack desarrollada para la gestión integral de una jabonería. Incluye funcionalidades para:

- **Gestión de Materiales**: Registro y cálculo de costos de materias primas
- **Gestión de Productos**: Creación de productos con fórmulas complejas y cálculos automáticos de precios
- **Control de Inventario**: Seguimiento de stock, movimientos y alertas de bajo inventario
- **Sistema de Proformas**: Generación de cotizaciones para clientes con diferentes tipos de precios
- **Autenticación**: Sistema seguro de login y registro de usuarios

## 🚀 Características Principales

### Backend (FastAPI)
- **API RESTful** con documentación automática (Swagger/OpenAPI)
- **Autenticación JWT** con roles de usuario
- **Base de datos PostgreSQL** con migraciones Alembic
- **Modelos complejos** para cálculos de costos y precios
- **Validación de datos** con Pydantic
- **Gestión de inventario** con movimientos y reportes

### Frontend (React + TypeScript)
- **Interfaz moderna** con Material-UI
- **Navegación por pestañas** para diferentes módulos
- **Formularios dinámicos** para gestión de datos
- **Integración completa** con API backend
- **Manejo de autenticación** y rutas protegidas

### Funcionalidades Específicas

#### Gestión de Materiales
- Registro de materiales con precios base y unidades
- Cálculos automáticos de costos por cantidad
- Conversión de unidades (kg, litros, gramos, ml)
- Historial de versiones y eliminación lógica

#### Gestión de Productos
- Creación de productos con múltiples materiales
- Cálculos complejos de costos incluyendo:
  - Costos de materiales
  - Costos adicionales (etiquetas, envases, transporte, mano de obra, etc.)
  - Márgenes de ganancia por tipo de cliente (público, mayorista, distribuidor)
  - IVA configurable
- Duplicación de productos con diferentes pesos de empaque
- Precios finales con y sin IVA

#### Control de Inventario
- Registro de producción con fechas y lotes
- Seguimiento de stock actual y mínimo
- Movimientos de inventario (entradas, salidas, ajustes)
- Alertas de bajo stock
- Reportes diarios y por períodos
- Dashboard con métricas clave

#### Sistema de Proformas
- Generación automática de números de proforma
- Información completa del cliente
- Selección de productos con cantidades
- Cálculos automáticos de subtotales, IVA y totales
- Validez configurable (15 días por defecto)
- Tipos de cliente con precios diferenciados

## 🛠️ Tecnologías Utilizadas

### Backend
- **Python 3.12**
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **Alembic** - Migraciones de base de datos
- **Pydantic** - Validación de datos
- **JWT** - Autenticación de tokens
- **bcrypt** - Hashing de contraseñas
- **Uvicorn** - Servidor ASGI

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - JavaScript tipado
- **Material-UI (MUI)** - Componentes de UI
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **React App Rewired** - Configuración personalizada

### Herramientas de Desarrollo
- **Docker** (opcional para contenedorización)
- **Postman** - Colección de APIs incluida
- **Pytest** - Tests unitarios e integración
- **ESLint** - Linting de código

## 📦 Instalación y Configuración

### Prerrequisitos
- Python 3.12+
- Node.js 16+
- PostgreSQL
- Git

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd preciosSoley
```

### 2. Configurar el Backend

#### Instalar dependencias
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configurar la base de datos
```bash
# Crear base de datos PostgreSQL
createdb precios_soley

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

#### Ejecutar migraciones
```bash
alembic upgrade head
```

#### Ejecutar el servidor
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 3. Configurar el Frontend

#### Instalar dependencias
```bash
cd frontend
npm install
```

#### Configurar variables de entorno
```bash
cp .env.example .env
# Configurar REACT_APP_API_URL=http://localhost:8001
```

#### Ejecutar la aplicación
```bash
npm start
```

## 🚀 Uso

### Acceso a la Aplicación
1. Abrir navegador en `http://localhost:3000`
2. Registrarse o iniciar sesión
3. Acceder al dashboard principal

### Flujo de Trabajo Típico

1. **Configurar Materiales**
   - Registrar materias primas con precios y unidades
   - Verificar cálculos de costos

2. **Crear Productos**
   - Definir fórmulas con materiales
   - Configurar costos adicionales y márgenes
   - Revisar precios calculados automáticamente

3. **Gestionar Inventario**
   - Registrar producción
   - Monitorear stock y alertas
   - Registrar movimientos

4. **Generar Proformas**
   - Seleccionar productos y cantidades
   - Ingresar datos del cliente
   - Generar cotización

## 📚 API Documentation

La documentación completa de la API está disponible en:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### Endpoints Principales

#### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión

#### Materiales
- `GET /api/materials/` - Listar materiales
- `POST /api/materials/` - Crear material
- `PUT /api/materials/{id}` - Actualizar material
- `DELETE /api/materials/{id}` - Eliminar material

#### Productos
- `GET /api/products/` - Listar productos
- `POST /api/products/` - Crear producto
- `PUT /api/products/{id}` - Actualizar producto
- `POST /api/products/{id}/materials` - Agregar material a producto

#### Inventario
- `GET /api/inventory/` - Listar entradas de inventario
- `POST /api/inventory/` - Crear entrada de inventario
- `POST /api/inventory/{id}/movements` - Registrar movimiento
- `GET /api/inventory/summary` - Dashboard de inventario

#### Proformas
- `GET /api/proformas/` - Listar proformas
- `POST /api/proformas/` - Crear proforma
- `GET /api/proformas/{id}` - Ver proforma detallada

## 🧪 Testing

### Ejecutar Tests del Backend
```bash
cd backend
pytest tests/
```

### Ejecutar Tests del Frontend
```bash
cd frontend
npm test
```

## 📁 Estructura del Proyecto

```
preciosSoley/
├── app/                          # Backend FastAPI
│   ├── api/                      # Endpoints de API
│   ├── models/                   # Modelos de base de datos
│   ├── schemas/                  # Esquemas Pydantic
│   ├── services/                 # Lógica de negocio
│   ├── utils/                    # Utilidades
│   └── main.py                   # Punto de entrada
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── components/           # Componentes reutilizables
│   │   ├── pages/                # Páginas principales
│   │   ├── services/             # Servicios API
│   │   └── types/                # Definiciones TypeScript
│   └── public/                   # Archivos estáticos
├── tests/                        # Tests
├── alembic/                      # Migraciones de BD
├── postman/                      # Colección Postman
└── requirements.txt              # Dependencias Python
```

## 🔧 Configuración Avanzada

### Variables de Entorno

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/precios_soley
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8001
```

### Base de Datos

El proyecto utiliza PostgreSQL con las siguientes tablas principales:
- `users` - Usuarios del sistema
- `materials` - Materias primas
- `products` - Productos finales
- `product_materials` - Relación producto-material
- `proformas` - Cotizaciones
- `proforma_items` - Items de proforma
- `inventories` - Entradas de inventario
- `inventory_movements` - Movimientos de stock

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear issue en el repositorio
- Contactar al equipo de desarrollo

## 🔄 Versiones

### v0.1.0
- ✅ Sistema básico de autenticación
- ✅ Gestión CRUD de materiales
- ✅ Gestión CRUD de productos con cálculos de costos
- ✅ Sistema de inventario básico
- ✅ Generación de proformas
- ✅ Interfaz frontend completa
- ✅ API RESTful documentada

### Próximas Funcionalidades
- [ ] Dashboard con gráficos y métricas
- [ ] Exportación de reportes a PDF/Excel
- [ ] Notificaciones por email
- [ ] Integración con sistemas de punto de venta
- [ ] API móvil
- [ ] Multi-tenancy para múltiples jabonerías