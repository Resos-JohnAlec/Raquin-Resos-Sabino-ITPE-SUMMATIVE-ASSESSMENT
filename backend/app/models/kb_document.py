import uuid
import enum
from sqlalchemy import Column, String, Text, JSON, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class KBDocumentStatus(str, enum.Enum):
    PENDING = "pending"
    INDEXED = "indexed"
    FAILED = "failed"


class KBDocument(Base):
    __tablename__ = "kb_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    file_path = Column(String(1024), nullable=True)
    status = Column(Enum(KBDocumentStatus, native_enum=False), default=KBDocumentStatus.PENDING, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
