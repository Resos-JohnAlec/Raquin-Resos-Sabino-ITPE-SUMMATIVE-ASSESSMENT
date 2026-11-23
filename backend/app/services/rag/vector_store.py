from typing import List, Dict, Any, Optional
import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings

qdrant_client_instance: Optional[QdrantClient] = None
local_in_memory_docs: List[Dict[str, Any]] = []


def get_qdrant_client() -> Optional[QdrantClient]:
    global qdrant_client_instance
    if qdrant_client_instance is None:
        try:
            qdrant_client_instance = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
            _ensure_collection(qdrant_client_instance)
        except Exception:
            qdrant_client_instance = None
    return qdrant_client_instance


def _ensure_collection(client: QdrantClient):
    try:
        collections = client.get_collections().collections
        exists = any(c.name == settings.QDRANT_COLLECTION for c in collections)
        if not exists:
            client.create_collection(
                collection_name=settings.QDRANT_COLLECTION,
                vectors_config=qmodels.VectorParams(
                    size=1536,
                    distance=qmodels.Distance.COSINE
                )
            )
    except Exception:
        pass


def upsert_chunks(
    doc_id: str,
    title: str,
    chunks: List[str],
    embeddings: List[List[float]],
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    client = get_qdrant_client()
    meta = metadata or {}
    points = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc_id}_{i}"))
        payload = {
            "doc_id": doc_id,
            "title": title,
            "chunk_index": i,
            "content": chunk,
            **meta
        }
        points.append(
            qmodels.PointStruct(
                id=point_id,
                vector=emb,
                payload=payload
            )
        )
        local_in_memory_docs.append({
            "point_id": point_id,
            "doc_id": doc_id,
            "title": title,
            "content": chunk,
            "vector": emb,
            "metadata": payload
        })

    if client:
        try:
            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=points
            )
            return True
        except Exception:
            return True
    return True


def delete_doc_vectors(doc_id: str) -> bool:
    global local_in_memory_docs
    local_in_memory_docs = [d for d in local_in_memory_docs if d.get("doc_id") != doc_id]
    client = get_qdrant_client()
    if client:
        try:
            client.delete(
                collection_name=settings.QDRANT_COLLECTION,
                points_selector=qmodels.Filter(
                    must=[
                        qmodels.FieldCondition(
                            key="doc_id",
                            match=qmodels.MatchValue(value=doc_id)
                        )
                    ]
                )
            )
            return True
        except Exception:
            return False
    return True


def search_vectors(
    query_vector: List[float],
    limit: int = 4,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    client = get_qdrant_client()
    threshold = score_threshold if score_threshold is not None else settings.RETRIEVAL_SCORE_THRESHOLD

    if client:
        try:
            results = client.search(
                collection_name=settings.QDRANT_COLLECTION,
                query_vector=query_vector,
                limit=limit,
                score_threshold=threshold
            )
            return [
                {
                    "score": hit.score,
                    "content": hit.payload.get("content", ""),
                    "title": hit.payload.get("title", ""),
                    "doc_id": hit.payload.get("doc_id", ""),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                }
                for hit in results
            ]
        except Exception:
            pass

    scored = []
    for item in local_in_memory_docs:
        vec = item["vector"]
        score = sum(a * b for a, b in zip(query_vector, vec))
        if score >= threshold:
            scored.append({
                "score": round(score, 4),
                "content": item["content"],
                "title": item["title"],
                "doc_id": item["doc_id"],
                "chunk_index": item["metadata"].get("chunk_index", 0),
            })
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]
