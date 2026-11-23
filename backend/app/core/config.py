from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-HAS"
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ai_has"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@postgres:5432/ai_has"

    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_COLLECTION: str = "it_knowledge_base"

    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    RETRIEVAL_SCORE_THRESHOLD: float = 0.65
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    JWT_SECRET: str = "super_secret_jwt_encryption_key_minimum_32_characters_long_12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    N8N_HOST: str = "n8n"
    N8N_PORT: int = 5678
    N8N_WEBHOOK_URL: str = "http://n8n:5678/webhook"
    N8N_API_KEY: Optional[str] = None

    PRESIDIO_ANALYZER_URL: str = "http://presidio-analyzer:5001"
    PRESIDIO_ANONYMIZER_URL: str = "http://presidio-anonymizer:5002"

    SEED_ADMIN_EMAIL: str = "admin@aihas.local"
    SEED_ADMIN_PASSWORD: str = "Admin123!"
    SEED_HANDLER_EMAIL: str = "handler@aihas.local"
    SEED_HANDLER_PASSWORD: str = "Handler123!"
    SEED_USER_EMAIL: str = "user@aihas.local"
    SEED_USER_PASSWORD: str = "User123!"

    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
