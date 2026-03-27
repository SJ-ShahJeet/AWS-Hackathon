"""
Penny — Investment API Routes
"""
import uuid
from fastapi import APIRouter, Depends
from models import ApiResponse, InvestmentApproveRequest, InvestmentRejectRequest, NegotiationResult
from lib.logger import logger
from lib.auth import require_role
from lib.db import (
    insert_investment, update_investment_status,
    upsert_portfolio_holding, get_portfolio, add_to_balance, get_balance
)

router = APIRouter(prefix="/api/investments", tags=["investments"])

MOCK_NEGOTIATION = NegotiationResult(
    confidenceScore=72,
    childArgument="Nike is a brand I use every day. I think companies I understand are safer to invest in.",
    diversificationWarning="Portfolio is 100% in a single consumer discretionary stock. Consider adding a low-cost index fund.",
    recommendation="negotiate",
)


@router.post("/request", response_model=ApiResponse)
async def request_investment(body: dict):
    """Child submits a new investment request."""
    logger.info("[API][investments/request] START", extra={"ticker": body.get("ticker")})
    try:
        inv = await insert_investment({
            "id": body.get("id") or str(uuid.uuid4()),
            "child_id": body.get("childId", "sophie-001"),
            "ticker": body["ticker"],
            "company_name": body.get("companyName", body["ticker"]),
            "amount": body.get("amount", 0),
            "shares": body.get("shares", 0),
            "status": "pending",
            "risk": body.get("risk", "Moderate"),
            "projected_return": body.get("projectedReturn", "8%"),
        })
        logger.info("[API][investments/request] SUCCESS", extra={"investmentId": inv["id"]})
        return ApiResponse(success=True, data={"investmentId": inv["id"]})
    except Exception as e:
        logger.error("[API][investments/request] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/approve", response_model=ApiResponse)
async def approve_investment(body: InvestmentApproveRequest, _=Depends(require_role("parent"))):
    logger.info("[API][investments/approve] START", extra={"investmentId": body.investmentId})
    try:
        inv = await update_investment_status(body.investmentId, "approved")
        if inv:
            # Simulate fractional share purchase and update portfolio
            purchase_price = float(inv.get("amount", 0)) / max(float(inv.get("shares", 1)), 0.000001)
            await upsert_portfolio_holding(
                child_id=inv["child_id"],
                ticker=inv["ticker"],
                company_name=inv["company_name"],
                shares=float(inv.get("shares", 0)),
                purchase_price=purchase_price,
            )
            # Deduct amount from balance
            new_balance = await add_to_balance(inv["child_id"], -float(inv.get("amount", 0)))
            logger.info("[API][investments/approve] SUCCESS", extra={
                "investmentId": body.investmentId,
                "newBalance": new_balance,
            })
            return ApiResponse(success=True, data={
                "investmentId": body.investmentId,
                "newBalance": new_balance,
            })
        return ApiResponse(success=False, error="Investment not found")
    except Exception as e:
        logger.error("[API][investments/approve] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.post("/reject", response_model=ApiResponse)
async def reject_investment(body: InvestmentRejectRequest, _=Depends(require_role("parent"))):
    logger.info("[API][investments/reject] START", extra={"investmentId": body.investmentId, "hasReason": bool(body.reason)})
    try:
        await update_investment_status(
            body.investmentId, "rejected",
            parent_reason=body.reason,
            negotiation_data=MOCK_NEGOTIATION.model_dump(),
        )
        logger.info("[API][investments/reject] SUCCESS", extra={
            "investmentId": body.investmentId,
            "recommendation": MOCK_NEGOTIATION.recommendation,
        })
        return ApiResponse(
            success=True,
            data={"investmentId": body.investmentId, "negotiationData": MOCK_NEGOTIATION.model_dump()},
        )
    except Exception as e:
        logger.error("[API][investments/reject] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))


@router.get("/portfolio/{child_id}", response_model=ApiResponse)
async def get_child_portfolio(child_id: str):
    logger.info("[API][investments/portfolio] START", extra={"childId": child_id})
    try:
        holdings = await get_portfolio(child_id)
        serialised = []
        for h in holdings:
            serialised.append({
                "id": h["id"],
                "childId": h["child_id"],
                "ticker": h["ticker"],
                "companyName": h["company_name"],
                "shares": float(h["shares"]),
                "purchasePrice": float(h["purchase_price"]),
                "currentPrice": float(h["current_price"]),
                "updatedAt": h["updated_at"].isoformat() if hasattr(h["updated_at"], "isoformat") else h["updated_at"],
            })
        logger.info("[API][investments/portfolio] SUCCESS", extra={"count": len(serialised)})
        return ApiResponse(success=True, data=serialised)
    except Exception as e:
        logger.error("[API][investments/portfolio] ERROR", extra={"error": str(e)})
        return ApiResponse(success=False, error=str(e))
