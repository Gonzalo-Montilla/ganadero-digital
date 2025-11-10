"""
Script para actualizar la tabla registros_produccion a la nueva estructura
"""
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ganadero_digital"

def update_table():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Iniciando migración de registros_produccion...")
        conn.execute(text("DROP TABLE IF EXISTS registros_produccion CASCADE;"))
        conn.commit()

        create_sql = text("""
        CREATE TABLE registros_produccion (
            id SERIAL PRIMARY KEY,
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
            animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,

            -- Campos principales
            tipo_produccion VARCHAR(50) NOT NULL,
            fecha DATE NOT NULL,

            -- Producción lechera
            cantidad_litros FLOAT,
            turno VARCHAR(20),

            -- Producción carne
            peso_venta FLOAT,

            -- Otros
            calidad VARCHAR(50),
            observaciones TEXT,

            -- Auditoría
            registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

            -- BaseModel fields
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            sync_version INTEGER DEFAULT 1 NOT NULL,
            sync_status VARCHAR(20) DEFAULT 'synced',
            last_sync_at TIMESTAMP WITH TIME ZONE,
            last_modified_device VARCHAR(100)
        );
        """)
        conn.execute(create_sql)
        conn.commit()

        print("Creando índices...")
        for idx in [
            "CREATE INDEX idx_prod_finca ON registros_produccion(finca_id);",
            "CREATE INDEX idx_prod_animal ON registros_produccion(animal_id);",
            "CREATE INDEX idx_prod_tipo ON registros_produccion(tipo_produccion);",
            "CREATE INDEX idx_prod_fecha ON registros_produccion(fecha);"
        ]:
            conn.execute(text(idx))
        conn.commit()

        print("✅ Migración completada")

if __name__ == "__main__":
    try:
        update_table()
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
