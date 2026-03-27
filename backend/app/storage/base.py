from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.schemas.models import (
    ApprovalRequest,
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


class StorageAdapter(ABC):
    @abstractmethod
    async def initialize(self) -> None: ...

    @abstractmethod
    async def close(self) -> None: ...

    # Users / sessions
    @abstractmethod
    async def get_user(self, user_id: str) -> Optional[User]: ...

    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[User]: ...

    @abstractmethod
    async def get_user_by_subject(self, subject: str) -> Optional[User]: ...

    @abstractmethod
    async def save_user(self, user: User) -> User: ...

    @abstractmethod
    async def update_user(self, user: User) -> User: ...

    @abstractmethod
    async def save_session(self, session: Session) -> Session: ...

    @abstractmethod
    async def get_session(self, token: str) -> Optional[Session]: ...

    # Household/profile data
    @abstractmethod
    async def save_household(self, household: Household) -> Household: ...

    @abstractmethod
    async def get_household(self, household_id: str) -> Optional[Household]: ...

    @abstractmethod
    async def list_household_users(self, household_id: str) -> list[User]: ...

    @abstractmethod
    async def save_profile(self, profile: CustomerProfile) -> CustomerProfile: ...

    @abstractmethod
    async def get_profile(self, user_id: str) -> Optional[CustomerProfile]: ...

    @abstractmethod
    async def update_profile(self, profile: CustomerProfile) -> CustomerProfile: ...

    @abstractmethod
    async def save_ledger_entry(self, entry: ChoreLedgerEntry) -> ChoreLedgerEntry: ...

    @abstractmethod
    async def list_ledger_entries(self, child_user_id: str, limit: int = 10) -> list[ChoreLedgerEntry]: ...

    # Recommendations / approvals
    @abstractmethod
    async def save_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet: ...

    @abstractmethod
    async def get_recommendation_set(self, child_user_id: str) -> Optional[RecommendationSet]: ...

    @abstractmethod
    async def update_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet: ...

    @abstractmethod
    async def save_recommendation_options(
        self,
        recommendation_set_id: str,
        options: list[RecommendationOption],
    ) -> list[RecommendationOption]: ...

    @abstractmethod
    async def list_recommendation_options(self, recommendation_set_id: str) -> list[RecommendationOption]: ...

    @abstractmethod
    async def save_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest: ...

    @abstractmethod
    async def get_approval_request(self, approval_id: str) -> Optional[ApprovalRequest]: ...

    @abstractmethod
    async def get_approval_for_recommendation(self, recommendation_set_id: str) -> Optional[ApprovalRequest]: ...

    @abstractmethod
    async def list_pending_approvals(self, parent_user_id: str | None = None) -> list[ApprovalRequest]: ...

    @abstractmethod
    async def list_approval_requests(
        self,
        parent_user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[ApprovalRequest]: ...

    @abstractmethod
    async def update_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest: ...

    # Calls / traces
    @abstractmethod
    async def save_call_session(self, call: CallSession) -> CallSession: ...

    @abstractmethod
    async def update_call_session(self, call: CallSession) -> CallSession: ...

    @abstractmethod
    async def get_call_session(self, call_id: str) -> Optional[CallSession]: ...

    @abstractmethod
    async def get_call_session_by_vendor_id(self, vendor_call_id: str) -> Optional[CallSession]: ...

    @abstractmethod
    async def list_call_sessions(
        self,
        user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[CallSession]: ...

    @abstractmethod
    async def save_call_event(self, event: CallEvent) -> CallEvent: ...

    @abstractmethod
    async def list_call_events(self, call_session_id: str) -> list[CallEvent]: ...

    @abstractmethod
    async def save_trace(self, trace: TraceSpan) -> TraceSpan: ...

    @abstractmethod
    async def get_traces(self, call_session_id: str | None = None) -> list[TraceSpan]: ...

    # Knowledge
    @abstractmethod
    async def save_knowledge_article(self, article: KnowledgeArticle) -> KnowledgeArticle: ...

    @abstractmethod
    async def search_knowledge_articles(self, query: str, limit: int = 3) -> list[KnowledgeArticle]: ...
