from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketPriority
from app.models.message import Message
from app.core.dependencies import get_current_user, require_role
from app.services.guardrails.audit import log_audit_event

router = APIRouter()


class TicketResponse(BaseModel):
    id: UUID
    requester_id: UUID
    assigned_handler_id: Optional[UUID]
    status: TicketStatus
    priority: TicketPriority
    title: str
    description: str
    escalation_reason: Optional[str]
    created_at: Any

    class Config:
        from_attributes = True


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_handler_id: Optional[UUID] = None


class HandlerReplyRequest(BaseModel):
    reply_text: str
    mark_resolved: bool = True


@router.get("/", response_model=List[TicketResponse])
def list_tickets(
    status_filter: Optional[TicketStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Ticket)
    if current_user.role == UserRole.USER:
        query = query.filter(Ticket.requester_id == current_user.id)
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/{ticket_id}")
def get_ticket_details(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if current_user.role == UserRole.USER and ticket.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    transcript = []
    if ticket.conversation_id:
        messages = db.query(Message).filter(Message.conversation_id == ticket.conversation_id).order_by(Message.created_at.asc()).all()
        transcript = [
            {
                "sender": m.sender_type.value if hasattr(m.sender_type, 'value') else str(m.sender_type),
                "text": m.redacted_content or m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]

    suggested_reply = (
        f"Hello. This is IT Support regarding your ticket '{ticket.title}'. "
        "We have reviewed your request and the standard operating procedures. "
        "Please confirm if you are still experiencing this issue or if additional access is needed."
    )

    return {
        "id": str(ticket.id),
        "title": ticket.title,
        "description": ticket.description,
        "status": ticket.status.value if hasattr(ticket.status, 'value') else str(ticket.status),
        "priority": ticket.priority.value if hasattr(ticket.priority, 'value') else str(ticket.priority),
        "escalation_reason": ticket.escalation_reason,
        "requester_id": str(ticket.requester_id),
        "assigned_handler_id": str(ticket.assigned_handler_id) if ticket.assigned_handler_id else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "transcript": transcript,
        "suggested_reply": suggested_reply
    }


@router.patch("/{ticket_id}")
def update_ticket(
    ticket_id: UUID,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.HANDLER, UserRole.ADMIN)),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if payload.status is not None:
        ticket.status = payload.status
    if payload.priority is not None:
        ticket.priority = payload.priority
    if payload.assigned_handler_id is not None:
        ticket.assigned_handler_id = payload.assigned_handler_id

    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/reply")
def reply_and_resolve(
    ticket_id: UUID,
    payload: HandlerReplyRequest,
    db: Session = Depends(get_db),
    current_handler: User = Depends(require_role(UserRole.HANDLER, UserRole.ADMIN)),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    if payload.mark_resolved:
        ticket.status = TicketStatus.RESOLVED

    ticket.assigned_handler_id = current_handler.id
    db.commit()

    log_audit_event(
        db=db,
        event_type="handler_ticket_resolved",
        user_id=current_handler.id,
        details={
            "ticket_id": str(ticket.id),
            "reply_length": len(payload.reply_text),
            "status": "resolved" if payload.mark_resolved else "updated"
        }
    )

    return {
        "status": "success",
        "ticket_id": str(ticket.id),
        "ticket_status": ticket.status.value if hasattr(ticket.status, 'value') else str(ticket.status),
        "reply_dispatched": payload.reply_text
    }


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.HANDLER, UserRole.ADMIN)),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    log_audit_event(
        db=db,
        event_type="handler_ticket_deleted",
        user_id=current_user.id,
        details={"ticket_id": str(ticket.id), "title": ticket.title}
    )

    db.delete(ticket)
    db.commit()
    return None
