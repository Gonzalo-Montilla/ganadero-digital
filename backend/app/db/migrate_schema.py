"""
Migraciones ligeras (ALTER ADD COLUMN) para despliegues sin Alembic.
"""
from sqlalchemy import text

from app.db.database import engine


def ensure_transaccion_rubro_columns() -> None:
    statements = [
        "ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS rubro_venta VARCHAR(50)",
        "ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS cantidad_litros DOUBLE PRECISION",
        "ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS precio_por_litro DOUBLE PRECISION",
        "ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS rubro_afectacion VARCHAR(50)",
        """
        UPDATE transacciones
        SET rubro_venta = 'animal_sacrificio'
        WHERE tipo = 'venta' AND rubro_venta IS NULL AND animal_id IS NOT NULL
        """,
        """
        UPDATE transacciones
        SET rubro_venta = 'otro'
        WHERE tipo = 'venta' AND rubro_venta IS NULL
        """,
        """
        UPDATE transacciones
        SET rubro_afectacion = 'general'
        WHERE tipo = 'gasto' AND rubro_afectacion IS NULL
        """,
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def ensure_historial_pesajes_table() -> None:
    statements = [
        """
        CREATE TABLE IF NOT EXISTS historial_pesajes (
            id SERIAL PRIMARY KEY,
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
            animal_id INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            peso_kg DOUBLE PRECISION NOT NULL,
            observaciones TEXT,
            registrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            sync_version INTEGER DEFAULT 1 NOT NULL,
            sync_status VARCHAR(20) DEFAULT 'synced',
            last_sync_at TIMESTAMPTZ,
            last_modified_device VARCHAR(100)
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_historial_pesajes_finca_id ON historial_pesajes (finca_id)",
        "CREATE INDEX IF NOT EXISTS ix_historial_pesajes_animal_id ON historial_pesajes (animal_id)",
        "CREATE INDEX IF NOT EXISTS ix_historial_pesajes_fecha ON historial_pesajes (fecha)",
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def run_migrations() -> None:
    ensure_transaccion_rubro_columns()
    ensure_historial_pesajes_table()
