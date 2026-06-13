"""
Seed controlado para entornos de demo/desarrollo.
"""
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.finca import Finca
from app.models.usuario import Usuario


def seed_initial_data(db: Session) -> None:
    """
    Crea datos iniciales solo si no existen.
    Debe ejecutarse de forma explícita (script o variable de entorno).
    """
    bootstrap_email = "admin@example.com"
    bootstrap_password = "ChangeMe123!"

    existing_user = db.query(Usuario).filter(Usuario.email == bootstrap_email).first()
    if existing_user:
        existing_user.hashed_password = get_password_hash(bootstrap_password)
        existing_user.activo = True
        existing_user.email_verificado = True
        return

    finca = Finca(
        nombre="Finca Demo",
        nit="DEMO-0001",
        departamento="Caldas",
        municipio="Riosucio",
        vereda="Demo",
        direccion="Ubicacion demo",
        telefono="+57 300 0000000",
        email=bootstrap_email,
        tipo_ganaderia="doble_proposito",
        activa=True,
    )
    db.add(finca)
    db.flush()

    usuario = Usuario(
        email=bootstrap_email,
        nombre_completo="Admin Demo",
        hashed_password=get_password_hash(bootstrap_password),
        rol="propietario",
        finca_id=finca.id,
        activo=True,
        email_verificado=True,
    )
    db.add(usuario)
