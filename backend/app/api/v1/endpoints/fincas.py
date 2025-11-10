"""
Endpoints CRUD para Fincas
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, get_current_admin
from app.models.usuario import Usuario
from app.models.finca import Finca
from app.schemas.finca import (
    FincaUpdate,
    FincaResponse
)

router = APIRouter()


@router.get("/me", response_model=FincaResponse)
def get_mi_finca(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener información de la finca del usuario actual.
    """
    finca = db.query(Finca).filter(Finca.id == current_user.finca_id).first()
    
    if not finca:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finca no encontrada"
        )
    
    return finca


@router.put("/me", response_model=FincaResponse)
def update_mi_finca(
    finca_data: FincaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin)  # Solo admin/propietario
):
    """
    Actualizar información de la finca del usuario actual.
    Solo admin/propietario pueden modificar la finca.
    """
    finca = db.query(Finca).filter(Finca.id == current_user.finca_id).first()
    
    if not finca:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finca no encontrada"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = finca_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(finca, field, value)
    
    # Incrementar versión de sync
    finca.sync_version += 1
    finca.sync_status = "pending"
    
    db.commit()
    db.refresh(finca)
    
    return finca


@router.get("/estadisticas", response_model=dict)
def get_estadisticas_finca(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener estadísticas generales de la finca.
    """
    from app.models.animal import Animal
    from sqlalchemy import func
    
    # Query base para la finca del usuario
    finca_id = current_user.finca_id
    
    # Estadísticas de animales
    total_animales = db.query(Animal).filter(
        Animal.finca_id == finca_id,
        Animal.estado == "activo"
    ).count()
    
    animales_por_sexo = db.query(
        Animal.sexo,
        func.count(Animal.id).label("total")
    ).filter(
        Animal.finca_id == finca_id,
        Animal.estado == "activo"
    ).group_by(Animal.sexo).all()
    
    animales_por_categoria = db.query(
        Animal.categoria,
        func.count(Animal.id).label("total")
    ).filter(
        Animal.finca_id == finca_id,
        Animal.estado == "activo",
        Animal.categoria.isnot(None)
    ).group_by(Animal.categoria).all()
    
    # Formatear estadísticas
    sexo_stats = {sexo: total for sexo, total in animales_por_sexo}
    categoria_stats = {categoria: total for categoria, total in animales_por_categoria}
    
    return {
        "total_animales": total_animales,
        "por_sexo": sexo_stats,
        "por_categoria": categoria_stats,
        "machos": sexo_stats.get("macho", 0),
        "hembras": sexo_stats.get("hembra", 0),
        "terneros": categoria_stats.get("ternero", 0),
        "novillos": categoria_stats.get("novillo", 0),
        "vacas": categoria_stats.get("vaca", 0),
        "toros": categoria_stats.get("toro", 0)
    }