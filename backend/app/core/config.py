"""
Configuración central de la aplicación
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Configuración de la aplicación desde variables de entorno"""
    
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
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Configuración de archivos
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    
    # Localización
    TIMEZONE: str = "America/Bogota"
    LOCALE: str = "es_CO"
    
    # Email (opcional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Paginación
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 100
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @validator("ALLOWED_IMAGE_EXTENSIONS", pre=True)
    def assemble_image_extensions(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()
