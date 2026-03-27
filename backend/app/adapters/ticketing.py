import asyncio
import random
from .base import TicketingOrActionAdapter


class MockTicketingAdapter(TicketingOrActionAdapter):
    """Mock Airbyte ticketing/action adapter. Replace with real Airbyte connector."""

    async def create_ticket(self, issue_data: dict) -> dict:
        await asyncio.sleep(random.uniform(0.2, 0.5))
        ticket_id = f"ENG-{random.randint(1000, 9999)}"
        return {
            "ticket_id": ticket_id,
            "url": f"https://jira.example.com/browse/{ticket_id}",
            "status": "created",
            "assignee": issue_data.get("recommended_owner", "unassigned"),
            "priority": "P1" if issue_data.get("severity") in ("critical", "high") else "P2",
        }

    async def execute_action(self, action_type: str, payload: dict) -> dict:
        await asyncio.sleep(0.2)
        return {
            "action": action_type,
            "status": "completed",
            "result": f"Action '{action_type}' executed successfully",
            "payload": payload,
        }
