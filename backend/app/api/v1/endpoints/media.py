"""
Servir archivos de media con autenticación JWT.
"""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.core.deps import get_current_user
from app.models.usuario import Usuario

router = APIRouter()

MEDIA_ROOT = Path("media").resolve()


@router.get("/{file_path:path}")
def servir_archivo_media(
    file_path: str,
    current_user: Usuario = Depends(get_current_user),
):
    """Entrega un archivo de media solo a usuarios autenticados."""
    candidate = (MEDIA_ROOT / file_path).resolve()
    try:
        candidate.relative_to(MEDIA_ROOT)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")

    if not candidate.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")

    return FileResponse(candidate)
