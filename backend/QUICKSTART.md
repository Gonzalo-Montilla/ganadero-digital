# 🚀 Inicio Rápido - Ganadero Digital

## Prerrequisitos

- Python 3.10 o superior
- PostgreSQL 14 o superior
- pip (gestor de paquetes Python)

## Paso 1: Configurar Entorno Virtual

```powershell
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Si hay error de permisos, ejecutar:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Paso 2: Instalar Dependencias

```powershell
pip install -r requirements.txt
```

## Paso 3: Configurar Base de Datos PostgreSQL

### Opción A: PostgreSQL Local

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE ganadero_digital;

# Crear usuario (opcional)
CREATE USER ganadero WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE ganadero_digital TO ganadero;

# Salir
\q
```

### Opción B: Usar la URL por defecto

El archivo `.env` ya está configurado con:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ganadero_digital
```

Ajusta usuario/password según tu instalación de PostgreSQL.

## Paso 4: Verificar Configuración

El archivo `.env` debe contener (ya está configurado):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ganadero_digital
SECRET_KEY=dev-secret-key-change-in-production-12345678
DEBUG=True
ENVIRONMENT=development
```

## Paso 5: Ejecutar el Servidor

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Deberías ver:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

## Paso 6: Verificar que Funciona

### Opción 1: Desde el navegador

Abre en tu navegador:
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Opción 2: Desde PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:8000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development"
}
```

## 🎯 Probar los Endpoints

### 1. Registrar Nueva Finca y Usuario

Ve a http://localhost:8000/docs y expande `POST /api/v1/auth/register`

O usa PowerShell:

```powershell
$body = @{
    email = "admin@mifinca.com"
    password = "password123"
    nombre_completo = "Juan Pérez"
    finca_nombre = "Finca El Paraíso"
    departamento = "Antioquia"
    municipio = "Medellín"
    tipo_ganaderia = "doble_proposito"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/register -Method Post -Body $body -ContentType "application/json"
```

Recibirás:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### 2. Login

```powershell
$loginBody = "username=admin@mifinca.com&password=password123"

Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/login -Method Post -Body $loginBody -ContentType "application/x-www-form-urlencoded"
```

### 3. Obtener Información del Usuario

```powershell
$token = "TU_ACCESS_TOKEN_AQUI"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/me -Headers $headers
```

### 4. Crear un Animal

```powershell
$animalBody = @{
    numero_identificacion = "A001"
    nombre = "Margarita"
    sexo = "hembra"
    fecha_nacimiento = "2022-01-15"
    raza = "Holstein"
    fecha_ingreso = "2022-01-15"
    categoria = "vaca"
    proposito = "leche"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/v1/animales -Method Post -Body $animalBody -Headers $headers -ContentType "application/json"
```

### 5. Listar Animales

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/animales?page=1&page_size=10" -Headers $headers
```

## 📊 Interfaz Swagger

La forma más fácil de probar la API es usar Swagger UI:

1. Ve a http://localhost:8000/docs
2. Haz clic en "Authorize" (🔒)
3. Ingresa el `access_token` que recibiste en el registro/login
4. Ya puedes probar todos los endpoints con el botón "Try it out"

## 🔧 Comandos Útiles

### Reiniciar base de datos (elimina todos los datos)

```powershell
# En PostgreSQL
psql -U postgres
DROP DATABASE ganadero_digital;
CREATE DATABASE ganadero_digital;
\q
```

Luego reinicia el servidor para recrear las tablas.

### Ver logs en tiempo real

El servidor con `--reload` ya muestra logs. Para más detalle:

```powershell
uvicorn app.main:app --reload --log-level debug
```

### Ejecutar tests (próximamente)

```powershell
pytest
```

## ❓ Problemas Comunes

### Error: "No module named 'app'"

Asegúrate de estar en el directorio raíz del proyecto:
```powershell
cd "C:\Users\USUARIO\Documents\Ganadero Digital"
```

### Error: "could not connect to server"

PostgreSQL no está corriendo. Inicia el servicio:
```powershell
# Windows
Start-Service postgresql-x64-14
```

### Error: "SECRET_KEY" not found

Falta el archivo `.env`. Cópialo desde `.env.example`:
```powershell
Copy-Item .env.example .env
```

## 📚 Próximos Pasos

1. Explorar todos los endpoints en http://localhost:8000/docs
2. Crear más animales y probar filtros
3. Implementar módulos de control sanitario y reproductivo
4. Desarrollar app móvil con sincronización offline

## 🆘 Ayuda

Si tienes problemas:
1. Verifica que PostgreSQL esté corriendo
2. Revisa el archivo `.env`
3. Asegúrate de tener el entorno virtual activado
4. Lee los logs del servidor

---

**¡Listo!** Ya tienes Ganadero Digital corriendo localmente. 🎉
