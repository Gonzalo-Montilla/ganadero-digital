"""
Endpoints para gestión de imágenes de animales
"""
import os
import shutil
from typing import Any
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.animal import Animal
from pydantic import BaseModel

router = APIRouter()

# Directorio para almacenar imágenes
IMAGENES_DIR = Path("media/animales")
IMAGENES_DIR.mkdir(parents=True, exist_ok=True)

# Extensiones permitidas
EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class ImagenResponse(BaseModel):
    """Respuesta después de subir imagen"""
    url: str
    filename: str
    animal_id: int
    mensaje: str


@router.post("/animales/{animal_id}/foto", response_model=ImagenResponse)
async def subir_foto_animal(
    *,
    db: Session = Depends(get_db),
    animal_id: int,
    current_user: Usuario = Depends(get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Subir foto de un animal
    """
    # Verificar que el animal exista y pertenezca a la finca
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    # Validar extensión
    extension = Path(file.filename).suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión no permitida. Use: {', '.join(EXTENSIONES_PERMITIDAS)}"
        )
    
    # Validar tamaño (leer el archivo en chunks)
    file_size = 0
    for chunk in iter(lambda: file.file.read(8192), b""):
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Archivo muy grande. Máximo {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
    
    # Resetear el puntero del archivo
    file.file.seek(0)
    
    # Generar nombre único: finca_id_animal_id_timestamp.ext
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.finca_id}_{animal_id}_{timestamp}{extension}"
    filepath = IMAGENES_DIR / filename
    
    # Guardar archivo
    try:
        with filepath.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar archivo: {str(e)}"
        )
    finally:
        file.file.close()
    
    # Actualizar URL en el animal
    foto_url = f"/media/animales/{filename}"
    animal.foto_url = foto_url
    
    db.commit()
    db.refresh(animal)
    
    return ImagenResponse(
        url=foto_url,
        filename=filename,
        animal_id=animal_id,
        mensaje="Foto subida exitosamente"
    )


@router.delete("/animales/{animal_id}/foto", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_foto_animal(
    *,
    db: Session = Depends(get_db),
    animal_id: int,
    current_user: Usuario = Depends(get_current_user)
) -> None:
    """
    Eliminar foto de un animal
    """
    animal = db.query(Animal).filter(
        Animal.id == animal_id,
        Animal.finca_id == current_user.finca_id
    ).first()
    
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal no encontrado"
        )
    
    if not animal.foto_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El animal no tiene foto"
        )
    
    # Extraer nombre de archivo de la URL
    filename = animal.foto_url.split("/")[-1]
    filepath = IMAGENES_DIR / filename
    
    # Eliminar archivo físico si existe
    if filepath.exists():
        try:
            filepath.unlink()
        except Exception:
            pass  # No fallar si no se puede eliminar el archivo
    
    # Actualizar BD
    animal.foto_url = None
    db.commit()
    
    return None
