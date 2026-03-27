from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .models import (
    ApprovalRequest,
    ApprovalStatus,
    CallDirection,
    CallEvent,
    CallSession,
    CallStatus,
    CallType,
    ChoreLedgerEntry,
    CustomerProfile,
    RecommendationOption,
    RecommendationSet,
    TraceSpan,
    User,
    UserRole,
)


class DemoLoginRequest(BaseModel):
    email: str
    role: UserRole = UserRole.CHILD


class DemoLoginResponse(BaseModel):
    token: str
    user: User


class MeResponse(BaseModel):
    user: User


class ProfilePhoneUpdateRequest(BaseModel):
    phone_number: str


class ProfileBundleResponse(BaseModel):
    user: User
    profile: Optional[CustomerProfile] = None


class RecommendationBundle(BaseModel):
    recommendation: RecommendationSet
    options: list[RecommendationOption] = Field(default_factory=list)
    approval: Optional[ApprovalRequest] = None


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationBundle] = Field(default_factory=list)


class CallSupportRequest(BaseModel):
    phone_number: Optional[str] = None


class CallApprovalRequest(BaseModel):
    approval_request_id: Optional[str] = None
    phone_number: Optional[str] = None


class CallSessionResponse(BaseModel):
    call: CallSession


class CallsListResponse(BaseModel):
    calls: list[CallSession] = Field(default_factory=list)
    total: int = 0


class CallDetailResponse(BaseModel):
    call: CallSession
    events: list[CallEvent] = Field(default_factory=list)
    traces: list[TraceSpan] = Field(default_factory=list)


class ApprovalDecisionRequest(BaseModel):
    status: ApprovalStatus
    note: str = ""
    source: str = "manual"


class ApprovalDecisionResponse(BaseModel):
    approval: ApprovalRequest


class DashboardChildPayload(BaseModel):
    user: User
    profile: Optional[CustomerProfile] = None
    chores: list[ChoreLedgerEntry] = Field(default_factory=list)
    recommendations: list[RecommendationBundle] = Field(default_factory=list)
    calls: list[CallSession] = Field(default_factory=list)


class ParentChildSnapshot(BaseModel):
    child: User
    profile: Optional[CustomerProfile] = None
    recommendation: Optional[RecommendationBundle] = None


class DashboardParentPayload(BaseModel):
    user: User
    household_children: list[ParentChildSnapshot] = Field(default_factory=list)
    approvals: list[ApprovalRequest] = Field(default_factory=list)
    calls: list[CallSession] = Field(default_factory=list)


class DashboardAdminPayload(BaseModel):
    total_calls: int = 0
    support_calls: int = 0
    approval_calls: int = 0
    pending_approvals: int = 0
    recent_calls: list[CallSession] = Field(default_factory=list)
    traces: list[TraceSpan] = Field(default_factory=list)
    approvals: list[ApprovalRequest] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    role: UserRole
    child: Optional[DashboardChildPayload] = None
    parent: Optional[DashboardParentPayload] = None
    admin: Optional[DashboardAdminPayload] = None


class CustomerContextRequest(BaseModel):
    call_session_id: str


class AnswerQuestionRequest(BaseModel):
    call_session_id: str
    question: str = ""
    speech: str = ""


class AnswerQuestionResponse(BaseModel):
    answer: str
    confidence: float
    sources: list[str] = Field(default_factory=list)


class ApprovalToolRequest(BaseModel):
    call_session_id: str
    decision: str
    speech: str = ""
    note: str = ""


class ApprovalToolResponse(BaseModel):
    status: str
    approval: Optional[ApprovalRequest] = None


class BlandCallWebhook(BaseModel):
    call_id: Optional[str] = None
    status: Optional[str] = None
    event: Optional[str] = None
    transcript: Optional[str] = None
    concatenated_transcript: Optional[str] = None
    summary: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    payload: dict = Field(default_factory=dict)


class TracesResponse(BaseModel):
    traces: list[TraceSpan]
    total: int


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.2.0"
    services: dict = Field(default_factory=dict)


class AuthStatusResponse(BaseModel):
    mode: str
    auth0_enabled: bool
    demo_login_enabled: bool
    checked_at: datetime = Field(default_factory=datetime.utcnow)
