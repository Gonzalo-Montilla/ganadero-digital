"""Ejecutar seed demo: /opt/venv/bin/python scripts/seed_demo.py"""
from app.db.import_models import import_all_models
from app.db.database import SessionLocal, engine, Base
from app.db.seed import seed_initial_data


def main() -> None:
    import_all_models()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
        db.commit()
        print("OK: usuario demo admin@example.com / ChangeMe123!")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
