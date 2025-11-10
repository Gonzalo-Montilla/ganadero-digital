"""
Router principal de la API v1
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (auth, fincas, animales, sync, 
                                     control_sanitario, control_reproductivo,
                                     produccion, transacciones, dashboard, imagenes)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(fincas.router, prefix="/fincas", tags=["fincas"])
api_router.include_router(animales.router, prefix="/animales", tags=["animales"])
api_router.include_router(control_sanitario.router, prefix="/control-sanitario", tags=["control-sanitario"])
api_router.include_router(control_reproductivo.router, prefix="/control-reproductivo", tags=["control-reproductivo"])
api_router.include_router(produccion.router, prefix="/produccion", tags=["produccion"])
api_router.include_router(transacciones.router, prefix="/transacciones", tags=["transacciones"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(imagenes.router, prefix="/imagenes", tags=["imagenes"])
api_router.include_router(sync.router, prefix="/sync", tags=["synchronization"])
