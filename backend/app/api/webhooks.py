from __future__ import annotations

from fastapi import APIRouter, Request

from app.services.call_service import CallService
from app.storage import store

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def _svc() -> CallService:
    return CallService(store)


@router.post("/bland/call")
async def bland_call_webhook(request: Request):
    payload = await request.json()
    call = await _svc().process_webhook(payload)
    return {
        "status": "received",
        "call_session_id": call.id if call else None,
    }
