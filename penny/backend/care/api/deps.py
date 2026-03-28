from __future__ import annotations

import time
from typing import Optional

import httpx
from fastapi import Depends, Header, HTTPException
from jose import jwk, jwt
from jose.utils import base64url_decode

from care.config import get_settings
from care.schemas.models import User, UserRole
from care.services.auth_service import AuthService
from care.storage import store

_JWKS_CACHE: dict[str, object] = {"keys": [], "expires_at": 0.0}


async def _get_jwks() -> list[dict]:
    settings = get_settings()
    now_ts = time.time()
    if _JWKS_CACHE["keys"] and float(_JWKS_CACHE["expires_at"]) > now_ts:
        return list(_JWKS_CACHE["keys"])  # type: ignore[arg-type]

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"https://{settings.auth0_domain}/.well-known/jwks.json")
        response.raise_for_status()
        data = response.json()

    _JWKS_CACHE["keys"] = data.get("keys", [])
    _JWKS_CACHE["expires_at"] = now_ts + 3600
    return list(_JWKS_CACHE["keys"])  # type: ignore[arg-type]


async def _verify_auth0_token(token: str) -> dict:
    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:  # pragma: no cover - jose internals
        raise HTTPException(status_code=401, detail="Malformed access token") from exc

    jwks = await _get_jwks()
    key_data = next((key for key in jwks if key.get("kid") == header.get("kid")), None)
    if not key_data:
        raise HTTPException(status_code=401, detail="Unable to find signing key")

    message, encoded_signature = token.rsplit(".", 1)
    decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))
    public_key = jwk.construct(key_data)
    if not public_key.verify(message.encode("utf-8"), decoded_signature):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    claims = jwt.get_unverified_claims(token)
    exp = claims.get("exp")
    if exp and time.time() > float(exp):
        raise HTTPException(status_code=401, detail="Token expired")

    issuer = claims.get("iss")
    expected_issuer = f"https://{settings.auth0_domain}/"
    if issuer != expected_issuer:
        raise HTTPException(status_code=401, detail="Invalid issuer")

    audience = claims.get("aud")
    valid_audience = False
    if isinstance(audience, list):
        valid_audience = settings.auth0_audience in audience
    elif isinstance(audience, str):
        valid_audience = audience == settings.auth0_audience
    if not valid_audience:
        raise HTTPException(status_code=401, detail="Invalid audience")

    return claims


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "").strip()
    auth = AuthService(store)
    settings = get_settings()

    if token.startswith("demo-"):
        user = await auth.get_user_from_demo_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid demo session")
        return user

    if not settings.auth0_enabled:
        raise HTTPException(status_code=401, detail="Auth0 access token required or configure demo login")

    claims = await _verify_auth0_token(token)
    return await auth.sync_user_from_auth0_claims(claims)


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


def require_role(*roles: UserRole):
    async def _require(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _require
