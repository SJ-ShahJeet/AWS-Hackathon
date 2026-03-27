"""
Penny — Pydantic Request/Response Models
"""
from typing import Any, Literal, Optional
from pydantic import BaseModel


# ── Shared ──────────────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


# ── Chores ──────────────────────────────────────────────────────────────────

class ChoreApproveRequest(BaseModel):
    choreId: str
    reward: float


class ChoreRejectRequest(BaseModel):
    choreId: str


class ChoreProofRequest(BaseModel):
    choreId: str
    proofBase64: str  # base64-encoded image


# ── Investments ──────────────────────────────────────────────────────────────

class InvestmentApproveRequest(BaseModel):
    investmentId: str


class InvestmentRejectRequest(BaseModel):
    investmentId: str
    reason: str


# ── Negotiation ──────────────────────────────────────────────────────────────

class NegotiationResult(BaseModel):
    confidenceScore: int
    childArgument: str
    diversificationWarning: str
    recommendation: Literal["approve", "reject", "negotiate"]
