"""
Wrapper de compatibilidad.
Implementación principal en app.db.database.
"""
from app.db.database import Base, SessionLocal, engine, get_db, init_db  # noqa: F401
