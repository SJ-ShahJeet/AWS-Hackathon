"""
Penny — Auth0 JWT verification and role-based access control.
"""
import os
import httpx
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

ROLES_CLAIM = "https://penny-app/roles"

_jwks_cache: dict | None = None
bearer = HTTPBearer(auto_error=False)


def _get_auth0_domain() -> str:
    return os.getenv("AUTH0_DOMAIN", "")


def _get_auth0_audience() -> str:
    return os.getenv("AUTH0_AUDIENCE", "")


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        domain = _get_auth0_domain()
        if not domain:
            raise HTTPException(401, "Auth0 not configured")
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://{domain}/.well-known/jwks.json")
            r.raise_for_status()
            _jwks_cache = r.json()
    return _jwks_cache


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
) -> dict:
    if not credentials:
        raise HTTPException(401, "Missing authorization token")
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=_get_auth0_audience(),
            issuer=f"https://{_get_auth0_domain()}/",
        )
        return payload
    except JWTError as e:
        raise HTTPException(401, f"Invalid token: {e}")


async def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Resolve JWT sub → app user from DB. Returns user dict."""
    from lib.db import get_user_by_sub
    sub = payload.get("sub", "")
    user = await get_user_by_sub(sub)
    if not user:
        raise HTTPException(401, "User not registered. Call /api/me first.")
    return dict(user)


def require_role(role: str):
    """FastAPI dependency factory. Usage: Depends(require_role('parent'))"""
    async def _check(payload: dict = Depends(verify_token)) -> dict:
        roles: list[str] = payload.get(ROLES_CLAIM, [])
        if role not in roles:
            raise HTTPException(403, f"Role '{role}' required")
        return payload
    return _check
