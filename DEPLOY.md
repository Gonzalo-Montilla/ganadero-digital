# 🚀 GUÍA DE DEPLOY - Ganadero Digital

## ✅ PREPARACIÓN (YA HECHO)

La estructura está lista:
```
ganadero-digital-deploy/
├── backend/    (FastAPI)
├── frontend/   (React + Vite)
```

---

## 📝 PASOS PARA DEPLOY EN RAILWAY

### **1. Sube el código a GitHub**

```bash
cd "C:\Users\USUARIO\Documents\ganadero-digital-deploy"

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit - Ganadero Digital v1.0"

# Crear repositorio en GitHub y conectar
# Ve a: https://github.com/new
# Nombre: ganadero-digital
# Luego ejecuta:

git remote add origin https://github.com/TU-USUARIO/ganadero-digital.git
git branch -M main
git push -u origin main
```

---

### **2. Crear cuenta en Railway**

1. Ve a: https://railway.app
2. Clic en "Start a New Project"
3. Login con GitHub
4. Autoriza Railway

---

### **3. Deploy del BACKEND**

1. En Railway → "New Project"
2. "Deploy from GitHub repo"
3. Selecciona `ganadero-digital`
4. Railway detectará Python → Acepta
5. Ve a **Settings** → **Root Directory** → pon: `backend`
6. Ve a **Variables** y agrega:

```
DATABASE_URL=tu-database-url-de-railway-postgresql
SECRET_KEY=genera-una-clave-segura-aqui-123456789abcdef
ALGORITHM=HS256
DEBUG=False
ENVIRONMENT=production
```

7. En **Networking** → "Generate Domain"
8. Copia la URL (ej: `https://ganadero-backend.up.railway.app`)

---

### **4. Crear PostgreSQL**

1. En el mismo proyecto → "+ New"
2. "Database" → "PostgreSQL"
3. Railway creará la DB automáticamente
4. La variable `DATABASE_URL` se conectará sola al backend

---

### **5. Deploy del FRONTEND**

1. Mismo proyecto → "+ New"
2. "GitHub Repo" → Selecciona `ganadero-digital` otra vez
3. Ve a **Settings** → **Root Directory** → pon: `frontend`
4. Ve a **Variables** y agrega:

```
VITE_API_URL=https://ganadero-backend.up.railway.app/api/v1
```
(Usa la URL del backend del paso 3)

5. En **Settings** → **Build Command**:
```
npm install && npm run build
```

6. **Start Command**:
```
npm run preview -- --host 0.0.0.0 --port $PORT
```

7. En **Networking** → "Generate Domain"
8. Copia la URL del frontend

---

### **6. Inicializar Base de Datos**

Railway ejecutará las migraciones automáticamente al iniciar.

---

### **7. ¡LISTO! 🎉**

Tu app estará en:
- **Frontend**: `https://tu-app.up.railway.app`
- **Backend**: `https://tu-backend.up.railway.app`

**Credenciales de prueba:**
- Email: `admin@mifinca.com`
- Contraseña: `password123`

---

## 🔧 TROUBLESHOOTING

### Backend no inicia:
- Verifica que `DATABASE_URL` esté configurado
- Revisa logs en Railway

### Frontend no conecta:
- Verifica `VITE_API_URL` apunte al backend correcto
- El backend debe tener CORS habilitado (ya está configurado)

### Base de datos vacía:
- Ejecuta desde la terminal de Railway:
```bash
python -c "from app.db.database import init_db; init_db()"
```

---

## 💰 COSTOS

Railway FREE tier incluye:
- $5 de crédito mensual
- Suficiente para 1 backend + 1 frontend + 1 DB PostgreSQL
- ~500 horas/mes

Para producción real, considera el plan Pro ($20/mes).
