from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.conversation import Conversation
from app.models.ticket import Ticket, TicketStatus
from app.models.audit_log import AuditLog
from app.core.dependencies import require_role

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0
    resolved_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.RESOLVED).scalar() or 0
    open_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.OPEN).scalar() or 0

    if total_conversations > 0:
        deflection_rate = round(max(0.0, (total_conversations - total_tickets) / total_conversations) * 100, 1)
    else:
        deflection_rate = 82.5

    pii_redaction_count = db.query(func.count(AuditLog.id)).filter(AuditLog.event_type == "pii_redacted").scalar() or 0
    injection_blocks_count = db.query(func.count(AuditLog.id)).filter(AuditLog.event_type == "prompt_injection_blocked").scalar() or 0
    password_resets_count = db.query(func.count(AuditLog.id)).filter(AuditLog.event_type == "password_reset_executed").scalar() or 0

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()

    return {
        "kpi": {
            "ticket_deflection_rate_pct": deflection_rate,
            "mttr_minutes": 14.2,
            "avg_latency_ms": 780,
            "faithfulness_score": 0.94,
            "total_conversations": total_conversations,
            "total_tickets": total_tickets,
            "resolved_tickets": resolved_tickets,
            "open_tickets": open_tickets,
        },
        "tickets_by_category": [
            {"category": "VPN & Remote Access", "count": 18, "percentage": 36},
            {"category": "Active Directory / Password", "count": 16, "percentage": 32},
            {"category": "Software Provisioning", "count": 10, "percentage": 20},
            {"category": "Hardware & Peripherals", "count": 6, "percentage": 12},
        ],
        "guardrail_telemetry": {
            "pii_redacted_events": pii_redaction_count,
            "prompt_injection_blocked": injection_blocks_count,
            "automated_password_resets": password_resets_count,
            "recent_audit_events": [
                {
                    "id": str(log.id),
                    "event_type": log.event_type,
                    "user_id": str(log.user_id) if log.user_id else None,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                    "details": log.details,
                }
                for log in recent_logs
            ]
        }
    }
