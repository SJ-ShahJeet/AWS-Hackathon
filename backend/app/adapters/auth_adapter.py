import asyncio
from typing import Optional
from .base import AuthAdapter


class MockAuthAdapter(AuthAdapter):
    """Mock auth adapter simulating Okta. Replace with real Okta integration."""

    async def verify_token(self, token: str) -> Optional[dict]:
        await asyncio.sleep(0.05)
        if token and token.startswith("demo-"):
            return {"valid": True, "user_id": token.replace("demo-", "")}
        return None

    async def get_user_context(self, user_id: str) -> dict:
        await asyncio.sleep(0.1)
        contexts = {
            "user-alice": {
                "account_status": "active",
                "plan": "pro",
                "account_age_days": 342,
                "recent_tickets": 2,
                "lifetime_value": 2840.00,
                "last_login": "2025-03-25T14:30:00Z",
                "feature_flags": ["new-checkout-v2", "dark-mode"],
            },
            "user-bob": {
                "account_status": "active",
                "plan": "enterprise",
                "account_age_days": 1200,
                "recent_tickets": 0,
                "lifetime_value": 48500.00,
                "last_login": "2025-03-26T09:15:00Z",
                "feature_flags": ["new-checkout-v2", "beta-upload"],
            },
        }
        return contexts.get(user_id, {
            "account_status": "active",
            "plan": "starter",
            "account_age_days": 90,
            "recent_tickets": 1,
            "lifetime_value": 120.00,
            "last_login": "2025-03-24T10:00:00Z",
            "feature_flags": [],
        })
