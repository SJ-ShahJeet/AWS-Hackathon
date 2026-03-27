from __future__ import annotations
import asyncio
from datetime import datetime
from typing import Optional, Callable, Awaitable

from app.schemas.models import (
    Issue, AgentPlan, AgentStep, EngineeringArtifact,
    UserFacingUpdate, TraceSpan, IssueMessage, IssueContext,
    IssueStatus, StepStatus, EmotionalState, IssueSeverity,
    new_id, now,
)
from app.storage.base import StorageAdapter
from app.adapters.llm_planner import MockLLMPlanner
from app.adapters.auth_adapter import MockAuthAdapter
from app.adapters.code_insight import MockCodeInsightAdapter
from app.adapters.knowledge_base import MockKnowledgeBaseAdapter
from app.adapters.spec_generation import MockSpecGenerationAdapter
from app.adapters.ticketing import MockTicketingAdapter
from app.adapters.observability import MockObservabilityAdapter
from app.core.logging import get_logger

log = get_logger("orchestrator")

SSECallback = Optional[Callable[[str, dict], Awaitable[None]]]


class AgentOrchestrator:
    """
    Multi-step agent orchestrator that decomposes, plans, executes,
    verifies, and generates both user-facing and engineering artifacts.
    """

    def __init__(self, store: StorageAdapter):
        self.store = store
        self.planner = MockLLMPlanner()
        self.auth = MockAuthAdapter()
        self.code_insight = MockCodeInsightAdapter()
        self.knowledge = MockKnowledgeBaseAdapter()
        self.spec_gen = MockSpecGenerationAdapter()
        self.ticketing = MockTicketingAdapter()
        self.observability = MockObservabilityAdapter()

    async def run(self, issue: Issue, sse_callback: SSECallback = None) -> Issue:
        log.info("agent_run_start", issue_id=issue.id)

        try:
            issue = await self._phase_analyze(issue, sse_callback)
            issue = await self._phase_plan(issue, sse_callback)
            issue = await self._phase_execute(issue, sse_callback)
            issue = await self._phase_verify(issue, sse_callback)
        except Exception as e:
            log.error("agent_run_failed", issue_id=issue.id, error=str(e))
            issue.status = IssueStatus.FAILED
            issue.current_phase = "failed"
            issue.updated_at = now()
            await self.store.update_issue(issue)
            if sse_callback:
                await sse_callback("error", {"issue_id": issue.id, "error": str(e)})

        return issue

    # ── Phase 1: Analyze ──────────────────────────────────────────────

    async def _phase_analyze(self, issue: Issue, cb: SSECallback) -> Issue:
        issue.status = IssueStatus.ANALYZING
        issue.current_phase = "analyzing"
        issue.updated_at = now()
        await self.store.update_issue(issue)
        if cb:
            await cb("phase", {"phase": "analyzing", "issue_id": issue.id})

        analysis = await self._run_step(
            issue, "analyze_complaint", "Analyzing complaint for intent, emotion, and severity",
            tool_name="llm_planner",
            execute=lambda: self.planner.analyze_complaint(issue.raw_complaint),
            cb=cb,
        )

        issue.title = analysis.get("title", issue.title)
        issue.normalized_summary = analysis.get("normalized_summary", "")
        issue.emotional_state = EmotionalState(analysis.get("emotional_state", "neutral"))
        issue.severity = IssueSeverity(analysis.get("severity", "medium"))
        issue.product_area = analysis.get("product_area", "")
        issue.confidence_score = analysis.get("confidence", 0.0)
        issue.updated_at = now()
        await self.store.update_issue(issue)

        await self.store.save_message(IssueMessage(
            issue_id=issue.id,
            sender="agent",
            content=f"I've analyzed your report. Detected area: {issue.product_area}, severity: {issue.severity.value}. Investigating further.",
        ))

        return issue

    # ── Phase 2: Plan ─────────────────────────────────────────────────

    async def _phase_plan(self, issue: Issue, cb: SSECallback) -> Issue:
        issue.status = IssueStatus.PLANNING
        issue.current_phase = "planning"
        issue.updated_at = now()
        await self.store.update_issue(issue)
        if cb:
            await cb("phase", {"phase": "planning", "issue_id": issue.id})

        plan_data = await self._run_step(
            issue, "build_plan", "Creating investigation and resolution plan",
            tool_name="llm_planner",
            execute=lambda: self.planner.build_plan({
                "product_area": issue.product_area,
                "severity": issue.severity.value,
                "emotional_state": issue.emotional_state.value,
                "summary": issue.normalized_summary,
                "missing_information": [],
            }),
            cb=cb,
        )

        plan = AgentPlan(
            issue_id=issue.id,
            objective=plan_data.get("objective", ""),
            assumptions=plan_data.get("assumptions", []),
            missing_information=plan_data.get("missing_information", []),
            ordered_steps=plan_data.get("ordered_steps", []),
            fallback_strategy=plan_data.get("fallback_strategy", ""),
            escalation_condition=plan_data.get("escalation_condition", ""),
            verification_criteria=plan_data.get("verification_criteria", ""),
        )
        await self.store.save_plan(plan)
        return issue

    # ── Phase 3: Execute ──────────────────────────────────────────────

    async def _phase_execute(self, issue: Issue, cb: SSECallback) -> Issue:
        issue.status = IssueStatus.EXECUTING
        issue.current_phase = "executing"
        issue.updated_at = now()
        await self.store.update_issue(issue)
        if cb:
            await cb("phase", {"phase": "executing", "issue_id": issue.id})

        # Step: Fetch user context
        user_ctx = await self._run_step(
            issue, "fetch_user_context", "Retrieving account and activity context",
            tool_name="auth_adapter",
            execute=lambda: self.auth.get_user_context(issue.reporter_id),
            cb=cb,
        )
        await self.store.save_context(IssueContext(
            issue_id=issue.id,
            user_account_info=user_ctx,
        ))

        # Step: Search known incidents
        incidents = await self._run_step(
            issue, "search_known_incidents", "Searching knowledge base for similar incidents",
            tool_name="knowledge_base",
            execute=lambda: self.knowledge.search_incidents(
                f"{issue.product_area} {issue.normalized_summary}"
            ),
            cb=cb,
        )

        area_info = await self._run_step(
            issue, "get_product_area_info", "Looking up team and service ownership",
            tool_name="knowledge_base",
            execute=lambda: self.knowledge.get_product_area_info(issue.product_area),
            cb=cb,
        )

        # Step: Code area analysis
        code_analysis = await self._run_step(
            issue, "analyze_code_area", "Identifying likely code area and failure mode",
            tool_name="code_insight",
            execute=lambda: self.code_insight.analyze_code_area(
                issue.product_area, issue.normalized_summary
            ),
            cb=cb,
        )

        # Step: Create engineering artifact
        artifact = EngineeringArtifact(
            issue_id=issue.id,
            probable_root_cause=code_analysis.get("probable_failure_mode", ""),
            likely_code_area=", ".join(code_analysis.get("likely_files", [])),
            suspected_recent_change=_format_recent_change(code_analysis.get("recent_changes", [])),
            repro_steps=_generate_repro_steps(issue, code_analysis),
            technical_summary=_build_technical_summary(issue, code_analysis, incidents, area_info),
            user_impact=f"Users experiencing {issue.severity.value}-severity issue in {issue.product_area}",
            recommended_owner=area_info.get("on_call", "unassigned"),
            confidence_level=code_analysis.get("confidence", 0.0),
            reasoning=f"Analysis based on product area ({issue.product_area}), recent changes, and known incident patterns",
        )

        # Step: Generate spec and fix plan
        spec = await self._run_step(
            issue, "generate_spec", "Generating engineering specification",
            tool_name="spec_generation",
            execute=lambda: self.spec_gen.generate_spec({
                "probable_root_cause": artifact.probable_root_cause,
                "likely_code_area": artifact.likely_code_area,
                "service": code_analysis.get("service", ""),
                "severity": issue.severity.value,
            }),
            cb=cb,
        )

        fix_plan = await self._run_step(
            issue, "generate_fix_plan", "Creating fix plan and task breakdown",
            tool_name="spec_generation",
            execute=lambda: self.spec_gen.generate_fix_plan({
                "probable_root_cause": artifact.probable_root_cause,
                "likely_code_area": artifact.likely_code_area,
                "suspected_recent_change": artifact.suspected_recent_change,
            }),
            cb=cb,
        )

        artifact.generated_spec = spec.get("description", "")
        artifact.generated_tasks = fix_plan.get("tasks", [])
        artifact.generated_fix_outline = fix_plan.get("fix_outline", "")

        await self._run_step(
            issue, "save_engineering_artifact", "Saving engineering artifact",
            tool_name="storage",
            execute=lambda: self._save_artifact(artifact),
            cb=cb,
        )

        # Step: Create ticket
        await self._run_step(
            issue, "create_ticket", "Creating engineering ticket",
            tool_name="ticketing",
            execute=lambda: self.ticketing.create_ticket({
                "title": spec.get("title", issue.title),
                "severity": issue.severity.value,
                "recommended_owner": artifact.recommended_owner,
            }),
            cb=cb,
        )

        # Step: Generate user-facing update
        empathetic_update = await self._run_step(
            issue, "produce_user_update", "Composing empathetic status update for user",
            tool_name="llm_planner",
            execute=lambda: self.planner.generate_empathetic_response(
                emotional_state=issue.emotional_state.value,
                issue_summary=issue.normalized_summary,
                status="identified",
                next_steps=[
                    "An engineering ticket has been created and assigned",
                    f"The {area_info.get('team', 'engineering')} team has been notified",
                    "You'll receive updates as the fix progresses",
                ],
            ),
            cb=cb,
        )

        issue.user_facing_update = empathetic_update
        issue.updated_at = now()
        await self.store.update_issue(issue)

        user_update = UserFacingUpdate(
            issue_id=issue.id,
            content=empathetic_update,
            empathy_tone=issue.emotional_state.value,
            next_steps=[
                "Engineering ticket created",
                "Team notified",
                "Fix in progress",
            ],
        )
        await self.store.save_user_update(user_update)

        await self.store.save_message(IssueMessage(
            issue_id=issue.id,
            sender="agent",
            content=empathetic_update,
        ))

        issue.confidence_score = artifact.confidence_level
        return issue

    # ── Phase 4: Verify ───────────────────────────────────────────────

    async def _phase_verify(self, issue: Issue, cb: SSECallback) -> Issue:
        issue.status = IssueStatus.VERIFYING
        issue.current_phase = "verifying"
        issue.updated_at = now()
        await self.store.update_issue(issue)
        if cb:
            await cb("phase", {"phase": "verifying", "issue_id": issue.id})

        artifact = await self.store.get_artifact(issue.id)
        should_escalate = False

        if artifact:
            if artifact.confidence_level < 0.5:
                should_escalate = True
                artifact.verification_status = "low_confidence"
            else:
                artifact.verification_status = "verified"
            await self.store.save_artifact(artifact)

        verification_result = await self._run_step(
            issue, "verify_completion", "Verifying all actions completed successfully",
            tool_name="orchestrator",
            execute=lambda: self._verify(issue),
            cb=cb,
        )

        if should_escalate or not verification_result.get("all_complete"):
            issue.status = IssueStatus.ESCALATED
            issue.current_phase = "escalated"
            await self.store.save_message(IssueMessage(
                issue_id=issue.id,
                sender="system",
                content="Issue escalated to human operator for review due to low confidence or incomplete steps.",
            ))
        else:
            issue.status = IssueStatus.RESOLVED
            issue.current_phase = "resolved"

        issue.updated_at = now()
        await self.store.update_issue(issue)
        if cb:
            await cb("complete", {"issue_id": issue.id, "status": issue.status.value})

        return issue

    # ── Helpers ────────────────────────────────────────────────────────

    async def _run_step(
        self, issue: Issue, name: str, description: str,
        tool_name: str, execute: Callable, cb: SSECallback,
    ) -> dict | str | list:
        step = AgentStep(
            issue_id=issue.id,
            name=name,
            description=description,
            tool_name=tool_name,
            status=StepStatus.RUNNING,
            started_at=now(),
        )
        await self.store.save_step(step)

        if cb:
            await cb("step_start", {
                "issue_id": issue.id,
                "step_id": step.id,
                "name": name,
                "description": description,
            })

        trace = TraceSpan(
            issue_id=issue.id,
            step_id=step.id,
            operation=name,
            start_time=now(),
        )

        max_retries = 2
        result = None
        for attempt in range(max_retries + 1):
            try:
                result = await execute()
                step.status = StepStatus.COMPLETED
                step.output_payload = result if isinstance(result, dict) else {"value": result}
                step.completed_at = now()
                step.duration_ms = int((step.completed_at - step.started_at).total_seconds() * 1000)
                break
            except Exception as e:
                step.retry_count = attempt + 1
                if attempt < max_retries:
                    step.status = StepStatus.RETRYING
                    log.warning("step_retry", step=name, attempt=attempt + 1, error=str(e))
                    await asyncio.sleep(0.5)
                else:
                    step.status = StepStatus.FAILED
                    step.error_message = str(e)
                    step.completed_at = now()
                    result = {}
                    log.error("step_failed", step=name, error=str(e))

        await self.store.update_step(step)

        trace.end_time = now()
        trace.duration_ms = step.duration_ms
        trace.status = "ok" if step.status == StepStatus.COMPLETED else "error"
        trace.metadata = {"tool": tool_name, "retries": step.retry_count}
        await self.store.save_trace(trace)

        await self.observability.record_span(trace.model_dump())

        if cb:
            await cb("step_complete", {
                "issue_id": issue.id,
                "step_id": step.id,
                "name": name,
                "status": step.status.value,
                "duration_ms": step.duration_ms,
            })

        return result

    async def _save_artifact(self, artifact: EngineeringArtifact) -> dict:
        saved = await self.store.save_artifact(artifact)
        return saved.model_dump()

    async def _verify(self, issue: Issue) -> dict:
        await asyncio.sleep(0.3)
        steps = await self.store.get_steps(issue.id)
        artifact = await self.store.get_artifact(issue.id)
        all_complete = all(s.status in (StepStatus.COMPLETED, StepStatus.SKIPPED) for s in steps)
        has_artifact = artifact is not None
        return {
            "all_complete": all_complete,
            "has_artifact": has_artifact,
            "total_steps": len(steps),
            "completed_steps": sum(1 for s in steps if s.status == StepStatus.COMPLETED),
            "failed_steps": sum(1 for s in steps if s.status == StepStatus.FAILED),
        }


def _format_recent_change(changes: list[dict]) -> str:
    if not changes:
        return "No recent changes found"
    c = changes[0]
    return f"{c.get('message', 'Unknown change')} by {c.get('author', 'unknown')} on {c.get('date', 'unknown')} ({c.get('lines_changed', 0)} lines)"


def _generate_repro_steps(issue: Issue, code_analysis: dict) -> list[str]:
    area_repro = {
        "billing": [
            "Log in with a test account that has an active subscription",
            "Navigate to checkout and attempt a purchase",
            "Simulate a payment gateway timeout (or slow network)",
            "Observe that the charge is processed twice",
            "Check the billing history for duplicate entries",
        ],
        "checkout": [
            "Add items to cart totaling more than $50",
            "Apply a percentage-based promo code",
            "Attempt to stack a second fixed-amount promo code",
            "Observe the total becomes NaN or shows incorrect amount",
            "Attempt to proceed to payment — checkout fails",
        ],
        "authentication": [
            "Navigate to the login page and click 'Forgot Password'",
            "Enter a valid registered email address",
            "Submit the form — confirmation message appears",
            "Wait 15+ minutes and check inbox including spam",
            "No reset email is received despite success message",
        ],
        "file-management": [
            "Log in and navigate to the file upload section",
            "Select a file that is exactly at or near the chunk boundary (e.g., 10MB, 50MB)",
            "Begin the upload — progress shows 100%",
            "The upload completes with no error shown",
            "Attempt to download the file — it is corrupted or truncated",
        ],
        "ui-frontend": [
            "Open the billing dashboard on a mobile device (< 768px viewport)",
            "Or use Chrome DevTools to simulate a mobile viewport",
            "Observe that the page layout overflows horizontally",
            "Attempt to click action buttons — some are offscreen",
            "The page is unusable on mobile viewports",
        ],
    }
    return area_repro.get(issue.product_area, [
        "Navigate to the affected feature",
        "Perform the action described in the complaint",
        "Observe the error or unexpected behavior",
    ])


def _build_technical_summary(
    issue: Issue, code_analysis: dict,
    incidents: list | dict, area_info: dict
) -> str:
    service = code_analysis.get("service", "unknown")
    failure = code_analysis.get("probable_failure_mode", "Unknown")
    files = code_analysis.get("likely_files", [])
    deps = code_analysis.get("dependencies", [])
    team = area_info.get("team", "Engineering") if isinstance(area_info, dict) else "Engineering"

    related = ""
    if isinstance(incidents, list) and incidents:
        related = f"\n\nRelated past incidents: {', '.join(i.get('id', '') for i in incidents[:2])}"

    return (
        f"Service: {service}\n"
        f"Likely failure mode: {failure}\n"
        f"Affected files: {', '.join(files[:3])}\n"
        f"Dependencies: {', '.join(deps)}\n"
        f"Owning team: {team}{related}"
    )
