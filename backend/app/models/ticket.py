import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_handler_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(TicketStatus, native_enum=False), default=TicketStatus.OPEN, nullable=False, index=True)
    priority = Column(Enum(TicketPriority, native_enum=False), default=TicketPriority.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    escalation_reason = Column(Text, nullable=True)
    external_ref = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    conversation = relationship("Conversation", back_populates="tickets")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="tickets_requested")
    assigned_handler = relationship("User", foreign_keys=[assigned_handler_id], back_populates="tickets_assigned")
