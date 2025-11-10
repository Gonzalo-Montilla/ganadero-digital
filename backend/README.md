# 🐄 Ganadero Digital

**Sistema de Gestión Ganadera SaaS para Colombia**

Sistema completo de gestión para fincas ganaderas colombianas con enfoque offline-first, multi-tenant y optimizado para móviles.

## 🎯 Características Principales

- ✅ **Offline-First**: Funciona sin conexión, sincronización automática
- ✅ **Multi-Tenant**: Soporte para miles de fincas independientes
- ✅ **Gestión de Animales**: Inventario completo con genealogía
- ✅ **Control Sanitario**: Vacunas, tratamientos y alertas automáticas
- ✅ **Control Reproductivo**: Celos, servicios, preñeces y partos
- ✅ **Producción Lechera**: Control diario de producción
- ✅ **Gestión Financiera**: Compras, ventas y análisis de rentabilidad
- ✅ **Normativa ICA**: Cumplimiento con regulaciones colombianas

## 🏗️ Arquitectura

### Backend
- **Framework**: FastAPI 0.109+
- **Base de Datos**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0+
- **Autenticación**: JWT (JSON Web Tokens)
- **API**: RESTful con OpenAPI/Swagger

### Estructura del Proyecto

```
ganadero-digital/
├── app/
│   ├── main.py                 # Punto de entrada FastAPI
│   ├── core/                   # Configuración y seguridad
│   │   ├── config.py
│   │   └── security.py
│   ├── db/                     # Base de datos
│   │   ├── database.py
│   │   └── base_model.py
│   ├── models/                 # Modelos SQLAlchemy
│   │   ├── finca.py
│   │   ├── usuario.py
│   │   ├── animal.py
│   │   ├── control_sanitario.py
│   │   ├── control_reproductivo.py
│   │   ├── registro_produccion.py
│   │   └── transaccion.py
│   ├── schemas/                # Schemas Pydantic
│   ├── api/                    # Endpoints API
│   │   └── v1/
│   │       └── endpoints/
│   └── services/               # Lógica de negocio
├── tests/                      # Tests automatizados
├── requirements.txt            # Dependencias Python
├── .env.example                # Ejemplo de variables de entorno
└── README.md
```

## 📊 Modelo de Datos

### Entidades Principales

1. **Finca** (Multi-tenant principal)
   - Información básica y ubicación
   - Tipo de ganadería
   - Configuración de módulos

2. **Usuario**
   - Autenticación y autorización
   - Roles: admin, veterinario, operario, propietario
   - Multi-tenant por finca

3. **Animal**
   - Identificación y características
   - Genealogía (madre/padre)
   - Estado y ubicación
   - Registro ICA

4. **Control Sanitario**
   - Vacunas y desparasitaciones
   - Tratamientos y diagnósticos
   - Alertas automáticas

5. **Control Reproductivo**
   - Celos y servicios
   - Preñeces y partos
   - Indicadores reproductivos

6. **Registro Producción**
   - Producción lechera diaria
   - Pesajes
   - Alimentación

7. **Transacción**
   - Compras y ventas
   - Gestión financiera
   - Análisis de rentabilidad

### Sincronización Offline

Todos los modelos incluyen:
- `sync_version`: Control de versiones
- `sync_status`: Estado de sincronización
- `last_sync_at`: Última sincronización
- `last_modified_device`: Resolución de conflictos

## 🚀 Instalación y Setup

### Requisitos Previos

- Python 3.10+
- PostgreSQL 14+
- Redis (opcional, para rate limiting)

### 1. Clonar y Configurar Entorno

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb ganadero_digital

# Copiar variables de entorno
copy .env.example .env

# Editar .env con tus credenciales
notepad .env
```

Variables de entorno requeridas:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/ganadero_digital
SECRET_KEY=tu-clave-secreta-aqui-cambiar-en-produccion
DEBUG=True
ENVIRONMENT=development
```

### 3. Inicializar Base de Datos

```bash
# Las tablas se crean automáticamente al iniciar la app
# O usar Alembic para migraciones:
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 4. Ejecutar Servidor de Desarrollo

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en:
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- Documentación ReDoc: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Con cobertura
pytest --cov=app tests/

# Tests específicos
pytest tests/test_animales.py -v
```

## 📈 Plan de Desarrollo

### ✅ Fase 1 - MVP (Completado)
- [x] Diseño de base de datos multi-tenant
- [x] Configuración FastAPI
- [x] Modelos SQLAlchemy
- [x] Sistema de autenticación JWT
- [ ] Endpoints CRUD básicos
- [ ] Sincronización offline básica

### 🔄 Fase 2 - Módulos Core (En progreso)
- [ ] Módulo sanitario completo
- [ ] Sistema de alertas
- [ ] Módulo reproductivo
- [ ] Reportes e indicadores
- [ ] Integración ICA

### 📅 Fase 3 - Funcionalidades Avanzadas
- [ ] Análisis financiero
- [ ] Comercialización
- [ ] Integración hardware (básculas, RFID)
- [ ] Machine Learning básico
- [ ] Sistema de facturación

## 📝 Endpoints API Disponibles

### Health Check
```
GET /health
```

### Próximos Endpoints (En desarrollo)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh

GET    /api/v1/fincas
POST   /api/v1/fincas
GET    /api/v1/fincas/{id}

GET    /api/v1/animales
POST   /api/v1/animales
GET    /api/v1/animales/{id}
PUT    /api/v1/animales/{id}
DELETE /api/v1/animales/{id}
```

## 🔒 Seguridad

- Autenticación JWT con tokens de acceso y refresco
- Hash de contraseñas con bcrypt
- CORS configurado
- Rate limiting (Redis)
- Validación de datos con Pydantic

## 🌍 Localización

- Zona horaria: America/Bogota
- Idioma: Español Colombia (es_CO)
- Integración con normativa ICA
- Términos ganaderos colombianos

## 📄 Licencia

Propietario - Todos los derechos reservados

## 👥 Equipo

- Backend Developer
- Mobile Developer
- UX/UI Designer (part-time)

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Versión**: 0.1.0 (MVP en desarrollo)  
**Última actualización**: Abril 2025
