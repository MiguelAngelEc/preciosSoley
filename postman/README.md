# 📬 Integración FastAPI con Postman

## 🚀 Configuración Inicial

### 1. Importar la Colección y Entorno

1. **Importar Colección**:
   - Abre Postman
   - Click en "Import"
   - Selecciona `Precios_Soley_API.postman_collection.json`

2. **Importar Entorno**:
   - Click en "Import"
   - Selecciona `Precios_Soley_Environment.postman_environment.json`
   - Selecciona el entorno "Precios Soley - Local" en la esquina superior derecha

### 2. Iniciar el Servidor FastAPI

```bash
# Activar entorno virtual
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

### 3. Documentación Automática

FastAPI genera documentación automática disponible en:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📋 Flujo de Uso Recomendado

### Paso 1: Autenticación

1. **Registrar Usuario**:
   - Ejecuta `🔐 Autenticación > Registrar Usuario`
   - El test automáticamente guardará el `user_id`

2. **Login**:
   - Ejecuta `🔐 Autenticación > Login Usuario`
   - El test automáticamente guardará el `access_token`
   - Este token se usará automáticamente en todos los endpoints protegidos

### Paso 2: Gestión de Materiales

Una vez autenticado, puedes usar todos los endpoints de materiales:

1. **Crear Material**:
   - Ejecuta `🧱 Materiales > Crear Material`
   - El test guardará automáticamente el `material_id`

2. **Listar Materiales**:
   - Ejecuta `🧱 Materiales > Listar Materiales`

3. **Obtener Material Específico**:
   - Ejecuta `🧱 Materiales > Obtener Material por ID`
   - Usa el `material_id` guardado automáticamente

4. **Actualizar Material**:
   - Ejecuta `🧱 Materiales > Actualizar Material`

5. **Calcular Costos**:
   - Ejecuta `🧱 Materiales > Calcular Costos`
   - Modifica las cantidades en el body según necesites

6. **Eliminar Material**:
   - Ejecuta `🧱 Materiales > Eliminar Material`

### Paso 3: Ejemplos Predefinidos

En la carpeta `🧪 Ejemplos de Materiales` tienes requests predefinidos para crear diferentes tipos de materiales:
- Cemento Portland
- Arena de río
- Pintura látex

## 🔧 Variables de Entorno

El entorno incluye las siguientes variables:

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `base_url` | URL base del servidor | `http://localhost:8000` |
| `access_token` | Token JWT (se llena automáticamente) | _(vacío)_ |
| `user_id` | ID del usuario autenticado | _(vacío)_ |
| `material_id` | ID del último material creado | _(vacío)_ |
| `test_username` | Usuario de prueba | `testuser` |
| `test_email` | Email de prueba | `test@example.com` |
| `test_password` | Contraseña de prueba | `password123` |

## 🧪 Tests Automatizados

Cada request incluye tests automáticos que:

- ✅ Verifican el código de estado HTTP
- ✅ Validan la estructura de la respuesta
- ✅ Guardan automáticamente tokens y IDs para uso posterior
- ✅ Confirman que los datos esperados estén presentes

## 📊 Estructuras de Datos

### Usuario
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string"
}
```

### Material
```json
{
  "nombre": "string",
  "precio_base": 15.50,
  "unidad_base": "kg",  // "kg" o "litros"
  "cantidades_deseadas": [1, 5, 10, 25, 50]
}
```

### Consulta de Costos
```json
{
  "cantidades": [1, 5, 10, 25, 50, 100]
}
```

## 🚨 Troubleshooting

### Error 401 - Unauthorized
- Asegúrate de haber ejecutado el login correctamente
- Verifica que la variable `access_token` tenga un valor
- El token expira en 30 minutos, vuelve a hacer login si es necesario

### Error 404 - Not Found
- Verifica que el servidor esté corriendo en `http://localhost:8000`
- Asegúrate de que las rutas en los requests sean correctas

### Error 422 - Validation Error
- Revisa que los datos en el body del request tengan el formato correcto
- Verifica que los tipos de datos sean los esperados (string, number, etc.)

### CORS Issues
- El servidor ya está configurado con CORS habilitado
- Si tienes problemas, verifica que `allow_origins=["*"]` esté en `main.py`

## 🔄 Ejecutar Collection Completa

Para probar todo el flujo de una vez:

1. Selecciona la colección "Precios Soley API"
2. Click en "Run Collection"
3. Asegúrate de que el orden sea:
   - Registrar Usuario
   - Login Usuario
   - Crear Material
   - Obtener/Actualizar/Calcular Costos
   - (Opcional) Eliminar Material

## 🌐 Endpoints Disponibles

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar usuario | ❌ |
| POST | `/auth/login` | Login usuario | ❌ |
| POST | `/api/materials/` | Crear material | ✅ |
| GET | `/api/materials/` | Listar materiales | ✅ |
| GET | `/api/materials/{id}` | Obtener material | ✅ |
| PUT | `/api/materials/{id}` | Actualizar material | ✅ |
| DELETE | `/api/materials/{id}` | Eliminar material | ✅ |
| POST | `/api/materials/{id}/costos` | Calcular costos | ✅ |

¡Ya tienes todo configurado para probar tu API FastAPI con Postman! 🎉