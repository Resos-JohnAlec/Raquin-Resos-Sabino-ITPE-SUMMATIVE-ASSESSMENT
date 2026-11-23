from typing import List, Dict, Any
from app.services.rag.embeddings import get_embedding
from app.services.rag.vector_store import search_vectors
from app.core.config import settings


def retrieve_context(query: str, limit: int = 3) -> Dict[str, Any]:
    query_vector = get_embedding(query)
    results = search_vectors(
        query_vector=query_vector,
        limit=limit,
        score_threshold=settings.RETRIEVAL_SCORE_THRESHOLD
    )

    if not results:
        return {
            "is_confident": False,
            "citations": [],
            "context_text": "",
            "confidence_score": 0.0,
            "escalation_recommended": True,
            "message": "The retrieved knowledge base articles do not provide enough confidence to answer your request. Would you like me to escalate this issue to an IT support handler?"
        }

    max_score = max(r["score"] for r in results)
    citations = [
        {
            "title": r["title"],
            "doc_id": r["doc_id"],
            "score": round(r["score"], 4),
            "chunk_index": r["chunk_index"],
            "excerpt": r["content"][:200]
        }
        for r in results
    ]

    formatted_context = "\n\n---\n\n".join(
        f"[Source: {r['title']} (Confidence: {round(r['score'], 2)})]\n{r['content']}"
        for r in results
    )

    return {
        "is_confident": True,
        "citations": citations,
        "context_text": formatted_context,
        "confidence_score": round(max_score, 4),
        "escalation_recommended": False,
        "message": ""
    }
