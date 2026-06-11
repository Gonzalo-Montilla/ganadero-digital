# Guía de deploy — Finca El Progreso

Stack: FastAPI (`backend/`) + React/Vite PWA (`frontend/`).

## 1. Backend (Railway u otro)

**Root directory:** `backend`

**Variables obligatorias:**

```env
DATABASE_URL=postgresql://...          # Railway PostgreSQL o tu instancia
SECRET_KEY=genera-clave-larga-aleatoria
ALGORITHM=HS256
DEBUG=False
ENVIRONMENT=production
ALLOW_PUBLIC_REGISTRATION=false
BACKEND_CORS_ORIGINS=https://tu-frontend.up.railway.app,http://localhost:5173
```

**Variables opcionales (correo de alertas):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASSWORD=app-password-de-gmail
SMTP_FROM=tu-correo@gmail.com
SMTP_FROM_NAME=Finca El Progreso
NOTIFICATIONS_ENABLED=true
NOTIFICATIONS_DAILY_HOUR=6
NOTIFICATIONS_DAILY_MINUTE=0
```

**Comando de arranque típico:**

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Migraciones / DB inicial:** ejecutar en el entorno de producción tras el primer deploy (según tu flujo Alembic o script de init).

---

## 2. Frontend (Railway u otro)

**Root directory:** `frontend`

**Variables:**

```env
VITE_API_URL=https://tu-backend.up.railway.app/api/v1
```

Importante: `VITE_API_URL` debe incluir el sufijo `/api/v1`.

**Build:**

```bash
npm install && npm run build
```

**Start (preview en producción):**

```bash
npm run preview -- --host 0.0.0.0 --port $PORT
```

O el script `npm start` del `package.json` (build + preview en puerto 8080).

---

## 3. Checklist post-deploy

1. Login con el usuario bootstrap (registro público desactivado).
2. CORS: el frontend carga datos sin error CORS en consola.
3. PWA: en producción, DevTools → Application → Service Worker activo.
4. Manifest e iconos responden 200 (`/manifest.webmanifest`, `/sw.js`).
5. Probar offline: crear un animal sin red → badge “Sincronizar (N)” → reconectar → sincronizar.

---

## 4. Troubleshooting

| Problema | Solución |
|----------|----------|
| Backend no arranca | Revisar `DATABASE_URL` y `SECRET_KEY` en logs |
| CORS bloqueado | Añadir URL exacta del frontend a `BACKEND_CORS_ORIGINS` (sin barra final) |
| Frontend sin datos | Verificar `VITE_API_URL` y rebuild del frontend tras cambiar la variable |
| SW no registra | Solo se registra con `import.meta.env.PROD`; usar build de producción |
| Fotos no cargan | Requieren JWT; rutas `/api/v1/media/...` con sesión activa |

---

## 5. Costos Railway (referencia)

Plan free: ~$5 crédito/mes — suficiente para backend + frontend + PostgreSQL en uso interno. Producción continua: considerar plan Pro.
