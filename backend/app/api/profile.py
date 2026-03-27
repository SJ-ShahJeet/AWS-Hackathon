from fastapi import APIRouter, Depends

from app.schemas.api_models import ProfileBundleResponse, ProfilePhoneUpdateRequest
from app.schemas.models import User
from app.services.penny_service import PennyService
from app.storage import store

from .deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _svc() -> PennyService:
    return PennyService(store)


@router.get("/me", response_model=ProfileBundleResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return await _svc().get_profile_bundle(user)


@router.patch("/phone", response_model=ProfileBundleResponse)
async def update_phone(
    req: ProfilePhoneUpdateRequest,
    user: User = Depends(get_current_user),
):
    return await _svc().update_phone(user, req.phone_number)
