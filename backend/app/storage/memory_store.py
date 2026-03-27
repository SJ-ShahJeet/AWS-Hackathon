from __future__ import annotations

from typing import Optional

from app.schemas.models import (
    ApprovalRequest,
    ApprovalStatus,
    CallEvent,
    CallSession,
    ChoreLedgerEntry,
    CustomerProfile,
    Household,
    KnowledgeArticle,
    RecommendationOption,
    RecommendationSet,
    Session,
    TraceSpan,
    User,
)

from .base import StorageAdapter


class MemoryStore(StorageAdapter):
    def __init__(self):
        self._users: dict[str, User] = {}
        self._sessions: dict[str, Session] = {}
        self._households: dict[str, Household] = {}
        self._profiles: dict[str, CustomerProfile] = {}
        self._ledger: dict[str, list[ChoreLedgerEntry]] = {}
        self._recommendations: dict[str, RecommendationSet] = {}
        self._options: dict[str, list[RecommendationOption]] = {}
        self._approvals: dict[str, ApprovalRequest] = {}
        self._calls: dict[str, CallSession] = {}
        self._call_events: dict[str, list[CallEvent]] = {}
        self._traces: list[TraceSpan] = []
        self._knowledge: dict[str, KnowledgeArticle] = {}

    async def initialize(self) -> None:
        return None

    async def close(self) -> None:
        return None

    async def get_user(self, user_id: str) -> Optional[User]:
        return self._users.get(user_id)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return next((u for u in self._users.values() if u.email == email), None)

    async def get_user_by_subject(self, subject: str) -> Optional[User]:
        return next((u for u in self._users.values() if u.auth_subject == subject), None)

    async def save_user(self, user: User) -> User:
        self._users[user.id] = user
        return user

    async def update_user(self, user: User) -> User:
        self._users[user.id] = user
        return user

    async def save_session(self, session: Session) -> Session:
        self._sessions[session.token] = session
        return session

    async def get_session(self, token: str) -> Optional[Session]:
        return self._sessions.get(token)

    async def save_household(self, household: Household) -> Household:
        self._households[household.id] = household
        return household

    async def get_household(self, household_id: str) -> Optional[Household]:
        return self._households.get(household_id)

    async def list_household_users(self, household_id: str) -> list[User]:
        return [u for u in self._users.values() if u.household_id == household_id]

    async def save_profile(self, profile: CustomerProfile) -> CustomerProfile:
        self._profiles[profile.user_id] = profile
        return profile

    async def get_profile(self, user_id: str) -> Optional[CustomerProfile]:
        return self._profiles.get(user_id)

    async def update_profile(self, profile: CustomerProfile) -> CustomerProfile:
        self._profiles[profile.user_id] = profile
        return profile

    async def save_ledger_entry(self, entry: ChoreLedgerEntry) -> ChoreLedgerEntry:
        entries = self._ledger.setdefault(entry.child_user_id, [])
        if not any(existing.id == entry.id for existing in entries):
            entries.append(entry)
            entries.sort(key=lambda item: item.completed_at, reverse=True)
        return entry

    async def list_ledger_entries(self, child_user_id: str, limit: int = 10) -> list[ChoreLedgerEntry]:
        return self._ledger.get(child_user_id, [])[:limit]

    async def save_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet:
        self._recommendations[recommendation.child_user_id] = recommendation
        return recommendation

    async def get_recommendation_set(self, child_user_id: str) -> Optional[RecommendationSet]:
        return self._recommendations.get(child_user_id)

    async def update_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet:
        self._recommendations[recommendation.child_user_id] = recommendation
        return recommendation

    async def save_recommendation_options(
        self,
        recommendation_set_id: str,
        options: list[RecommendationOption],
    ) -> list[RecommendationOption]:
        self._options[recommendation_set_id] = list(sorted(options, key=lambda item: item.sort_order))
        return self._options[recommendation_set_id]

    async def list_recommendation_options(self, recommendation_set_id: str) -> list[RecommendationOption]:
        return self._options.get(recommendation_set_id, [])

    async def save_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest:
        self._approvals[approval.id] = approval
        return approval

    async def get_approval_request(self, approval_id: str) -> Optional[ApprovalRequest]:
        return self._approvals.get(approval_id)

    async def get_approval_for_recommendation(self, recommendation_set_id: str) -> Optional[ApprovalRequest]:
        return next(
            (approval for approval in self._approvals.values() if approval.recommendation_set_id == recommendation_set_id),
            None,
        )

    async def list_pending_approvals(self, parent_user_id: str | None = None) -> list[ApprovalRequest]:
        approvals = [
            approval
            for approval in self._approvals.values()
            if approval.status == ApprovalStatus.PENDING
        ]
        if parent_user_id:
            approvals = [approval for approval in approvals if approval.parent_user_id == parent_user_id]
        return sorted(approvals, key=lambda item: item.created_at, reverse=True)

    async def list_approval_requests(
        self,
        parent_user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[ApprovalRequest]:
        approvals = list(self._approvals.values())
        if parent_user_id:
            approvals = [approval for approval in approvals if approval.parent_user_id == parent_user_id]
        if household_id:
            approvals = [approval for approval in approvals if approval.household_id == household_id]
        approvals.sort(key=lambda item: item.created_at, reverse=True)
        return approvals[:limit]

    async def update_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest:
        self._approvals[approval.id] = approval
        return approval

    async def save_call_session(self, call: CallSession) -> CallSession:
        self._calls[call.id] = call
        return call

    async def update_call_session(self, call: CallSession) -> CallSession:
        self._calls[call.id] = call
        return call

    async def get_call_session(self, call_id: str) -> Optional[CallSession]:
        return self._calls.get(call_id)

    async def get_call_session_by_vendor_id(self, vendor_call_id: str) -> Optional[CallSession]:
        return next((call for call in self._calls.values() if call.vendor_call_id == vendor_call_id), None)

    async def list_call_sessions(
        self,
        user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[CallSession]:
        calls = list(self._calls.values())
        if user_id:
            calls = [call for call in calls if call.user_id == user_id]
        if household_id:
            calls = [call for call in calls if call.household_id == household_id]
        calls.sort(key=lambda item: item.created_at, reverse=True)
        return calls[:limit]

    async def save_call_event(self, event: CallEvent) -> CallEvent:
        events = self._call_events.setdefault(event.call_session_id, [])
        if not any(existing.id == event.id for existing in events):
            events.append(event)
            events.sort(key=lambda item: item.created_at)
        return event

    async def list_call_events(self, call_session_id: str) -> list[CallEvent]:
        return self._call_events.get(call_session_id, [])

    async def save_trace(self, trace: TraceSpan) -> TraceSpan:
        if not any(existing.id == trace.id for existing in self._traces):
            self._traces.append(trace)
            self._traces.sort(key=lambda item: item.start_time, reverse=True)
        return trace

    async def get_traces(self, call_session_id: str | None = None) -> list[TraceSpan]:
        if call_session_id:
            return [trace for trace in self._traces if trace.call_session_id == call_session_id]
        return self._traces

    async def save_knowledge_article(self, article: KnowledgeArticle) -> KnowledgeArticle:
        self._knowledge[article.id] = article
        return article

    async def search_knowledge_articles(self, query: str, limit: int = 3) -> list[KnowledgeArticle]:
        query_terms = [term for term in query.lower().split() if term]
        scored: list[tuple[int, KnowledgeArticle]] = []
        for article in self._knowledge.values():
            haystack = f"{article.title} {article.body} {' '.join(article.tags)}".lower()
            score = sum(1 for term in query_terms if term in haystack)
            if score > 0:
                scored.append((score, article))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [article for _, article in scored[:limit]]
