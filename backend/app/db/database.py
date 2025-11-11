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
    Si no existe, crear usuario y finca por defecto.
    """
    Base.metadata.create_all(bind=engine)
    
    # Crear usuario inicial si no existe
    db = SessionLocal()
    try:
        from app.models.usuario import Usuario
        from app.models.finca import Finca
        from app.core.security import get_password_hash
        
        # Verificar si ya existe el usuario
        existing_user = db.query(Usuario).filter(Usuario.email == "admin@mifinca.com").first()
        if not existing_user:
            print("📝 Creando finca y usuario inicial...")
            
            # Crear finca
            finca = Finca(
                nombre="Hacienda Málaga",
                nit="123456789",
                direccion="Vereda Pueblo Viejo, Río Sucio, Caldas",
                telefono="+57 316 3882979",
                email="admin@mifinca.com"
            )
            db.add(finca)
            db.flush()
            
            # Crear usuario admin
            usuario = Usuario(
                email="admin@mifinca.com",
                nombre_completo="Byron Betancur",
                hashed_password=get_password_hash("password123"),
                rol="propietario",
                finca_id=finca.id,
                is_active=True
            )
            db.add(usuario)
            db.commit()
            
            print("✅ Usuario inicial creado: admin@mifinca.com / password123")
    except Exception as e:
        print(f"⚠️  Error creando usuario inicial: {e}")
        db.rollback()
    finally:
        db.close()
