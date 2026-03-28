from fastapi import APIRouter, Depends

from care.schemas.api_models import DashboardResponse, RecommendationResponse
from care.schemas.models import User
from care.services.penny_service import PennyService
from care.storage import store

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
