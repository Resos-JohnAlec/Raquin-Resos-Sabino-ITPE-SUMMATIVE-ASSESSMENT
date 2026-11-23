import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    USER = "user"
    HANDLER = "handler"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    tickets_requested = relationship("Ticket", foreign_keys="[Ticket.requester_id]", back_populates="requester")
    tickets_assigned = relationship("Ticket", foreign_keys="[Ticket.assigned_handler_id]", back_populates="assigned_handler")
    tool_invocations = relationship("ToolInvocation", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
