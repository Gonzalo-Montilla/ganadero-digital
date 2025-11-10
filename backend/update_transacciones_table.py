"""
Script para actualizar la tabla transacciones a la nueva estructura
"""
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ganadero_digital"

def update_table():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Iniciando migración de transacciones...")
        conn.execute(text("DROP TABLE IF EXISTS transacciones CASCADE;"))
        conn.commit()

        create_sql = text("""
        CREATE TABLE transacciones (
            id SERIAL PRIMARY KEY,
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,

            -- Campos principales
            tipo VARCHAR(50) NOT NULL,
            fecha DATE NOT NULL,
            concepto VARCHAR(200) NOT NULL,
            monto FLOAT NOT NULL,

            -- Ventas/compras de animales
            animal_id INTEGER REFERENCES animales(id) ON DELETE SET NULL,
            numero_animales INTEGER,
            peso_total FLOAT,
            precio_por_kg FLOAT,

            -- Información del tercero
            tercero VARCHAR(200),
            documento_tercero VARCHAR(50),

            -- Método de pago
            metodo_pago VARCHAR(50),

            -- Categoría de gasto
            categoria_gasto VARCHAR(100),

            -- Observaciones
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
            "CREATE INDEX idx_trans_finca ON transacciones(finca_id);",
            "CREATE INDEX idx_trans_tipo ON transacciones(tipo);",
            "CREATE INDEX idx_trans_fecha ON transacciones(fecha);"
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
