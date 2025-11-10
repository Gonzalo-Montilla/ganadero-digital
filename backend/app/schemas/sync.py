"""
Schemas Pydantic para sincronización offline
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class SyncOperation(BaseModel):
    """Schema para una operación de sincronización"""
    entity_type: str  # animal, finca, control_sanitario, etc.
    entity_id: int
    operation: str  # create, update, delete
    data: Optional[Dict[str, Any]] = None
    device_id: str
    local_timestamp: datetime
    sync_version: int


class SyncRequest(BaseModel):
    """Schema para solicitud de sincronización"""
    device_id: str
    last_sync: Optional[datetime] = None
    operations: List[SyncOperation] = []


class SyncConflict(BaseModel):
    """Schema para conflicto de sincronización"""
    entity_type: str
    entity_id: int
    server_version: int
    client_version: int
    server_data: Dict[str, Any]
    client_data: Dict[str, Any]
    conflict_resolution: str  # server_wins, client_wins, manual


class SyncResponse(BaseModel):
    """Schema para respuesta de sincronización"""
    success: bool
    synced_at: datetime
    conflicts: List[SyncConflict] = []
    updates_from_server: List[Dict[str, Any]] = []
    message: str


class SyncStats(BaseModel):
    """Estadísticas de sincronización"""
    last_sync: Optional[datetime] = None
    pending_operations: int
    synced_entities: int
    conflicts: int
