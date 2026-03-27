"""
Penny — Ghost Admin API Client
Agent 3 (Database) owns this file.
All data reads/writes go through these functions — no raw httpx calls elsewhere.
"""
import os
import json
import httpx
from typing import Any
from lib.logger import logger

GHOST_URL = os.getenv("GHOST_URL", "")
GHOST_ADMIN_API_KEY = os.getenv("GHOST_ADMIN_API_KEY", "")

_headers: dict[str, str] = {}


def _get_headers() -> dict[str, str]:
    """Lazy-init Ghost Admin API auth header."""
    global _headers
    if not _headers and GHOST_ADMIN_API_KEY:
        try:
            import jwt as jose_jwt
            from datetime import datetime, timezone
            key_id, secret = GHOST_ADMIN_API_KEY.split(":")
            payload = {
                "iat": int(datetime.now(timezone.utc).timestamp()),
                "exp": int(datetime.now(timezone.utc).timestamp()) + 300,
                "aud": "/admin/",
            }
            token = jose_jwt.encode(payload, bytes.fromhex(secret), algorithm="HS256", headers={"kid": key_id})
            _headers = {"Authorization": f"Ghost {token}", "Content-Type": "application/json"}
        except Exception as e:
            logger.warning("Ghost auth header failed", extra={"error": str(e)})
    return _headers


async def save_chore(chore: dict[str, Any]) -> dict[str, Any]:
    logger.info("[GHOST] save_chore", extra={"title": chore.get("title")})
    if not GHOST_URL:
        return {"id": "mock-id", **chore}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GHOST_URL}/ghost/api/admin/posts/",
            headers=_get_headers(),
            json={"posts": [{
                "title": f"CHORE: {chore['title']}",
                "tags": [{"name": "chore"}, {"name": chore["childId"]}, {"name": chore["status"]}],
                "html": json.dumps(chore),
                "status": "draft",
            }]},
        )
        resp.raise_for_status()
        return resp.json()["posts"][0]


async def get_chores(child_id: str) -> list[dict[str, Any]]:
    logger.info("[GHOST] get_chores", extra={"childId": child_id})
    if not GHOST_URL:
        return []
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GHOST_URL}/ghost/api/admin/posts/",
            headers=_get_headers(),
            params={"filter": f"tag:chore+tag:{child_id}", "limit": 50},
        )
        resp.raise_for_status()
        posts = resp.json().get("posts", [])
        return [json.loads(p.get("html") or "{}") for p in posts]


async def save_investment(req: dict[str, Any]) -> dict[str, Any]:
    logger.info("[GHOST] save_investment", extra={"ticker": req.get("ticker")})
    if not GHOST_URL:
        return {"id": "mock-id", **req}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GHOST_URL}/ghost/api/admin/posts/",
            headers=_get_headers(),
            json={"posts": [{
                "title": f"INVEST: {req['ticker']} ${req['amount']}",
                "tags": [{"name": "investment"}, {"name": req["childId"]}, {"name": req["status"]}],
                "html": json.dumps(req),
                "status": "draft",
            }]},
        )
        resp.raise_for_status()
        return resp.json()["posts"][0]
