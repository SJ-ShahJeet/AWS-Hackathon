from fastapi import APIRouter, Depends

from app.schemas.api_models import DashboardResponse, RecommendationResponse
from app.schemas.models import User
from app.services.penny_service import PennyService
from app.storage import store

from .deps import get_current_user

router = APIRouter(prefix="/api", tags=["dashboard"])


def _svc() -> PennyService:
    return PennyService(store)


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(user: User = Depends(get_current_user)):
    return await _svc().get_dashboard(user)


@router.get("/recommendations/current", response_model=RecommendationResponse)
async def get_recommendations(user: User = Depends(get_current_user)):
    return await _svc().get_recommendations_for_user(user)
