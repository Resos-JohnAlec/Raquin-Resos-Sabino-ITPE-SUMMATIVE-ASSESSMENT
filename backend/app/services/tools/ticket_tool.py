from typing import Optional, Dict, Any
from uuid import UUID
import httpx
from sqlalchemy.orm import Session
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.tool_invocation import ToolInvocation, ToolInvocationStatus
from app.core.config import settings


def create_support_ticket(
    db: Session,
    requester_id: UUID,
    title: str,
    description: str,
    priority: str = "medium",
    conversation_id: Optional[UUID] = None,
    escalation_reason: Optional[str] = None
) -> Ticket:
    try:
        p_enum = TicketPriority(priority.lower())
    except ValueError:
        p_enum = TicketPriority.MEDIUM

    ticket = Ticket(
        requester_id=requester_id,
        conversation_id=conversation_id,
        title=title,
        description=description,
        priority=p_enum,
        status=TicketStatus.OPEN,
        escalation_reason=escalation_reason,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    tool_log = ToolInvocation(
        conversation_id=conversation_id,
        user_id=requester_id,
        tool_name="create_support_ticket",
        parameters={
            "title": title,
            "description": description,
            "priority": priority,
            "escalation_reason": escalation_reason
        },
        result={
            "ticket_id": str(ticket.id),
            "status": ticket.status.value if hasattr(ticket.status, 'value') else str(ticket.status)
        },
        status=ToolInvocationStatus.EXECUTED
    )
    db.add(tool_log)
    db.commit()

    dispatch_n8n_ticket_webhook(ticket)

    return ticket


def dispatch_n8n_ticket_webhook(ticket: Ticket) -> bool:
    if not settings.N8N_WEBHOOK_URL:
        return False

    payload = {
        "event": "ticket_created",
        "ticket_id": str(ticket.id),
        "requester_id": str(ticket.requester_id),
        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority.value if hasattr(ticket.priority, 'value') else str(ticket.priority),
        "escalation_reason": ticket.escalation_reason,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None
    }
    try:
        with httpx.Client(timeout=2.0) as client:
            client.post(settings.N8N_WEBHOOK_URL, json=payload)
        return True
    except Exception:
        return False
