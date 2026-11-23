import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


def test_password_hashing():
    raw = "SecureEnterprisePass123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_jwt_generation_and_decoding():
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    role = "admin"
    token = create_access_token(subject=user_id, role=role)
    assert token is not None

    decoded = decode_access_token(token)
    assert decoded["sub"] == user_id
    assert decoded["role"] == role
    assert "exp" in decoded


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code in [200, 503]
