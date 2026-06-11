"""
Script para inicializar la base de datos con datos iniciales
Ejecutar una sola vez después del primer deploy
"""
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.models.usuario import Usuario
from app.models.finca import Finca
from app.core.security import get_password_hash
import os

# URL de la base de datos desde variables de entorno
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL no está configurada")
    exit(1)

# Crear engine y session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_database():
    """Inicializar base de datos"""
    print("🔨 Creando tablas...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas")
    
    db = SessionLocal()
    
    try:
        # Verificar si ya existe el usuario admin
        existing_user = db.query(Usuario).filter(Usuario.email == "admin@example.com").first()
        if existing_user:
            print("ℹ️  Usuario admin ya existe")
            return
        
        print("👤 Creando finca y usuario inicial...")
        
        # Crear finca
        finca = Finca(
            nombre="Hacienda Málaga",
            nit="123456789",
            direccion="Vereda Pueblo Viejo, Río Sucio, Caldas",
            telefono="+57 316 3882979",
            email="admin@example.com"
        )
        db.add(finca)
        db.flush()
        
        # Crear usuario admin
        usuario = Usuario(
            email="admin@example.com",
            nombre_completo="Byron Betancur",
            hashed_password=get_password_hash("ChangeMe123!"),
            rol="propietario",
            finca_id=finca.id,
            is_active=True
        )
        db.add(usuario)
        
        db.commit()
        
        print("✅ Base de datos inicializada correctamente")
        print("\n📝 Credenciales de acceso:")
        print("   Email: admin@example.com")
        print("   Contraseña: ChangeMe123!")
        print("\n🏢 Finca: Hacienda Málaga")
        print("👤 Usuario: Byron Betancur (Propietario)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
