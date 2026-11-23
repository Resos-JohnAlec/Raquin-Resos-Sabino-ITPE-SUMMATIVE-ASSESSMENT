import hashlib
from typing import List
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None


def get_embedding(text: str) -> List[float]:
    if client and settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your-"):
        try:
            response = client.embeddings.create(
                input=text,
                model=settings.EMBEDDING_MODEL
            )
            return response.data[0].embedding
        except Exception:
            pass

    dim = 1536
    hash_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for i in range(dim):
        byte_val = hash_bytes[i % len(hash_bytes)]
        val = ((byte_val + i) % 256) / 128.0 - 1.0
        values.append(val)
    norm = sum(x * x for x in values) ** 0.5
    if norm > 0:
        values = [x / norm for x in values]
    return values


def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    return [get_embedding(text) for text in texts]
