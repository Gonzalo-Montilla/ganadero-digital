"""
Configuración de la base de datos con SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Crear engine de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verificar conexiones antes de usarlas
    pool_size=10,  # Tamaño del pool de conexiones
    max_overflow=20,  # Conexiones adicionales permitidas
    echo=settings.DEBUG  # Loggear queries SQL en modo debug
)

# Session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obtener sesión de base de datos.
    Se usa en FastAPI para inyección de dependencias.
    
    Yields:
        Session de SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializar base de datos.
    Crear todas las tablas definidas en los modelos.
    """
    Base.metadata.create_all(bind=engine)
