# 🐄 Ganadero Digital - HACIENDA MÁLAGA

Sistema de Gestión Ganadera para Hacienda Málaga, Río Sucio, Caldas, Colombia.

## 🏗️ Estructura del Proyecto

```
ganadero-digital/
├── backend/          # FastAPI + PostgreSQL
├── frontend/         # React + Vite + TypeScript
└── README.md
```

## 🚀 Deploy Rápido en Railway

### 1. Conecta este repositorio a Railway
### 2. Railway detectará automáticamente ambos proyectos
### 3. Configura las variables de entorno (ver abajo)
### 4. ¡Listo!

## 🔧 Variables de Entorno (Backend)

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=tu-clave-secreta-muy-segura-cambiar-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_NAME=Ganadero Digital
DEBUG=False
ENVIRONMENT=production
```

## 📝 Acceso

- Crea usuarios mediante el endpoint `POST /api/v1/auth/register`.
- Para demos locales, habilita seed controlado con `ENABLE_BOOTSTRAP_SEED=true`.

## 🌟 Funcionalidades

- ✅ Gestión de Inventario de Animales
- ✅ Control Sanitario (vacunas, tratamientos)
- ✅ Control Reproductivo (servicios, diagnósticos, partos)
- ✅ Registro de Producción (leche/carne)
- ✅ Gestión Financiera (ventas, compras, gastos)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Sistema de Alertas
- ✅ Multi-tenancy (múltiples fincas)

## 👨‍💻 Desarrollado para

**HACIENDA MÁLAGA**  
Vereda Pueblo Viejo, Río Sucio, Caldas, Colombia  
Contacto: +57 316 3882979

---

**Versión:** Mark 1  
**Año:** 2025
