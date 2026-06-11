"""
Punto de entrada de FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.core.config import settings
from app.core.scheduler import detener_scheduler, iniciar_scheduler
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
_cors_origins = settings.cors_origins
_allow_credentials = "*" not in _cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins if _allow_credentials else ["*"],
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # En producción se recomienda ejecutar solo migraciones.
    if settings.ENVIRONMENT.lower() != "production":
        init_db()
    iniciar_scheduler()


@app.on_event("shutdown")
def on_shutdown():
    detener_scheduler()


@app.get("/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Directorio media (archivos servidos vía /api/v1/media con auth)
media_dir = Path("media")
media_dir.mkdir(exist_ok=True)

# Incluir routers de API
app.include_router(api_router, prefix="/api/v1")
