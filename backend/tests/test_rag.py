from app.services.rag.ingestion import split_text_into_chunks
from app.services.rag.embeddings import get_embedding
from app.services.rag.retrieval import retrieve_context


def test_split_text_into_chunks():
    sample_text = "\n".join([f"Line {i}: Enterprise IT standard troubleshooting instructions." for i in range(50)])
    chunks = split_text_into_chunks(sample_text, chunk_size=200, chunk_overlap=30)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) > 0


def test_embedding_generation():
    text = "Enterprise VPN troubleshooting procedure"
    vec = get_embedding(text)
    assert len(vec) == 1536
    assert isinstance(vec[0], float)


def test_retrieval_below_threshold():
    nonsense_query = "xyzqwerty987654321 nonexistent technical error code"
    result = retrieve_context(nonsense_query)
    assert "is_confident" in result
    assert "citations" in result
    assert "message" in result
