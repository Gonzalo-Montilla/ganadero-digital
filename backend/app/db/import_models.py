"""
Importa todos los modelos ORM para registrar tablas y relaciones en SQLAlchemy.
Necesario antes de create_all o queries en scripts/consola.
"""


def import_all_models() -> None:
    import app.models.animal  # noqa: F401
    import app.models.control_reproductivo  # noqa: F401
    import app.models.control_sanitario  # noqa: F401
    import app.models.finca  # noqa: F401
    import app.models.historial_pesaje  # noqa: F401
    import app.models.registro_produccion  # noqa: F401
    import app.models.transaccion  # noqa: F401
    import app.models.usuario  # noqa: F401
