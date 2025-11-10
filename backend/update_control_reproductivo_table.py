"""
Script para actualizar la tabla controles_reproductivos
Migra de estructura antigua con múltiples fechas a estructura simplificada con fecha_evento
"""
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ganadero_digital"

def update_table():
    """Actualiza la tabla controles_reproductivos a la nueva estructura"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Iniciando migración de tabla controles_reproductivos...")
        
        # 1. Eliminar tabla vieja
        print("1. Eliminando tabla antigua...")
        conn.execute(text("DROP TABLE IF EXISTS controles_reproductivos CASCADE;"))
        conn.commit()
        
        # 2. Crear nueva tabla con estructura simplificada
        print("2. Creando tabla nueva...")
        create_table_sql = text("""
        CREATE TABLE controles_reproductivos (
            id SERIAL PRIMARY KEY,
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
            animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
            
            -- Tipo y fecha del evento
            tipo_evento VARCHAR(50) NOT NULL,
            fecha_evento DATE NOT NULL,
            
            -- SERVICIO/MONTA
            toro_id INTEGER REFERENCES animales(id) ON DELETE SET NULL,
            tipo_servicio VARCHAR(50),
            numero_servicio INTEGER,
            pajuela_utilizada VARCHAR(200),
            toro_pajuela VARCHAR(200),
            
            -- DIAGNÓSTICO
            diagnostico VARCHAR(20),
            metodo_diagnostico VARCHAR(50),
            dias_gestacion INTEGER,
            fecha_probable_parto DATE,
            
            -- PARTO
            tipo_parto VARCHAR(50),
            numero_crias INTEGER DEFAULT 1,
            sexo_cria VARCHAR(20),
            peso_cria FLOAT,
            facilidad_parto VARCHAR(20),
            vitalidad_cria VARCHAR(20),
            
            -- COMUNES
            veterinario VARCHAR(200),
            costo FLOAT,
            observaciones TEXT,
            
            -- Auditoría
            registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            
            -- BaseModel fields
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            sync_version INTEGER DEFAULT 1 NOT NULL,
            sync_status VARCHAR(20) DEFAULT 'synced',
            last_sync_at TIMESTAMP WITH TIME ZONE,
            last_modified_device VARCHAR(100),
            
            -- Soft delete (opcional)
            eliminado BOOLEAN DEFAULT FALSE,
            eliminado_en TIMESTAMP
        );
        """)
        conn.execute(create_table_sql)
        conn.commit()
        
        # 3. Crear índices
        print("3. Creando índices...")
        indices = [
            "CREATE INDEX idx_controles_repro_finca ON controles_reproductivos(finca_id);",
            "CREATE INDEX idx_controles_repro_animal ON controles_reproductivos(animal_id);",
            "CREATE INDEX idx_controles_repro_tipo ON controles_reproductivos(tipo_evento);",
            "CREATE INDEX idx_controles_repro_fecha ON controles_reproductivos(fecha_evento);",
            "CREATE INDEX idx_controles_repro_diagnostico ON controles_reproductivos(diagnostico);",
            "CREATE INDEX idx_controles_repro_fecha_parto ON controles_reproductivos(fecha_probable_parto);",
            "CREATE INDEX idx_controles_repro_eliminado ON controles_reproductivos(eliminado);",
        ]
        for idx_sql in indices:
            conn.execute(text(idx_sql))
        conn.commit()
        
        print("✅ Migración completada exitosamente!")
        print("\nTabla controles_reproductivos actualizada con nueva estructura:")
        print("  - Campo unificado: fecha_evento")
        print("  - Campos simplificados según schema")
        print("  - Índices optimizados")

if __name__ == "__main__":
    try:
        update_table()
    except Exception as e:
        print(f"❌ Error durante la migración: {e}", file=sys.stderr)
        sys.exit(1)
