"""
Script para agregar la columna peso_anterior a la tabla animales
"""
import os
from sqlalchemy import create_engine, text

# Leer DATABASE_URL del archivo .env
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL no encontrado en .env")
    exit(1)

# Crear engine
engine = create_engine(DATABASE_URL)

# Ejecutar ALTER TABLE
try:
    with engine.connect() as conn:
        # Verificar si la columna ya existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='animales' AND column_name='peso_anterior'
        """))
        
        if result.fetchone():
            print("✅ La columna 'peso_anterior' ya existe")
        else:
            # Agregar la columna
            conn.execute(text("ALTER TABLE animales ADD COLUMN peso_anterior FLOAT"))
            conn.commit()
            print("✅ Columna 'peso_anterior' agregada exitosamente")
            
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
