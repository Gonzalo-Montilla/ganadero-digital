"""
Endpoints para sincronización offline
"""
import logging
from datetime import datetime, date
from typing import List, Dict, Any, Type
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.animal import Animal
from app.models.finca import Finca
from app.models.control_sanitario import ControlSanitario
from app.models.control_reproductivo import ControlReproductivo
from app.models.registro_produccion import RegistroProduccion
from app.models.transaccion import Transaccion
from app.schemas.sync import (
    SyncRequest,
    SyncResponse,
    SyncConflict,
    SyncStats,
    SyncOperation
)

router = APIRouter()
logger = logging.getLogger(__name__)

IMMUTABLE_SYNC_FIELDS = frozenset({"id", "finca_id", "created_at", "registrado_por"})

PULL_ENTITY_TYPES: dict[str, Type] = {
    "animal": Animal,
    "control_sanitario": ControlSanitario,
    "control_reproductivo": ControlReproductivo,
    "produccion": RegistroProduccion,
    "transaccion": Transaccion,
}


def _sanitize_sync_data(data: dict | None) -> dict:
    if not data:
        return {}
    return {k: v for k, v in data.items() if k not in IMMUTABLE_SYNC_FIELDS}


def _serialize_entity(entity: Any) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for column in entity.__table__.columns:
        value = getattr(entity, column.name)
        if isinstance(value, datetime):
            data[column.name] = value.isoformat()
        elif isinstance(value, date):
            data[column.name] = value.isoformat()
        else:
            data[column.name] = value
    return data


def _pull_updates_since_sync(
    db: Session,
    finca_id: int,
    device_id: str,
    last_sync: datetime,
) -> list[dict[str, Any]]:
    updates: list[dict[str, Any]] = []
    for entity_type, model_class in PULL_ENTITY_TYPES.items():
        query = db.query(model_class).filter(
            model_class.finca_id == finca_id,
            model_class.updated_at > last_sync,
        )
        if hasattr(model_class, "last_modified_device"):
            query = query.filter(model_class.last_modified_device != device_id)

        for entity in query.all():
            updates.append({
                "entity_type": entity_type,
                "entity_id": entity.id,
                "operation": "update",
                "data": _serialize_entity(entity),
            })
    return updates


def get_model_class(entity_type: str):
    """Obtener clase de modelo según tipo de entidad"""
    models = {
        "animal": Animal,
        "finca": Finca,
        "control_sanitario": ControlSanitario,
        "control_reproductivo": ControlReproductivo,
        "produccion": RegistroProduccion,
        "transaccion": Transaccion,
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
        if client_operation.data:
            for key, value in _sanitize_sync_data(client_operation.data).items():
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
                for key, value in _sanitize_sync_data(client_operation.data).items():
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
    errors: List[str] = []

    for operation in sync_request.operations:
        try:
            model_class = get_model_class(operation.entity_type)
            if not model_class:
                errors.append(f"Tipo de entidad desconocido: {operation.entity_type}")
                continue
            
            # Buscar entidad en servidor (si el id es local temporal en el cliente, se asume create)
            server_entity = None
            if operation.entity_id > 0:
                server_entity = db.query(model_class).filter(
                    model_class.id == operation.entity_id,
                    model_class.finca_id == current_user.finca_id
                ).first()
            
            if operation.operation == "create":
                if not server_entity and operation.data:
                    create_data = _sanitize_sync_data(operation.data)
                    new_entity = model_class(
                        **create_data,
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
                        if operation.data:
                            for key, value in _sanitize_sync_data(operation.data).items():
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
        
        except Exception as exc:
            logger.exception(
                "Error sync op %s %s:%s",
                operation.operation,
                operation.entity_type,
                operation.entity_id,
            )
            errors.append(
                f"{operation.entity_type}#{operation.entity_id} ({operation.operation}): {exc}"
            )

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Error al confirmar sincronización")
        errors.append(f"Commit fallido: {exc}")

    if sync_request.last_sync:
        updates_from_server = _pull_updates_since_sync(
            db,
            current_user.finca_id,
            sync_request.device_id,
            sync_request.last_sync,
        )

    error_note = f" {len(errors)} errores." if errors else ""
    return SyncResponse(
        success=len(errors) == 0,
        synced_at=datetime.utcnow(),
        conflicts=conflicts,
        updates_from_server=updates_from_server,
        errors=errors,
        message=f"Sincronización completada. {len(conflicts)} conflictos detectados.{error_note}"
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
