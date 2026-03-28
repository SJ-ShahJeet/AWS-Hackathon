"""
Penny — Chore API Routes (real DB writes via Ghost/Timescale)
"""
import uuid
from fastapi import APIRouter, Depends
from models import ApiResponse, ChoreApproveRequest, ChoreRejectRequest, ChoreProofRequest
from lib.auth import require_role
from lib.db import (
    insert_chore, get_chores, update_chore_status,
    update_chore_proof, add_to_balance, get_balance,
    approve_chore_atomic, get_children_for_parent
)
from lib.auth import get_current_user
from lib.logger import logger

router = APIRouter(prefix="/api/chores", tags=["chores"])


@router.get("/list/{child_id}", response_model=ApiResponse)
async def list_chores(child_id: str):
    logger.info("[API][chores/list] START", extra={"childId": child_id})
    try:
        chores = await get_chores(child_id)
        # Convert Decimal/datetime to serialisable types
        serialised = [_serialise(c) for c in chores]
        logger.info("[API][chores/list] SUCCESS", extra={"count": len(serialised)})
        return ApiResponse(success=True, data=serialised)
    except Exception as e:
        logger.error("[API][chores/list] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/create", response_model=ApiResponse)
async def create_chore(body: dict):
    logger.info("[API][chores/create] START", extra={"title": body.get("title")})
    try:
        chore = await insert_chore({
            "id": body.get("id") or str(uuid.uuid4()),
            "child_id": body.get("childId", "sophie-001"),
            "title": body["title"],
            "reward": body.get("reward", 2),
            "status": "pending",
            "description": body.get("description"),
            "planned_date": body.get("plannedDate"),
        })
        logger.info("[API][chores/create] SUCCESS", extra={"choreId": chore["id"]})
        return ApiResponse(success=True, data=_serialise(chore))
    except Exception as e:
        logger.error("[API][chores/create] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/approve", response_model=ApiResponse)
async def approve_chore(body: ChoreApproveRequest, _=Depends(require_role("parent"))):
    logger.info("[API][chores/approve] START", extra={"choreId": body.choreId, "reward": body.reward})
    try:
        # Atomic: update status + add balance in one transaction
        result = await approve_chore_atomic(body.choreId, body.reward)
        logger.info("[API][chores/approve] SUCCESS", extra={
            "choreId": body.choreId,
            "childId": result["child_id"],
            "newBalance": result["new_balance"],
        })
        return ApiResponse(success=True, data={
            "choreId": body.choreId,
            "newBalance": result["new_balance"],
        })
    except ValueError as e:
        logger.warning("[API][chores/approve] REJECTED", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))
    except Exception as e:
        logger.error("[API][chores/approve] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/reject", response_model=ApiResponse)
async def reject_chore(body: ChoreRejectRequest, _=Depends(require_role("parent"))):
    logger.info("[API][chores/reject] START", extra={"choreId": body.choreId})
    try:
        chore = await update_chore_status(body.choreId, "rejected")
        logger.info("[API][chores/reject] SUCCESS", extra={"choreId": body.choreId})
        return ApiResponse(success=True, data={"choreId": body.choreId})
    except Exception as e:
        logger.error("[API][chores/reject] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/submit-proof", response_model=ApiResponse)
async def submit_proof(body: ChoreProofRequest):
    logger.info("[API][chores/submit-proof] START", extra={"choreId": body.choreId})
    try:
        # In production: upload image to S3/Cloudinary, store URL
        mock_url = f"https://example.com/proofs/{body.choreId}.jpg"
        chore = await update_chore_proof(body.choreId, mock_url)
        logger.info("[API][chores/submit-proof] SUCCESS", extra={"proofUrl": mock_url})
        return ApiResponse(success=True, data={"choreId": body.choreId, "proofUrl": mock_url})
    except Exception as e:
        logger.error("[API][chores/submit-proof] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.get("/balance/{child_id}", response_model=ApiResponse)
async def get_child_balance(child_id: str):
    logger.info("[API][chores/balance] START", extra={"childId": child_id})
    try:
        balance = await get_balance(child_id)
        return ApiResponse(success=True, data={"balance": balance})
    except Exception as e:
        logger.error("[API][chores/balance] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


def _serialise(row: dict) -> dict:
    """Convert asyncpg types to JSON-safe types."""
    out = {}
    for k, v in row.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        else:
            out[k] = float(v) if hasattr(v, "__float__") and not isinstance(v, (int, float, bool)) else v
    return out
