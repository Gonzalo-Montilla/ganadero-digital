"""
Endpoints para sincronización offline
"""
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.animal import Animal
from app.models.finca import Finca
from app.schemas.sync import (
    SyncRequest,
    SyncResponse,
    SyncConflict,
    SyncStats,
    SyncOperation
)

router = APIRouter()


def get_model_class(entity_type: str):
    """Obtener clase de modelo según tipo de entidad"""
    models = {
        "animal": Animal,
        "finca": Finca,
        # Agregar más modelos según sea necesario
    }
    return models.get(entity_type)


def resolve_conflict(
    server_entity: Any,
    client_operation: SyncOperation,
    strategy: str = "server_wins"
) -> tuple[Any, SyncConflict]:
    """
    Resolver conflicto de sincronización.
    
    Estrategias:
    - server_wins: El servidor prevalece (por defecto)
    - client_wins: El cliente prevalece
    - last_write_wins: Gana el último modificado por timestamp
    """
    conflict = SyncConflict(
        entity_type=client_operation.entity_type,
        entity_id=client_operation.entity_id,
        server_version=server_entity.sync_version,
        client_version=client_operation.sync_version,
        server_data={"updated_at": server_entity.updated_at.isoformat()},
        client_data={"updated_at": client_operation.local_timestamp.isoformat()},
        conflict_resolution=strategy
    )
    
    if strategy == "server_wins":
        return server_entity, conflict
    elif strategy == "client_wins":
        # Aplicar cambios del cliente
        if client_operation.data:
            for key, value in client_operation.data.items():
                if hasattr(server_entity, key):
                    setattr(server_entity, key, value)
        server_entity.sync_version += 1
        return server_entity, conflict
    elif strategy == "last_write_wins":
        # Comparar timestamps
        server_time = server_entity.updated_at or server_entity.created_at
        client_time = client_operation.local_timestamp
        
        if client_time > server_time:
            conflict.conflict_resolution = "client_wins"
            if client_operation.data:
                for key, value in client_operation.data.items():
                    if hasattr(server_entity, key):
                        setattr(server_entity, key, value)
            server_entity.sync_version += 1
        else:
            conflict.conflict_resolution = "server_wins"
        
        return server_entity, conflict
    
    return server_entity, conflict


@router.post("/sync", response_model=SyncResponse)
def sync_data(
    sync_request: SyncRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Sincronizar datos entre cliente y servidor.
    
    Proceso:
    1. Recibir operaciones pendientes del cliente
    2. Detectar y resolver conflictos
    3. Aplicar operaciones válidas
    4. Enviar actualizaciones del servidor al cliente
    """
    conflicts: List[SyncConflict] = []
    updates_from_server: List[Dict[str, Any]] = []
    
    # Procesar operaciones del cliente
    for operation in sync_request.operations:
        try:
            model_class = get_model_class(operation.entity_type)
            if not model_class:
                continue
            
            # Buscar entidad en servidor
            server_entity = db.query(model_class).filter(
                model_class.id == operation.entity_id,
                model_class.finca_id == current_user.finca_id
            ).first()
            
            if operation.operation == "create":
                # Crear nueva entidad
                if not server_entity and operation.data:
                    new_entity = model_class(
                        **operation.data,
                        finca_id=current_user.finca_id,
                        last_modified_device=sync_request.device_id
                    )
                    db.add(new_entity)
            
            elif operation.operation == "update":
                if server_entity:
                    # Detectar conflicto de versiones
                    if server_entity.sync_version > operation.sync_version:
                        # Hay conflicto - resolver
                        resolved_entity, conflict = resolve_conflict(
                            server_entity,
                            operation,
                            strategy="last_write_wins"
                        )
                        conflicts.append(conflict)
                    else:
                        # No hay conflicto - aplicar cambios
                        if operation.data:
                            for key, value in operation.data.items():
                                if hasattr(server_entity, key):
                                    setattr(server_entity, key, value)
                        server_entity.sync_version += 1
                        server_entity.last_modified_device = sync_request.device_id
            
            elif operation.operation == "delete":
                if server_entity:
                    # Soft delete
                    if hasattr(server_entity, "estado"):
                        server_entity.estado = "eliminado"
                        server_entity.sync_version += 1
                        server_entity.last_modified_device = sync_request.device_id
        
        except Exception as e:
            # Log error pero continuar con otras operaciones
            continue
    
    # Commit cambios
    db.commit()
    
    # Obtener actualizaciones del servidor para el cliente
    # (entidades modificadas desde último sync del cliente)
    if sync_request.last_sync:
        # Animales actualizados
        updated_animals = db.query(Animal).filter(
            Animal.finca_id == current_user.finca_id,
            Animal.updated_at > sync_request.last_sync,
            Animal.last_modified_device != sync_request.device_id  # No enviar los propios cambios
        ).all()
        
        for animal in updated_animals:
            updates_from_server.append({
                "entity_type": "animal",
                "entity_id": animal.id,
                "operation": "update",
                "data": {
                    "id": animal.id,
                    "numero_identificacion": animal.numero_identificacion,
                    "nombre": animal.nombre,
                    "sexo": animal.sexo,
                    "estado": animal.estado,
                    "sync_version": animal.sync_version,
                    "updated_at": animal.updated_at.isoformat() if animal.updated_at else None
                }
            })
    
    return SyncResponse(
        success=True,
        synced_at=datetime.utcnow(),
        conflicts=conflicts,
        updates_from_server=updates_from_server,
        message=f"Sincronización completada. {len(conflicts)} conflictos detectados."
    )


@router.get("/sync/stats", response_model=SyncStats)
def get_sync_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener estadísticas de sincronización para la finca.
    """
    # Contar entidades pendientes de sincronización
    pending_animals = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.sync_status == "pending"
    ).count()
    
    # Última sincronización
    last_synced_animal = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.last_sync_at.isnot(None)
    ).order_by(Animal.last_sync_at.desc()).first()
    
    last_sync = last_synced_animal.last_sync_at if last_synced_animal else None
    
    # Total de entidades sincronizadas
    synced_animals = db.query(Animal).filter(
        Animal.finca_id == current_user.finca_id,
        Animal.sync_status == "synced"
    ).count()
    
    return SyncStats(
        last_sync=last_sync,
        pending_operations=pending_animals,
        synced_entities=synced_animals,
        conflicts=0  # TODO: implementar tracking de conflictos
    )


@router.post("/sync/mark-synced")
def mark_entities_synced(
    entity_ids: List[int],
    entity_type: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Marcar entidades como sincronizadas después de confirmación del cliente.
    """
    model_class = get_model_class(entity_type)
    if not model_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de entidad inválido"
        )
    
    # Actualizar estado de sync
    db.query(model_class).filter(
        model_class.id.in_(entity_ids),
        model_class.finca_id == current_user.finca_id
    ).update({
        "sync_status": "synced",
        "last_sync_at": datetime.utcnow()
    }, synchronize_session=False)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"{len(entity_ids)} entidades marcadas como sincronizadas"
    }
