from typing import Optional
from app.schemas.models import (
    Issue, IssueMessage, IssueStatus, IssueSeverity, new_id, now,
)
from app.storage.base import StorageAdapter
from app.agent.orchestrator import AgentOrchestrator


class IssueService:
    def __init__(self, store: StorageAdapter):
        self.store = store
        self.orchestrator = AgentOrchestrator(store)

    async def create_from_intake(
        self, reporter_id: str, complaint: str,
        product_area: Optional[str] = None,
        severity: Optional[IssueSeverity] = None,
        source: str = "chat",
    ) -> Issue:
        issue = Issue(
            reporter_id=reporter_id,
            raw_complaint=complaint,
            product_area=product_area or "",
            severity=severity or IssueSeverity.MEDIUM,
        )
        await self.store.save_issue(issue)

        await self.store.save_message(IssueMessage(
            issue_id=issue.id,
            sender="user",
            content=complaint,
        ))

        return issue

    async def run_agent(self, issue_id: str, sse_callback=None) -> Issue:
        issue = await self.store.get_issue(issue_id)
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")
        return await self.orchestrator.run(issue, sse_callback)

    async def escalate(self, issue_id: str, reason: str = "") -> Issue:
        issue = await self.store.get_issue(issue_id)
        if not issue:
            raise ValueError(f"Issue {issue_id} not found")
        issue.status = IssueStatus.ESCALATED
        issue.current_phase = "escalated"
        issue.updated_at = now()
        await self.store.update_issue(issue)

        await self.store.save_message(IssueMessage(
            issue_id=issue.id,
            sender="system",
            content=f"Issue manually escalated. Reason: {reason or 'No reason provided'}",
        ))
        return issue

    async def retry_step(self, issue_id: str, step_id: str) -> dict:
        steps = await self.store.get_steps(issue_id)
        target = next((s for s in steps if s.id == step_id), None)
        if not target:
            raise ValueError(f"Step {step_id} not found")
        return {"status": "retry_queued", "step_id": step_id, "step_name": target.name}
