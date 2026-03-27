"""Tracing utilities with TrueFoundry-style hooks and Overmind-style optimization metadata."""
from __future__ import annotations

from datetime import datetime
from app.schemas.models import TraceSpan, now, new_id
from app.storage.base import StorageAdapter


class Tracer:
    def __init__(self, store: StorageAdapter):
        self.store = store

    async def start_span(
        self, issue_id: str, operation: str,
        step_id: str | None = None, parent_span_id: str | None = None,
        metadata: dict | None = None,
    ) -> TraceSpan:
        span = TraceSpan(
            id=new_id(),
            issue_id=issue_id,
            step_id=step_id,
            operation=operation,
            start_time=now(),
            parent_span_id=parent_span_id,
            metadata=metadata or {},
        )
        await self.store.save_trace(span)
        return span

    async def end_span(self, span: TraceSpan, status: str = "ok") -> TraceSpan:
        span.end_time = now()
        span.status = status
        if span.start_time and span.end_time:
            span.duration_ms = int((span.end_time - span.start_time).total_seconds() * 1000)
        return span

    async def get_execution_graph(self, issue_id: str) -> dict:
        """Build a lightweight execution graph for visualization."""
        traces = await self.store.get_traces(issue_id)
        nodes = []
        edges = []
        for t in traces:
            nodes.append({
                "id": t.id,
                "operation": t.operation,
                "status": t.status,
                "duration_ms": t.duration_ms,
                "service": t.service,
            })
            if t.parent_span_id:
                edges.append({"from": t.parent_span_id, "to": t.id})
        return {"nodes": nodes, "edges": edges}
