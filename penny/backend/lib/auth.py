"""
Penny — Auth0 JWT verification and role-based access control.
"""
import os
import httpx
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
ROLES_CLAIM = "https://penny-app/roles"

_jwks_cache: dict | None = None
bearer = HTTPBearer(auto_error=False)


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
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
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
        return payload
    except JWTError as e:
        raise HTTPException(401, f"Invalid token: {e}")


def require_role(role: str):
    """FastAPI dependency factory. Usage: Depends(require_role('parent'))"""
    async def _check(payload: dict = Depends(verify_token)) -> dict:
        roles: list[str] = payload.get(ROLES_CLAIM, [])
        if role not in roles:
            raise HTTPException(403, f"Role '{role}' required")
        return payload
    return _check
