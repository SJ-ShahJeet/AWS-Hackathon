from fastapi import APIRouter, Depends, HTTPException

from app.core.config import get_settings
from app.schemas.api_models import (
    AuthStatusResponse,
    DemoLoginRequest,
    DemoLoginResponse,
    MeResponse,
)
from app.schemas.models import User
from app.services.auth_service import AuthService
from app.storage import store

from .deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/demo-login", response_model=DemoLoginResponse)
async def demo_login(req: DemoLoginRequest):
    settings = get_settings()
    if not settings.demo_login_enabled:
        raise HTTPException(status_code=403, detail="Demo login is disabled")

    auth = AuthService(store)
    user, token = await auth.demo_login(req.email, req.role)
    return DemoLoginResponse(token=token, user=user)


@router.get("/me", response_model=MeResponse)
async def get_me(user: User = Depends(get_current_user)):
    return MeResponse(user=user)


@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status():
    settings = get_settings()
    return AuthStatusResponse(
        mode="auth0" if settings.auth0_enabled else "demo",
        auth0_enabled=settings.auth0_enabled,
        demo_login_enabled=settings.demo_login_enabled,
    )
