import secrets
import string
from typing import Dict, Any


def generate_temp_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        has_upper = any(c.isupper() for c in pwd)
        has_lower = any(c.islower() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        has_special = any(c in "!@#$%^&*" for c in pwd)
        if has_upper and has_lower and has_digit and has_special:
            return pwd


def reset_ad_password(user_id: str, email: str) -> Dict[str, Any]:
    temp_password = generate_temp_password()
    return {
        "status": "success",
        "service": "Mock Active Directory Domain Services",
        "user_id": user_id,
        "email": email,
        "temporary_password": temp_password,
        "expires_in_minutes": 15,
        "force_change_on_next_logon": True,
        "message": "Domain password has been reset successfully. Please use the temporary password to log in and change your credentials."
    }
