from __future__ import annotations

from app.schemas.api_models import (
    DashboardAdminPayload,
    DashboardChildPayload,
    DashboardParentPayload,
    DashboardResponse,
    ParentChildSnapshot,
    ProfileBundleResponse,
    RecommendationBundle,
    RecommendationResponse,
)
from app.schemas.models import ApprovalStatus, CustomerProfile, User, UserRole, now
from app.storage.base import StorageAdapter


class PennyService:
    def __init__(self, store: StorageAdapter):
        self.store = store

    async def get_profile_bundle(self, user: User) -> ProfileBundleResponse:
        profile = await self.store.get_profile(user.id)
        return ProfileBundleResponse(user=user, profile=profile)

    async def update_phone(self, user: User, phone_number: str) -> ProfileBundleResponse:
        user.phone_number = phone_number
        await self.store.update_user(user)

        profile = await self.store.get_profile(user.id)
        if profile:
            profile.phone_number = phone_number
            profile.updated_at = now()
            await self.store.update_profile(profile)
        elif user.household_id:
            profile = CustomerProfile(
                user_id=user.id,
                household_id=user.household_id,
                phone_number=phone_number,
                notes="Created from profile phone update.",
            )
            await self.store.save_profile(profile)

        return ProfileBundleResponse(user=user, profile=profile)

    async def get_recommendation_bundles_for_child(self, child_user_id: str) -> list[RecommendationBundle]:
        recommendation = await self.store.get_recommendation_set(child_user_id)
        if not recommendation:
            return []
        options = await self.store.list_recommendation_options(recommendation.id)
        approval = await self.store.get_approval_for_recommendation(recommendation.id)
        return [RecommendationBundle(recommendation=recommendation, options=options, approval=approval)]

    async def get_recommendations_for_user(self, user: User) -> RecommendationResponse:
        if user.role == UserRole.CHILD:
            bundles = await self.get_recommendation_bundles_for_child(user.id)
            return RecommendationResponse(recommendations=bundles)

        if user.household_id:
            household_users = await self.store.list_household_users(user.household_id)
            bundles: list[RecommendationBundle] = []
            for member in household_users:
                if member.role == UserRole.CHILD:
                    bundles.extend(await self.get_recommendation_bundles_for_child(member.id))
            return RecommendationResponse(recommendations=bundles)

        return RecommendationResponse(recommendations=[])

    async def get_dashboard(self, user: User) -> DashboardResponse:
        if user.role == UserRole.CHILD:
            profile = await self.store.get_profile(user.id)
            chores = await self.store.list_ledger_entries(user.id, limit=6)
            recommendations = await self.get_recommendation_bundles_for_child(user.id)
            calls = await self.store.list_call_sessions(user_id=user.id, limit=10)
            return DashboardResponse(
                role=user.role,
                child=DashboardChildPayload(
                    user=user,
                    profile=profile,
                    chores=chores,
                    recommendations=recommendations,
                    calls=calls,
                ),
            )

        if user.role == UserRole.PARENT:
            household_users = await self.store.list_household_users(user.household_id or "")
            child_snapshots: list[ParentChildSnapshot] = []
            for member in household_users:
                if member.role != UserRole.CHILD:
                    continue
                profile = await self.store.get_profile(member.id)
                bundles = await self.get_recommendation_bundles_for_child(member.id)
                child_snapshots.append(
                    ParentChildSnapshot(
                        child=member,
                        profile=profile,
                        recommendation=bundles[0] if bundles else None,
                    )
                )

            approvals = await self.store.list_approval_requests(
                parent_user_id=user.id,
                household_id=user.household_id,
                limit=20,
            )
            calls = await self.store.list_call_sessions(household_id=user.household_id, limit=20)
            return DashboardResponse(
                role=user.role,
                parent=DashboardParentPayload(
                    user=user,
                    household_children=child_snapshots,
                    approvals=approvals,
                    calls=calls,
                ),
            )

        recent_calls = await self.store.list_call_sessions(limit=25)
        traces = await self.store.get_traces()
        approvals = await self.store.list_approval_requests(limit=25)
        support_calls = sum(1 for call in recent_calls if call.call_type.value == "support")
        approval_calls = sum(1 for call in recent_calls if call.call_type.value == "approval")
        pending_approvals = sum(1 for approval in approvals if approval.status == ApprovalStatus.PENDING)

        return DashboardResponse(
            role=user.role,
            admin=DashboardAdminPayload(
                total_calls=len(recent_calls),
                support_calls=support_calls,
                approval_calls=approval_calls,
                pending_approvals=pending_approvals,
                recent_calls=recent_calls,
                traces=traces[:50],
                approvals=approvals,
            ),
        )
