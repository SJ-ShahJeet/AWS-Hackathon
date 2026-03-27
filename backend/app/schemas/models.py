from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid

from pydantic import BaseModel, Field


def new_id() -> str:
    return str(uuid.uuid4())


def now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    CHILD = "child"
    PARENT = "parent"
    ADMIN = "admin"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"


class RecommendationStatus(str, Enum):
    READY = "ready"
    APPROVAL_PENDING = "approval_pending"
    APPROVED = "approved"
    DECLINED = "declined"


class CallType(str, Enum):
    SUPPORT = "support"
    APPROVAL = "approval"


class CallDirection(str, Enum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class CallStatus(str, Enum):
    QUEUED = "queued"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    APPROVED = "approved"
    DECLINED = "declined"
    NO_ANSWER = "no_answer"


class User(BaseModel):
    id: str = Field(default_factory=new_id)
    email: str
    name: str
    role: UserRole = UserRole.CHILD
    household_id: Optional[str] = None
    ghost_user_id: Optional[str] = None
    auth_subject: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_name: Optional[str] = "Penny"
    created_at: datetime = Field(default_factory=now)


class Session(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=now)
    expires_at: Optional[datetime] = None


class Household(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    created_at: datetime = Field(default_factory=now)


class CustomerProfile(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    household_id: str
    phone_number: str
    balance_cents: int = 0
    threshold_cents: int = 5000
    coin_balance: int = 0
    favorite_topics: list[str] = Field(default_factory=list)
    notes: str = ""
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class ChoreLedgerEntry(BaseModel):
    id: str = Field(default_factory=new_id)
    household_id: str
    child_user_id: str
    description: str
    coins_earned: int
    amount_cents: int
    completed_at: datetime = Field(default_factory=now)


class RecommendationOption(BaseModel):
    id: str = Field(default_factory=new_id)
    recommendation_set_id: str
    name: str
    symbol: str
    allocation_percent: int
    risk_level: str
    rationale: str
    interest_match: str
    sort_order: int = 0


class RecommendationSet(BaseModel):
    id: str = Field(default_factory=new_id)
    child_user_id: str
    household_id: str
    total_value_cents: int
    threshold_reached: bool = False
    status: RecommendationStatus = RecommendationStatus.READY
    summary: str = ""
    approval_request_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)


class ApprovalRequest(BaseModel):
    id: str = Field(default_factory=new_id)
    recommendation_set_id: str
    child_user_id: str
    parent_user_id: str
    household_id: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    decision_source: str = "system"
    resolution_note: str = ""
    requested_at: datetime = Field(default_factory=now)
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now)


class CallSession(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    household_id: str
    call_type: CallType
    direction: CallDirection = CallDirection.OUTBOUND
    phone_number: str
    status: CallStatus = CallStatus.QUEUED
    recommendation_set_id: Optional[str] = None
    approval_request_id: Optional[str] = None
    vendor_call_id: Optional[str] = None
    transcript: str = ""
    summary: str = ""
    last_question: str = ""
    answer_source: str = ""
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=now)


class CallEvent(BaseModel):
    id: str = Field(default_factory=new_id)
    call_session_id: str
    event_type: str
    payload: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now)


class KnowledgeArticle(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    body: str
    tags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now)


class TraceSpan(BaseModel):
    id: str = Field(default_factory=new_id)
    call_session_id: Optional[str] = None
    operation: str
    service: str = "penny-care"
    status: str = "ok"
    start_time: datetime = Field(default_factory=now)
    end_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    metadata: dict = Field(default_factory=dict)
    parent_span_id: Optional[str] = None
