from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    event_type: str,
    user_id: Optional[UUID] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    entry = AuditLog(
        event_type=event_type,
        user_id=user_id,
        details=details or {},
        ip_address=ip_address
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
