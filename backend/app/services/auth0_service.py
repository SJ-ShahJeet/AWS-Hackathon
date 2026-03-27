from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import get_settings


class Auth0ManagementClient:
    def __init__(self):
        self.settings = get_settings()
        self._token: str | None = None
        self._expires_at: datetime | None = None

    async def get_management_token(self) -> str:
        if not self.settings.management_api_enabled:
            raise RuntimeError("Auth0 management API is not configured")

        now = datetime.now(timezone.utc)
        if self._token and self._expires_at and self._expires_at > now + timedelta(minutes=2):
            return self._token

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://{self.settings.auth0_domain}/oauth/token",
                json={
                    "grant_type": "client_credentials",
                    "client_id": self.settings.auth0_m2m_client_id,
                    "client_secret": self.settings.auth0_m2m_client_secret,
                    "audience": self.settings.auth0_management_api_audience,
                },
            )
            response.raise_for_status()
            payload = response.json()

        self._token = payload["access_token"]
        self._expires_at = now + timedelta(seconds=int(payload.get("expires_in", 3600)))
        return self._token

    async def get_user_profile(self, subject: str) -> dict[str, Any]:
        token = await self.get_management_token()
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                f"https://{self.settings.auth0_domain}/api/v2/users/{quote(subject, safe='')}",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            return response.json()
