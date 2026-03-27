from __future__ import annotations

import asyncio
from typing import Any, Optional

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

from .base import StorageAdapter

try:
    import psycopg
    from psycopg.rows import dict_row
    from psycopg.types.json import Jsonb
except ImportError:  # pragma: no cover - runtime guarded
    psycopg = None
    dict_row = None
    Jsonb = None


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS households (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    household_id TEXT,
    ghost_user_id TEXT,
    auth_subject TEXT UNIQUE,
    phone_number TEXT,
    avatar_name TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    household_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    balance_cents INTEGER NOT NULL,
    threshold_cents INTEGER NOT NULL,
    coin_balance INTEGER NOT NULL,
    favorite_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS chore_ledger (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL,
    child_user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    coins_earned INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_sets (
    id TEXT PRIMARY KEY,
    child_user_id TEXT NOT NULL UNIQUE,
    household_id TEXT NOT NULL,
    total_value_cents INTEGER NOT NULL,
    threshold_reached BOOLEAN NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    approval_request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendation_options (
    id TEXT PRIMARY KEY,
    recommendation_set_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    allocation_percent INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    rationale TEXT NOT NULL,
    interest_match TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id TEXT PRIMARY KEY,
    recommendation_set_id TEXT NOT NULL UNIQUE,
    child_user_id TEXT NOT NULL,
    parent_user_id TEXT NOT NULL,
    household_id TEXT NOT NULL,
    status TEXT NOT NULL,
    decision_source TEXT NOT NULL,
    resolution_note TEXT NOT NULL DEFAULT '',
    requested_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS call_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    household_id TEXT NOT NULL,
    call_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL,
    recommendation_set_id TEXT,
    approval_request_id TEXT,
    vendor_call_id TEXT UNIQUE,
    transcript TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    last_question TEXT NOT NULL DEFAULT '',
    answer_source TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS call_events (
    id TEXT PRIMARY KEY,
    call_session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS trace_spans (
    id TEXT PRIMARY KEY,
    call_session_id TEXT,
    operation TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    parent_span_id TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
);
"""


class GhostStore(StorageAdapter):
    def __init__(self, database_url: str):
        self.database_url = database_url
        if psycopg is None:
            raise RuntimeError("psycopg is required to use GhostStore")

    async def initialize(self) -> None:
        await self._execute_script(SCHEMA_SQL)

    async def close(self) -> None:
        return None

    async def _execute_script(self, sql: str) -> None:
        def _run() -> None:
            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql)
                conn.commit()

        await asyncio.to_thread(_run)

    async def _fetchone(self, sql: str, params: tuple[Any, ...] = ()) -> Optional[dict]:
        def _run() -> Optional[dict]:
            with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    return cur.fetchone()

        return await asyncio.to_thread(_run)

    async def _fetchall(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict]:
        def _run() -> list[dict]:
            with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    return list(cur.fetchall())

        return await asyncio.to_thread(_run)

    async def _execute(self, sql: str, params: tuple[Any, ...] = ()) -> None:
        def _run() -> None:
            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                conn.commit()

        await asyncio.to_thread(_run)

    async def get_user(self, user_id: str) -> Optional[User]:
        row = await self._fetchone("SELECT * FROM users WHERE id = %s", (user_id,))
        return User(**row) if row else None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        row = await self._fetchone("SELECT * FROM users WHERE email = %s", (email,))
        return User(**row) if row else None

    async def get_user_by_subject(self, subject: str) -> Optional[User]:
        row = await self._fetchone("SELECT * FROM users WHERE auth_subject = %s", (subject,))
        return User(**row) if row else None

    async def save_user(self, user: User) -> User:
        await self._execute(
            """
            INSERT INTO users (
                id, email, name, role, household_id, ghost_user_id, auth_subject,
                phone_number, avatar_name, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                household_id = EXCLUDED.household_id,
                ghost_user_id = EXCLUDED.ghost_user_id,
                auth_subject = EXCLUDED.auth_subject,
                phone_number = EXCLUDED.phone_number,
                avatar_name = EXCLUDED.avatar_name
            """,
            (
                user.id,
                user.email,
                user.name,
                user.role.value,
                user.household_id,
                user.ghost_user_id,
                user.auth_subject,
                user.phone_number,
                user.avatar_name,
                user.created_at,
            ),
        )
        return user

    async def update_user(self, user: User) -> User:
        return await self.save_user(user)

    async def save_session(self, session: Session) -> Session:
        await self._execute(
            """
            INSERT INTO sessions (id, user_id, token, created_at, expires_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (token) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                created_at = EXCLUDED.created_at,
                expires_at = EXCLUDED.expires_at
            """,
            (session.id, session.user_id, session.token, session.created_at, session.expires_at),
        )
        return session

    async def get_session(self, token: str) -> Optional[Session]:
        row = await self._fetchone("SELECT * FROM sessions WHERE token = %s", (token,))
        return Session(**row) if row else None

    async def save_household(self, household: Household) -> Household:
        await self._execute(
            """
            INSERT INTO households (id, name, created_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
            """,
            (household.id, household.name, household.created_at),
        )
        return household

    async def get_household(self, household_id: str) -> Optional[Household]:
        row = await self._fetchone("SELECT * FROM households WHERE id = %s", (household_id,))
        return Household(**row) if row else None

    async def list_household_users(self, household_id: str) -> list[User]:
        rows = await self._fetchall(
            "SELECT * FROM users WHERE household_id = %s ORDER BY created_at ASC",
            (household_id,),
        )
        return [User(**row) for row in rows]

    async def save_profile(self, profile: CustomerProfile) -> CustomerProfile:
        await self._execute(
            """
            INSERT INTO customer_profiles (
                id, user_id, household_id, phone_number, balance_cents,
                threshold_cents, coin_balance, favorite_topics, notes,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                household_id = EXCLUDED.household_id,
                phone_number = EXCLUDED.phone_number,
                balance_cents = EXCLUDED.balance_cents,
                threshold_cents = EXCLUDED.threshold_cents,
                coin_balance = EXCLUDED.coin_balance,
                favorite_topics = EXCLUDED.favorite_topics,
                notes = EXCLUDED.notes,
                updated_at = EXCLUDED.updated_at
            """,
            (
                profile.id,
                profile.user_id,
                profile.household_id,
                profile.phone_number,
                profile.balance_cents,
                profile.threshold_cents,
                profile.coin_balance,
                Jsonb(profile.favorite_topics),
                profile.notes,
                profile.created_at,
                profile.updated_at,
            ),
        )
        return profile

    async def get_profile(self, user_id: str) -> Optional[CustomerProfile]:
        row = await self._fetchone("SELECT * FROM customer_profiles WHERE user_id = %s", (user_id,))
        return CustomerProfile(**row) if row else None

    async def update_profile(self, profile: CustomerProfile) -> CustomerProfile:
        return await self.save_profile(profile)

    async def save_ledger_entry(self, entry: ChoreLedgerEntry) -> ChoreLedgerEntry:
        await self._execute(
            """
            INSERT INTO chore_ledger (
                id, household_id, child_user_id, description, coins_earned,
                amount_cents, completed_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                entry.id,
                entry.household_id,
                entry.child_user_id,
                entry.description,
                entry.coins_earned,
                entry.amount_cents,
                entry.completed_at,
            ),
        )
        return entry

    async def list_ledger_entries(self, child_user_id: str, limit: int = 10) -> list[ChoreLedgerEntry]:
        rows = await self._fetchall(
            """
            SELECT * FROM chore_ledger
            WHERE child_user_id = %s
            ORDER BY completed_at DESC
            LIMIT %s
            """,
            (child_user_id, limit),
        )
        return [ChoreLedgerEntry(**row) for row in rows]

    async def save_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet:
        await self._execute(
            """
            INSERT INTO recommendation_sets (
                id, child_user_id, household_id, total_value_cents, threshold_reached,
                status, summary, approval_request_id, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (child_user_id) DO UPDATE SET
                household_id = EXCLUDED.household_id,
                total_value_cents = EXCLUDED.total_value_cents,
                threshold_reached = EXCLUDED.threshold_reached,
                status = EXCLUDED.status,
                summary = EXCLUDED.summary,
                approval_request_id = EXCLUDED.approval_request_id,
                updated_at = EXCLUDED.updated_at
            """,
            (
                recommendation.id,
                recommendation.child_user_id,
                recommendation.household_id,
                recommendation.total_value_cents,
                recommendation.threshold_reached,
                recommendation.status.value,
                recommendation.summary,
                recommendation.approval_request_id,
                recommendation.created_at,
                recommendation.updated_at,
            ),
        )
        return recommendation

    async def get_recommendation_set(self, child_user_id: str) -> Optional[RecommendationSet]:
        row = await self._fetchone(
            "SELECT * FROM recommendation_sets WHERE child_user_id = %s",
            (child_user_id,),
        )
        return RecommendationSet(**row) if row else None

    async def update_recommendation_set(self, recommendation: RecommendationSet) -> RecommendationSet:
        return await self.save_recommendation_set(recommendation)

    async def save_recommendation_options(
        self,
        recommendation_set_id: str,
        options: list[RecommendationOption],
    ) -> list[RecommendationOption]:
        await self._execute(
            "DELETE FROM recommendation_options WHERE recommendation_set_id = %s",
            (recommendation_set_id,),
        )
        for option in options:
            await self._execute(
                """
                INSERT INTO recommendation_options (
                    id, recommendation_set_id, name, symbol, allocation_percent,
                    risk_level, rationale, interest_match, sort_order
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    option.id,
                    recommendation_set_id,
                    option.name,
                    option.symbol,
                    option.allocation_percent,
                    option.risk_level,
                    option.rationale,
                    option.interest_match,
                    option.sort_order,
                ),
            )
        return options

    async def list_recommendation_options(self, recommendation_set_id: str) -> list[RecommendationOption]:
        rows = await self._fetchall(
            """
            SELECT * FROM recommendation_options
            WHERE recommendation_set_id = %s
            ORDER BY sort_order ASC
            """,
            (recommendation_set_id,),
        )
        return [RecommendationOption(**row) for row in rows]

    async def save_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest:
        await self._execute(
            """
            INSERT INTO approval_requests (
                id, recommendation_set_id, child_user_id, parent_user_id,
                household_id, status, decision_source, resolution_note,
                requested_at, resolved_at, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (recommendation_set_id) DO UPDATE SET
                parent_user_id = EXCLUDED.parent_user_id,
                household_id = EXCLUDED.household_id,
                status = EXCLUDED.status,
                decision_source = EXCLUDED.decision_source,
                resolution_note = EXCLUDED.resolution_note,
                requested_at = EXCLUDED.requested_at,
                resolved_at = EXCLUDED.resolved_at
            """,
            (
                approval.id,
                approval.recommendation_set_id,
                approval.child_user_id,
                approval.parent_user_id,
                approval.household_id,
                approval.status.value,
                approval.decision_source,
                approval.resolution_note,
                approval.requested_at,
                approval.resolved_at,
                approval.created_at,
            ),
        )
        return approval

    async def get_approval_request(self, approval_id: str) -> Optional[ApprovalRequest]:
        row = await self._fetchone("SELECT * FROM approval_requests WHERE id = %s", (approval_id,))
        return ApprovalRequest(**row) if row else None

    async def get_approval_for_recommendation(self, recommendation_set_id: str) -> Optional[ApprovalRequest]:
        row = await self._fetchone(
            "SELECT * FROM approval_requests WHERE recommendation_set_id = %s",
            (recommendation_set_id,),
        )
        return ApprovalRequest(**row) if row else None

    async def list_pending_approvals(self, parent_user_id: str | None = None) -> list[ApprovalRequest]:
        if parent_user_id:
            rows = await self._fetchall(
                """
                SELECT * FROM approval_requests
                WHERE status = 'pending' AND parent_user_id = %s
                ORDER BY created_at DESC
                """,
                (parent_user_id,),
            )
        else:
            rows = await self._fetchall(
                """
                SELECT * FROM approval_requests
                WHERE status = 'pending'
                ORDER BY created_at DESC
                """
            )
        return [ApprovalRequest(**row) for row in rows]

    async def list_approval_requests(
        self,
        parent_user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[ApprovalRequest]:
        clauses = []
        params: list[Any] = []
        if parent_user_id:
            clauses.append("parent_user_id = %s")
            params.append(parent_user_id)
        if household_id:
            clauses.append("household_id = %s")
            params.append(household_id)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = await self._fetchall(
            f"""
            SELECT * FROM approval_requests
            {where}
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (*params, limit),
        )
        return [ApprovalRequest(**row) for row in rows]

    async def update_approval_request(self, approval: ApprovalRequest) -> ApprovalRequest:
        return await self.save_approval_request(approval)

    async def save_call_session(self, call: CallSession) -> CallSession:
        await self._execute(
            """
            INSERT INTO call_sessions (
                id, user_id, household_id, call_type, direction, phone_number,
                status, recommendation_set_id, approval_request_id, vendor_call_id,
                transcript, summary, last_question, answer_source, metadata,
                created_at, started_at, ended_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                phone_number = EXCLUDED.phone_number,
                vendor_call_id = EXCLUDED.vendor_call_id,
                transcript = EXCLUDED.transcript,
                summary = EXCLUDED.summary,
                last_question = EXCLUDED.last_question,
                answer_source = EXCLUDED.answer_source,
                metadata = EXCLUDED.metadata,
                started_at = EXCLUDED.started_at,
                ended_at = EXCLUDED.ended_at,
                updated_at = EXCLUDED.updated_at
            """,
            (
                call.id,
                call.user_id,
                call.household_id,
                call.call_type.value,
                call.direction.value,
                call.phone_number,
                call.status.value,
                call.recommendation_set_id,
                call.approval_request_id,
                call.vendor_call_id,
                call.transcript,
                call.summary,
                call.last_question,
                call.answer_source,
                Jsonb(call.metadata),
                call.created_at,
                call.started_at,
                call.ended_at,
                call.updated_at,
            ),
        )
        return call

    async def update_call_session(self, call: CallSession) -> CallSession:
        return await self.save_call_session(call)

    async def get_call_session(self, call_id: str) -> Optional[CallSession]:
        row = await self._fetchone("SELECT * FROM call_sessions WHERE id = %s", (call_id,))
        return CallSession(**row) if row else None

    async def get_call_session_by_vendor_id(self, vendor_call_id: str) -> Optional[CallSession]:
        row = await self._fetchone(
            "SELECT * FROM call_sessions WHERE vendor_call_id = %s",
            (vendor_call_id,),
        )
        return CallSession(**row) if row else None

    async def list_call_sessions(
        self,
        user_id: str | None = None,
        household_id: str | None = None,
        limit: int = 50,
    ) -> list[CallSession]:
        clauses = []
        params: list[Any] = []
        if user_id:
            clauses.append("user_id = %s")
            params.append(user_id)
        if household_id:
            clauses.append("household_id = %s")
            params.append(household_id)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = await self._fetchall(
            f"""
            SELECT * FROM call_sessions
            {where}
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (*params, limit),
        )
        return [CallSession(**row) for row in rows]

    async def save_call_event(self, event: CallEvent) -> CallEvent:
        await self._execute(
            """
            INSERT INTO call_events (id, call_session_id, event_type, payload, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (event.id, event.call_session_id, event.event_type, Jsonb(event.payload), event.created_at),
        )
        return event

    async def list_call_events(self, call_session_id: str) -> list[CallEvent]:
        rows = await self._fetchall(
            """
            SELECT * FROM call_events
            WHERE call_session_id = %s
            ORDER BY created_at ASC
            """,
            (call_session_id,),
        )
        return [CallEvent(**row) for row in rows]

    async def save_trace(self, trace: TraceSpan) -> TraceSpan:
        await self._execute(
            """
            INSERT INTO trace_spans (
                id, call_session_id, operation, service, status, start_time,
                end_time, duration_ms, metadata, parent_span_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
            """,
            (
                trace.id,
                trace.call_session_id,
                trace.operation,
                trace.service,
                trace.status,
                trace.start_time,
                trace.end_time,
                trace.duration_ms,
                Jsonb(trace.metadata),
                trace.parent_span_id,
            ),
        )
        return trace

    async def get_traces(self, call_session_id: str | None = None) -> list[TraceSpan]:
        if call_session_id:
            rows = await self._fetchall(
                """
                SELECT * FROM trace_spans
                WHERE call_session_id = %s
                ORDER BY start_time DESC
                """,
                (call_session_id,),
            )
        else:
            rows = await self._fetchall(
                "SELECT * FROM trace_spans ORDER BY start_time DESC LIMIT 200"
            )
        return [TraceSpan(**row) for row in rows]

    async def save_knowledge_article(self, article: KnowledgeArticle) -> KnowledgeArticle:
        await self._execute(
            """
            INSERT INTO knowledge_articles (id, title, body, tags, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                body = EXCLUDED.body,
                tags = EXCLUDED.tags
            """,
            (article.id, article.title, article.body, Jsonb(article.tags), article.created_at),
        )
        return article

    async def search_knowledge_articles(self, query: str, limit: int = 3) -> list[KnowledgeArticle]:
        rows = await self._fetchall("SELECT * FROM knowledge_articles ORDER BY created_at DESC")
        query_terms = [term for term in query.lower().split() if term]
        scored: list[tuple[int, dict]] = []
        for row in rows:
            haystack = f"{row['title']} {row['body']} {' '.join(row.get('tags') or [])}".lower()
            score = sum(1 for term in query_terms if term in haystack)
            if score > 0:
                scored.append((score, row))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [KnowledgeArticle(**row) for _, row in scored[:limit]]
