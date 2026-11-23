from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.models.user import User
from app.core.dependencies import get_current_user
from app.services.tools.ad_mock import reset_ad_password

router = APIRouter()


class ADResetRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


@router.post("/reset-password")
def mock_ad_reset_password(
    payload: ADResetRequest,
    current_user: User = Depends(get_current_user)
):
    target_user_id = str(current_user.id)
    target_email = current_user.email
    return reset_ad_password(user_id=target_user_id, email=target_email)
