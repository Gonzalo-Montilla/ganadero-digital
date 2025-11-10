"""
Punto de entrada de FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.db.database import init_db
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema de Gestión Ganadera SaaS para Colombia",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Inicializar DB (para desarrollo; en producción usar Alembic)
    init_db()


@app.get("/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Servir archivos estáticos (imágenes)
media_dir = Path("media")
media_dir.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Incluir routers de API
app.include_router(api_router, prefix="/api/v1")
