from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.kb import router as kb_router
from app.api.v1.chat import router as chat_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.mock_ad import router as mock_ad_router
from app.api.v1.metrics import router as metrics_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(kb_router, prefix="/kb", tags=["Knowledge Base"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(tickets_router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(mock_ad_router, prefix="/mock/ad", tags=["Mock AD"])
api_router.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])
