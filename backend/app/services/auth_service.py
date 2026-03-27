from __future__ import annotations

from typing import Any, Optional

from app.schemas.models import CustomerProfile, Session, User, UserRole, now
from app.storage.base import StorageAdapter

from .auth0_service import Auth0ManagementClient


DEMO_USERS = [
    {
        "email": "maya@demo.com",
        "name": "Maya Hart",
        "role": UserRole.CHILD,
        "household_id": "household-hart",
        "phone_number": "+14155550127",
    },
    {
        "email": "nina@demo.com",
        "name": "Nina Hart",
        "role": UserRole.PARENT,
        "household_id": "household-hart",
        "phone_number": "+14155550128",
    },
    {
        "email": "ops@demo.com",
        "name": "Penny Ops",
        "role": UserRole.ADMIN,
        "household_id": "ops-hq",
        "phone_number": "+14155550129",
    },
]


class AuthService:
    def __init__(self, store: StorageAdapter):
        self.store = store
        self.management = Auth0ManagementClient()

    async def demo_login(self, email: str, role: UserRole | None = None) -> tuple[User, str]:
        user = await self.store.get_user_by_email(email)
        if not user:
            demo = next((candidate for candidate in DEMO_USERS if candidate["email"] == email), None)
            if demo:
                user = User(**demo)
            else:
                user = User(
                    email=email,
                    name=email.split("@")[0].replace(".", " ").title(),
                    role=role or UserRole.CHILD,
                )
            await self.store.save_user(user)

        token = f"demo-{user.id}"
        await self.store.save_session(Session(user_id=user.id, token=token))
        return user, token

    async def get_user_from_demo_token(self, token: str) -> User | None:
        session = await self.store.get_session(token)
        if not session:
            return None
        return await self.store.get_user(session.user_id)

    async def sync_user_from_auth0_claims(self, claims: dict[str, Any]) -> User:
        subject = claims.get("sub")
        email = claims.get("email") or claims.get("https://penny.app/email")
        name = claims.get("name") or claims.get("nickname") or (email.split("@")[0].title() if email else "Penny User")

        user = None
        if subject:
            user = await self.store.get_user_by_subject(subject)
        if not user and email:
            user = await self.store.get_user_by_email(email)

        profile_data: dict[str, Any] = {}
        if subject:
            try:
                profile_data = await self.management.get_user_profile(subject)
            except Exception:
                profile_data = {}

        app_metadata = profile_data.get("app_metadata") or {}
        role_value = (
            app_metadata.get("role")
            or claims.get("https://penny.app/role")
            or claims.get("role")
            or UserRole.CHILD.value
        )
        household_id = app_metadata.get("household_id") or claims.get("https://penny.app/household_id")
        ghost_user_id = app_metadata.get("ghost_user_id")
        phone_number = profile_data.get("phone_number") or claims.get("phone_number")

        role = UserRole(role_value)

        if not user:
            user = User(
                email=email or f"{subject}@auth0.local",
                name=name,
                role=role,
                household_id=household_id,
                ghost_user_id=ghost_user_id,
                auth_subject=subject,
                phone_number=phone_number,
                avatar_name="Penny",
            )
            await self.store.save_user(user)
        else:
            user.email = email or user.email
            user.name = name or user.name
            user.role = role
            user.household_id = household_id or user.household_id
            user.ghost_user_id = ghost_user_id or user.ghost_user_id
            user.auth_subject = subject or user.auth_subject
            user.phone_number = phone_number or user.phone_number
            await self.store.update_user(user)

        existing_profile = await self.store.get_profile(user.id)
        if phone_number and existing_profile:
            existing_profile.phone_number = phone_number
            existing_profile.updated_at = now()
            await self.store.update_profile(existing_profile)
        elif phone_number and role in (UserRole.CHILD, UserRole.PARENT) and household_id and not existing_profile:
            await self.store.save_profile(
                CustomerProfile(
                    user_id=user.id,
                    household_id=household_id,
                    phone_number=phone_number,
                    notes="Created from Auth0 metadata sync.",
                )
            )

        return user
