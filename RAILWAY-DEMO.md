# Demo en Railway — Finca El Progreso (staging)

Entorno **desechable** para que el cliente pruebe. **No afecta** el deploy real en Hostinger.

---

## Qué vas a crear en Railway

| Servicio | Carpeta en el repo | Función |
|----------|-------------------|---------|
| PostgreSQL | (plugin Railway) | Base de datos solo demo |
| **backend** | `backend/` | API FastAPI |
| **frontend** | `frontend/` | React / PWA |

---

## Paso 0 — Subir el código a GitHub (si aún no está)

En PowerShell, desde la carpeta del proyecto:

```powershell
cd "C:\Proyectos\Ganadero Digital"
git status
git add .
git commit -m "Configuración demo Railway (staging)"
git push origin main
```

(Opcional pero recomendado: rama solo para demo)

```powershell
git checkout -b staging
git push -u origin staging
```

En Railway puedes desplegar la rama `staging` y dejar `main` libre para Hostinger.

---

## Paso 1 — Proyecto en Railway

1. Entra a [railway.app](https://railway.app) → **New Project**.
2. Elige **Deploy from GitHub repo**.
3. Autoriza GitHub y selecciona el repo `ganadero-digital`.
4. Nombra el proyecto, por ejemplo: `Ganadero Digital Demo`.

---

## Paso 2 — Base de datos PostgreSQL

1. En el proyecto → **+ New** → **Database** → **PostgreSQL**.
2. Espera a que quede **Active**.
3. Abre el servicio Postgres → pestaña **Variables** → copia `DATABASE_URL` (la usarás en el backend).

---

## Paso 3 — Servicio BACKEND

1. **+ New** → **GitHub Repo** → mismo repositorio.
2. Click en el nuevo servicio → **Settings**:
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**` (opcional)
3. **Settings → Networking → Generate Domain** → copia la URL, ej.  
   `https://ganadero-backend-production-xxxx.up.railway.app`

### Variables del backend (pestaña Variables)

Pega estas variables (ajusta valores marcados con ⚠️):

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

> Si Railway no autocompleta `${{Postgres.DATABASE_URL}}`, pega manualmente la URL del paso 2.

```env
SECRET_KEY=PEGA_AQUI_UNA_CLAVE_LARGA_ALEATORIA
ALGORITHM=HS256
DEBUG=False
ENVIRONMENT=staging
ALLOW_PUBLIC_REGISTRATION=false
ENABLE_BOOTSTRAP_SEED=true
NOTIFICATIONS_ENABLED=false
BACKEND_CORS_ORIGINS=https://TU-FRONTEND.up.railway.app
```

**Generar SECRET_KEY** (PowerShell):

```powershell
-join ((48..57 + 65..90 + 97..122 | Get-Random -Count 48 | ForEach-Object {[char]$_}))
```

⚠️ **CORS:** la primera vez deja `BACKEND_CORS_ORIGINS` con un placeholder o vacío temporalmente; **después** de crear el frontend (paso 4), vuelve y pon la URL **exacta** del frontend (sin barra final). Luego **Redeploy** el backend.

4. **Deploy** → espera logs en verde.
5. Prueba en el navegador:  
   `https://TU-BACKEND.up.railway.app/health`  
   Debe responder: `{"status":"ok",...}`

---

## Paso 4 — Servicio FRONTEND

1. **+ New** → **GitHub Repo** → mismo repositorio.
2. **Settings**:
   - **Root Directory:** `frontend`
3. **Variables** (⚠️ obligatoria **antes** del build):

```env
VITE_API_URL=https://TU-BACKEND.up.railway.app/api/v1
```

Usa la URL real del backend del paso 3, **con** `/api/v1` al final.

4. **Settings → Networking → Generate Domain** → copia la URL del frontend.
5. **Deploy** → espera que termine el build.

6. Vuelve al **backend** y actualiza:

```env
BACKEND_CORS_ORIGINS=https://TU-FRONTEND.up.railway.app
```

→ **Redeploy** backend.

---

## Paso 5 — Probar login (usuario demo)

El seed crea automáticamente (solo en staging):

| Campo | Valor |
|-------|--------|
| Email | `admin@example.com` |
| Contraseña | `ChangeMe123!` |

1. Abre la URL del **frontend** en el navegador.
2. Inicia sesión con esas credenciales.
3. Navega: Animales, Reproductivo, Sanidad, Alertas.

**Importante:** usa datos de **prueba**, no la finca real completa.

---

## Paso 6 — Enviar al cliente

Mensaje sugerido:

> Hola, aquí puede probar Ganadero Digital (entorno de demostración):  
> **URL:** https://TU-FRONTEND.up.railway.app  
> **Usuario:** admin@example.com  
> **Clave:** ChangeMe123!  
> Es un ambiente de prueba; los datos pueden reiniciarse.

---

## Cuando el cliente diga «sí» → Hostinger (producción)

1. **No migres** la BD de Railway tal cual (salvo que quieras exportar datos demo).
2. Despliega en VPS siguiendo `DEPLOY.md` con:
   - Dominio propio
   - Nuevo `DATABASE_URL`
   - Nuevo `SECRET_KEY`
   - Usuarios reales
3. En Railway: **Settings → Danger → Delete Service** (o pausa el proyecto).

Así **nada de la demo contamina producción**.

---

## Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| Frontend sin datos | `VITE_API_URL` correcta + **redeploy frontend** tras cambiarla |
| Error CORS en consola | `BACKEND_CORS_ORIGINS` = URL exacta del frontend, redeploy backend |
| Backend crash al iniciar | Logs Railway; `DATABASE_URL` y `SECRET_KEY` definidos |
| 502 / no carga | Servicio aún building; revisa créditos Railway |
| Login falla | `ENABLE_BOOTSTRAP_SEED=true` y `ENVIRONMENT=staging`; redeploy backend |

---

## Costos

Plan Hobby/Free: crédito mensual limitado. Para demo de 2–4 semanas suele alcanzar. Apaga o borra el proyecto cuando termine la prueba.

---

## Resumen de URLs a anotar

```
Backend:  https://__________________.up.railway.app
Frontend: https://__________________.up.railway.app  ← esta le das al cliente
Health:   https://__________________.up.railway.app/health
API docs: https://__________________.up.railway.app/docs
```
