from typing import List, Dict, Any, Optional
import os
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.kb_document import KBDocument, KBDocumentStatus
from app.services.rag.embeddings import get_embeddings_batch
from app.services.rag.vector_store import upsert_chunks
from app.core.config import settings


def split_text_into_chunks(text: str, chunk_size: int = 512, chunk_overlap: int = 50) -> List[str]:
    lines = text.split("\n")
    chunks = []
    current_chunk: List[str] = []
    current_len = 0

    for line in lines:
        line_len = len(line) + 1
        if current_len + line_len > chunk_size and current_chunk:
            chunks.append("\n".join(current_chunk).strip())
            overlap_lines: List[str] = []
            overlap_len = 0
            for prev_line in reversed(current_chunk):
                if overlap_len + len(prev_line) + 1 <= chunk_overlap:
                    overlap_lines.insert(0, prev_line)
                    overlap_len += len(prev_line) + 1
                else:
                    break
            current_chunk = overlap_lines
            current_len = overlap_len

        current_chunk.append(line)
        current_len += line_len

    if current_chunk:
        chunk_str = "\n".join(current_chunk).strip()
        if chunk_str:
            chunks.append(chunk_str)

    return chunks if chunks else [text]


def ingest_document(
    db: Session,
    doc_id: UUID,
    title: str,
    text_content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> KBDocument:
    doc = db.query(KBDocument).filter(KBDocument.id == doc_id).first()
    if not doc:
        raise ValueError("Document not found in database")

    try:
        chunks = split_text_into_chunks(
            text_content,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        embeddings = get_embeddings_batch(chunks)
        upsert_chunks(
            doc_id=str(doc.id),
            title=title,
            chunks=chunks,
            embeddings=embeddings,
            metadata=metadata
        )
        doc.status = KBDocumentStatus.INDEXED
        doc.error_message = None
        doc.metadata_json = {
            **(doc.metadata_json or {}),
            "chunks_count": len(chunks),
            "content_length": len(text_content),
        }
    except Exception as exc:
        doc.status = KBDocumentStatus.FAILED
        doc.error_message = str(exc)

    db.commit()
    db.refresh(doc)
    return doc
