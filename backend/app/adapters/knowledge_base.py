import asyncio
import random
from .base import KnowledgeBaseAdapter

KNOWN_INCIDENTS = [
    {
        "id": "INC-2024-089",
        "title": "Duplicate charges during high-traffic checkout",
        "status": "resolved",
        "resolved_date": "2025-01-15",
        "root_cause": "Payment gateway timeout caused retry loop without idempotency key",
        "affected_area": "billing",
        "resolution": "Added idempotency keys to all payment requests",
    },
    {
        "id": "INC-2024-102",
        "title": "Promo codes not applying to annual plans",
        "status": "resolved",
        "resolved_date": "2025-02-20",
        "root_cause": "Promo validation only checked monthly plan SKUs",
        "affected_area": "checkout",
        "resolution": "Extended promo engine to support all plan types",
    },
    {
        "id": "INC-2025-003",
        "title": "Password reset emails delayed by 2+ hours",
        "status": "resolved",
        "resolved_date": "2025-03-10",
        "root_cause": "Email queue was deprioritized during bulk marketing send",
        "affected_area": "authentication",
        "resolution": "Separated transactional and marketing email queues",
    },
    {
        "id": "INC-2025-011",
        "title": "File uploads failing for files > 50MB",
        "status": "monitoring",
        "resolved_date": None,
        "root_cause": "S3 multipart upload misconfigured chunk size",
        "affected_area": "file-management",
        "resolution": "Pending — chunk size configuration update in review",
    },
    {
        "id": "INC-2025-015",
        "title": "Billing dashboard crashes on Safari mobile",
        "status": "investigating",
        "resolved_date": None,
        "root_cause": "CSS Grid feature not fully supported in older Safari versions",
        "affected_area": "ui-frontend",
        "resolution": "Pending — fallback layout being implemented",
    },
]

PRODUCT_AREA_INFO = {
    "billing": {
        "team": "Payments Team",
        "on_call": "dev-sarah",
        "slack_channel": "#billing-alerts",
        "sla_hours": 4,
        "recent_incident_count": 2,
        "health": "degraded",
    },
    "checkout": {
        "team": "Commerce Team",
        "on_call": "dev-alex",
        "slack_channel": "#checkout-alerts",
        "sla_hours": 2,
        "recent_incident_count": 1,
        "health": "healthy",
    },
    "authentication": {
        "team": "Identity Team",
        "on_call": "dev-jordan",
        "slack_channel": "#auth-alerts",
        "sla_hours": 1,
        "recent_incident_count": 1,
        "health": "healthy",
    },
    "file-management": {
        "team": "Platform Team",
        "on_call": "dev-priya",
        "slack_channel": "#platform-alerts",
        "sla_hours": 8,
        "recent_incident_count": 1,
        "health": "degraded",
    },
    "ui-frontend": {
        "team": "Frontend Team",
        "on_call": "dev-lisa",
        "slack_channel": "#frontend-alerts",
        "sla_hours": 8,
        "recent_incident_count": 1,
        "health": "investigating",
    },
    "api": {
        "team": "Platform Team",
        "on_call": "dev-mike",
        "slack_channel": "#api-alerts",
        "sla_hours": 2,
        "recent_incident_count": 0,
        "health": "healthy",
    },
}


class MockKnowledgeBaseAdapter(KnowledgeBaseAdapter):
    """Mock knowledge base for incident search. Replace with real vector/search backend."""

    async def search_incidents(self, query: str) -> list[dict]:
        await asyncio.sleep(random.uniform(0.2, 0.5))
        query_lower = query.lower()
        matches = []
        for incident in KNOWN_INCIDENTS:
            score = sum(
                1 for word in query_lower.split()
                if word in incident["title"].lower()
                or word in incident["root_cause"].lower()
                or word in incident["affected_area"].lower()
            )
            if score > 0:
                matches.append({**incident, "relevance_score": min(score / 5, 1.0)})
        matches.sort(key=lambda x: x["relevance_score"], reverse=True)
        return matches[:3]

    async def get_product_area_info(self, area: str) -> dict:
        await asyncio.sleep(0.1)
        return PRODUCT_AREA_INFO.get(area, {
            "team": "General Engineering",
            "on_call": "unassigned",
            "slack_channel": "#engineering",
            "sla_hours": 24,
            "recent_incident_count": 0,
            "health": "unknown",
        })
