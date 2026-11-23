import uuid
from app.services.tools.ad_mock import reset_ad_password, generate_temp_password


def test_generate_temp_password():
    pwd = generate_temp_password(16)
    assert len(pwd) == 16
    assert any(c.isupper() for c in pwd)
    assert any(c.islower() for c in pwd)
    assert any(c.isdigit() for c in pwd)
    assert any(c in "!@#$%^&*" for c in pwd)


def test_ad_password_reset_uses_session_credentials():
    test_user_id = str(uuid.uuid4())
    test_email = "employee@aihas.local"

    result = reset_ad_password(user_id=test_user_id, email=test_email)
    assert result["status"] == "success"
    assert result["user_id"] == test_user_id
    assert result["email"] == test_email
    assert len(result["temporary_password"]) >= 14
    assert result["expires_in_minutes"] == 15
