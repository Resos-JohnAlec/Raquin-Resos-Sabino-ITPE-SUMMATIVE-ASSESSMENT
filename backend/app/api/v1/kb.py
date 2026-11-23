from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.kb_document import KBDocument, KBDocumentStatus
from app.core.dependencies import require_role, get_current_user
from app.services.rag.ingestion import ingest_document
from app.services.rag.retrieval import retrieve_context
from app.services.rag.vector_store import delete_doc_vectors

router = APIRouter()


class DocumentCreate(BaseModel):
    title: str
    content: str
    file_path: Optional[str] = None


class DocumentResponse(BaseModel):
    id: UUID
    title: str
    file_path: Optional[str]
    status: KBDocumentStatus
    error_message: Optional[str]
    metadata_json: Optional[dict]

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    query: str
    limit: Optional[int] = 3


@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.HANDLER)),
):
    docs = db.query(KBDocument).offset(skip).limit(limit).all()
    return docs


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_and_ingest_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    doc = KBDocument(
        title=doc_in.title,
        file_path=doc_in.file_path,
        status=KBDocumentStatus.PENDING
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    doc = ingest_document(
        db=db,
        doc_id=doc.id,
        title=doc_in.title,
        text_content=doc_in.content
    )
    return doc


@router.post("/documents/{doc_id}/reindex", response_model=DocumentResponse)
def reindex_document(
    doc_id: UUID,
    content: DocumentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    doc = db.query(KBDocument).filter(KBDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    delete_doc_vectors(str(doc.id))
    doc = ingest_document(
        db=db,
        doc_id=doc.id,
        title=content.title,
        text_content=content.content
    )
    return doc


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    doc = db.query(KBDocument).filter(KBDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    delete_doc_vectors(str(doc.id))
    db.delete(doc)
    db.commit()
    return None


@router.post("/query")
def test_retrieval(
    payload: QueryRequest,
    _: User = Depends(get_current_user),
):
    return retrieve_context(query=payload.query, limit=payload.limit or 3)
