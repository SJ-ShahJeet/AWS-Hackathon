from fastapi import APIRouter, Depends

from care.config import get_settings
from care.schemas.api_models import HealthResponse, TracesResponse
from care.schemas.models import User, UserRole
from care.storage import store

from .deps import get_current_user, require_role

router = APIRouter(prefix="/api", tags=["observability"])


@router.get("/traces", response_model=TracesResponse)
async def list_traces(user: User = Depends(require_role(UserRole.ADMIN))):
    traces = await store.get_traces()
    return TracesResponse(traces=traces, total=len(traces))


@router.get("/traces/{call_id}", response_model=TracesResponse)
async def get_call_traces(call_id: str, user: User = Depends(require_role(UserRole.ADMIN))):
    traces = await store.get_traces(call_id)
    return TracesResponse(traces=traces, total=len(traces))


@router.get("/health", response_model=HealthResponse)
async def health_check():
    settings = get_settings()
    storage_mode = "ghost-postgres" if settings.ghost_enabled else "memory-demo"
    return HealthResponse(
        status="ok",
        version="0.2.0",
        services={
            "storage": storage_mode,
            "auth": "auth0+jwks" if settings.auth0_enabled else "demo",
            "auth0_management": "configured" if settings.management_api_enabled else "not_configured",
            "voice": "bland" if bool(settings.bland_api_key) else "demo",
            "llm": settings.nim_model if bool(settings.nim_api_key) else "heuristic-fallback",
        },
    )
