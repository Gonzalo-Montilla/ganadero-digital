"""
Configuración central de la aplicación
"""
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación desde variables de entorno"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )

    # Información de la aplicación
    APP_NAME: str = "Ganadero Digital"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Base de datos
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_TEST_URL: Optional[str] = None

    # Seguridad JWT
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS: string separado por comas en .env (pydantic-settings no parsea listas CSV nativamente)
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
    )

    # Registro público (single-tenant: solo bootstrap del primer usuario)
    ALLOW_PUBLIC_REGISTRATION: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Configuración de archivos
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,webp"

    # Localización
    TIMEZONE: str = "America/Bogota"
    LOCALE: str = "es_CO"

    # Email (opcional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    SMTP_FROM_NAME: str = "Finca El Progreso"
    EMAIL_LOGO_PATH: str = "media/branding/logo-email.png"
    EMAIL_LOGO_CID: str = "logo_finca"

    # Notificaciones por correo
    NOTIFICATIONS_ENABLED: bool = False
    NOTIFICATIONS_DAILY_HOUR: int = 6
    NOTIFICATIONS_DAILY_MINUTE: int = 0

    # Paginación
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 100

    @staticmethod
    def _split_csv(value: str) -> List[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def cors_origins(self) -> List[str]:
        return self._split_csv(self.BACKEND_CORS_ORIGINS)

    @property
    def image_extensions(self) -> List[str]:
        return self._split_csv(self.ALLOWED_IMAGE_EXTENSIONS)


# Instancia global de configuración
settings = Settings()
