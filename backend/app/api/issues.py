import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from app.schemas.api_models import (
    IssueIntakeRequest, IssueIntakeResponse, IssueListResponse,
    IssueDetailResponse, TimelineResponse, ArtifactResponse,
    RunAgentRequest, RunAgentResponse, EscalateRequest, RetryStepRequest,
)
from app.schemas.models import User, IssueStatus, IssueSeverity
from app.services.issue_service import IssueService
from app.storage import store
from .deps import get_current_user

router = APIRouter(prefix="/api/issues", tags=["issues"])


def _svc() -> IssueService:
    return IssueService(store)


@router.post("/intake", response_model=IssueIntakeResponse)
async def intake_issue(
    req: IssueIntakeRequest,
    user: User = Depends(get_current_user),
):
    svc = _svc()
    issue = await svc.create_from_intake(
        reporter_id=user.id,
        complaint=req.complaint,
        product_area=req.product_area,
        severity=req.severity,
        source=req.source,
    )
    return IssueIntakeResponse(
        issue=issue,
        message="Your issue has been received. We're beginning analysis now.",
    )


@router.get("", response_model=IssueListResponse)
async def list_issues(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    product_area: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
):
    filters = {}
    if status:
        filters["status"] = status
    if severity:
        filters["severity"] = severity
    if product_area:
        filters["product_area"] = product_area
    if user.role.value == "customer":
        filters["reporter_id"] = user.id

    issues = await store.list_issues(filters if filters else None)
    return IssueListResponse(issues=issues, total=len(issues))


@router.get("/{issue_id}", response_model=IssueDetailResponse)
async def get_issue(issue_id: str, user: User = Depends(get_current_user)):
    issue = await store.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    messages = await store.get_messages(issue_id)
    return IssueDetailResponse(
        issue=issue,
        messages=[m.model_dump() for m in messages],
    )


@router.get("/{issue_id}/timeline", response_model=TimelineResponse)
async def get_timeline(issue_id: str, user: User = Depends(get_current_user)):
    issue = await store.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    plan = await store.get_plan(issue_id)
    steps = await store.get_steps(issue_id)
    return TimelineResponse(
        issue_id=issue_id,
        plan=plan,
        steps=steps,
        current_phase=issue.current_phase,
        confidence_score=issue.confidence_score,
    )


@router.post("/{issue_id}/run-agent", response_model=RunAgentResponse)
async def run_agent(
    issue_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    issue = await store.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    async def _run():
        svc = _svc()
        await svc.run_agent(issue_id)

    background_tasks.add_task(_run)
    return RunAgentResponse(status="started", message="Agent workflow started in background")


@router.post("/{issue_id}/retry-step")
async def retry_step(
    issue_id: str,
    req: RetryStepRequest,
    user: User = Depends(get_current_user),
):
    svc = _svc()
    result = await svc.retry_step(issue_id, req.step_id)
    return result


@router.post("/{issue_id}/escalate")
async def escalate(
    issue_id: str,
    req: EscalateRequest,
    user: User = Depends(get_current_user),
):
    svc = _svc()
    issue = await svc.escalate(issue_id, req.reason)
    return {"status": "escalated", "issue_id": issue.id}


@router.get("/{issue_id}/artifact", response_model=ArtifactResponse)
async def get_artifact(issue_id: str, user: User = Depends(get_current_user)):
    artifact = await store.get_artifact(issue_id)
    return ArtifactResponse(artifact=artifact)


@router.post("/{issue_id}/artifact/regenerate")
async def regenerate_artifact(
    issue_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    issue = await store.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    async def _regen():
        svc = _svc()
        await svc.run_agent(issue_id)

    background_tasks.add_task(_regen)
    return {"status": "regenerating", "message": "Artifact regeneration started"}


@router.get("/{issue_id}/stream")
async def stream_issue(issue_id: str, request: Request):
    """SSE endpoint for live issue updates."""
    issue = await store.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    async def event_generator():
        last_phase = ""
        last_step_count = 0
        for _ in range(120):
            if await request.is_disconnected():
                break
            current_issue = await store.get_issue(issue_id)
            if not current_issue:
                break
            steps = await store.get_steps(issue_id)

            if current_issue.current_phase != last_phase or len(steps) != last_step_count:
                last_phase = current_issue.current_phase
                last_step_count = len(steps)
                data = {
                    "phase": current_issue.current_phase,
                    "status": current_issue.status.value,
                    "confidence": current_issue.confidence_score,
                    "steps_completed": sum(1 for s in steps if s.status.value == "completed"),
                    "total_steps": len(steps),
                }
                yield f"data: {json.dumps(data)}\n\n"

            if current_issue.status.value in ("resolved", "escalated", "failed"):
                yield f"data: {json.dumps({'done': True, 'status': current_issue.status.value})}\n\n"
                break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
