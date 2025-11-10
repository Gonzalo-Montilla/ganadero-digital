"""
Script para actualizar la tabla controles_sanitarios con los nuevos campos
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Eliminar tabla anterior si existe
    print("Eliminando tabla anterior...")
    conn.execute(text("DROP TABLE IF EXISTS controles_sanitarios CASCADE"))
    conn.commit()
    
    # Crear tabla nueva
    print("Creando tabla con nuevo esquema...")
    conn.execute(text("""
        CREATE TABLE controles_sanitarios (
            id SERIAL PRIMARY KEY,
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
            animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
            tipo VARCHAR(50) NOT NULL,
            fecha DATE NOT NULL,
            proxima_dosis DATE,
            producto VARCHAR(200),
            dosis VARCHAR(100),
            via_administracion VARCHAR(50),
            lote_producto VARCHAR(100),
            fecha_vencimiento DATE,
            diagnostico VARCHAR(1000),
            peso_animal FLOAT,
            temperatura FLOAT,
            veterinario VARCHAR(200),
            aplicado_por INTEGER,
            costo FLOAT,
            dias_retiro_leche INTEGER,
            dias_retiro_carne INTEGER,
            observaciones TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_version INTEGER DEFAULT 1,
            sync_status VARCHAR(20) DEFAULT 'synced',
            last_sync_at TIMESTAMP,
            last_modified_device VARCHAR(100)
        )
    """))
    conn.commit()
    
    # Crear índices
    print("Creando índices...")
    conn.execute(text("CREATE INDEX idx_controles_sanitarios_finca ON controles_sanitarios(finca_id)"))
    conn.execute(text("CREATE INDEX idx_controles_sanitarios_animal ON controles_sanitarios(animal_id)"))
    conn.execute(text("CREATE INDEX idx_controles_sanitarios_tipo ON controles_sanitarios(tipo)"))
    conn.execute(text("CREATE INDEX idx_controles_sanitarios_fecha ON controles_sanitarios(fecha)"))
    conn.commit()
    
    print("✅ Tabla actualizada exitosamente")
