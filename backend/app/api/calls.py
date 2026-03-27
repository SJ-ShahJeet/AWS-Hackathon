from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.config import get_settings
from app.schemas.api_models import (
    AnswerQuestionRequest,
    AnswerQuestionResponse,
    ApprovalDecisionRequest,
    ApprovalDecisionResponse,
    ApprovalToolRequest,
    ApprovalToolResponse,
    CallApprovalRequest,
    CallDetailResponse,
    CallsListResponse,
    CallSessionResponse,
    CallSupportRequest,
    CustomerContextRequest,
)
from app.schemas.models import User, UserRole
from app.services.call_service import CallService
from app.storage import store

from .deps import get_current_user, require_role

router = APIRouter(tags=["calls"])


def _svc() -> CallService:
    return CallService(store)


def _verify_tool_secret(header_value: Optional[str]) -> None:
    settings = get_settings()
    if not header_value or header_value != settings.app_secret_key:
        raise HTTPException(status_code=401, detail="Invalid tool secret")


@router.post("/api/calls/support", response_model=CallSessionResponse)
async def start_support_call(
    req: CallSupportRequest,
    user: User = Depends(require_role(UserRole.CHILD, UserRole.PARENT, UserRole.ADMIN)),
):
    call = await _svc().start_support_call(user, req.phone_number)
    return CallSessionResponse(call=call)


@router.post("/api/calls/approval", response_model=CallSessionResponse)
async def start_approval_call(
    req: CallApprovalRequest,
    user: User = Depends(require_role(UserRole.CHILD, UserRole.PARENT, UserRole.ADMIN)),
):
    call = await _svc().start_approval_call(user, req.approval_request_id, req.phone_number)
    return CallSessionResponse(call=call)


@router.get("/api/calls", response_model=CallsListResponse)
async def list_calls(user: User = Depends(get_current_user)):
    calls = await _svc().list_calls_for_user(user)
    return CallsListResponse(calls=calls, total=len(calls))


@router.get("/api/calls/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(call_id: str, user: User = Depends(get_current_user)):
    call, events, traces = await _svc().get_call_detail(user, call_id)
    return CallDetailResponse(call=call, events=events, traces=traces)


@router.patch("/api/approvals/{approval_id}", response_model=ApprovalDecisionResponse)
async def update_approval(
    approval_id: str,
    req: ApprovalDecisionRequest,
    user: User = Depends(require_role(UserRole.PARENT, UserRole.ADMIN)),
):
    approval = await _svc().apply_manual_decision(approval_id, req.status, req.note, req.source or user.role.value)
    return ApprovalDecisionResponse(approval=approval)


@router.post("/api/bland/tools/customer-context")
async def customer_context_tool(
    req: CustomerContextRequest,
    x_app_secret: Optional[str] = Header(None),
):
    _verify_tool_secret(x_app_secret)
    return await _svc().get_customer_context(req.call_session_id)


@router.post("/api/bland/tools/answer-question", response_model=AnswerQuestionResponse)
async def answer_question_tool(
    req: AnswerQuestionRequest,
    x_app_secret: Optional[str] = Header(None),
):
    _verify_tool_secret(x_app_secret)
    question = req.question or req.speech
    result = await _svc().answer_question(req.call_session_id, question)
    return AnswerQuestionResponse(**result)


@router.post("/api/bland/tools/approval-decision", response_model=ApprovalToolResponse)
async def approval_decision_tool(
    req: ApprovalToolRequest,
    x_app_secret: Optional[str] = Header(None),
):
    _verify_tool_secret(x_app_secret)
    approval = await _svc().apply_tool_decision(req.call_session_id, req.decision, req.note or req.speech)
    return ApprovalToolResponse(status=approval.status.value, approval=approval)
