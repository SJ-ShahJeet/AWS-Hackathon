from __future__ import annotations

from datetime import timedelta

from app.schemas.models import (
    ApprovalRequest,
    CallDirection,
    CallEvent,
    CallSession,
    CallStatus,
    CallType,
    ChoreLedgerEntry,
    CustomerProfile,
    Household,
    KnowledgeArticle,
    RecommendationOption,
    RecommendationSet,
    RecommendationStatus,
    TraceSpan,
    User,
    UserRole,
    now,
)
from app.storage.base import StorageAdapter


HOUSEHOLD = Household(id="household-hart", name="Hart Family")

USERS = [
    User(
        id="user-maya",
        email="maya@demo.com",
        name="Maya Hart",
        role=UserRole.CHILD,
        household_id=HOUSEHOLD.id,
        phone_number="+14155550127",
    ),
    User(
        id="user-nina",
        email="nina@demo.com",
        name="Nina Hart",
        role=UserRole.PARENT,
        household_id=HOUSEHOLD.id,
        phone_number="+14155550128",
    ),
    User(
        id="user-admin",
        email="ops@demo.com",
        name="Penny Ops",
        role=UserRole.ADMIN,
        household_id="ops-hq",
        phone_number="+14155550129",
    ),
]

PROFILES = [
    CustomerProfile(
        id="profile-maya",
        user_id="user-maya",
        household_id=HOUSEHOLD.id,
        phone_number="+14155550127",
        balance_cents=6300,
        threshold_cents=5000,
        coin_balance=630,
        favorite_topics=["space", "animals", "technology"],
        notes="Maya likes friendly, simple explanations and asks follow-up questions.",
    ),
    CustomerProfile(
        id="profile-nina",
        user_id="user-nina",
        household_id=HOUSEHOLD.id,
        phone_number="+14155550128",
        balance_cents=0,
        threshold_cents=5000,
        coin_balance=0,
        favorite_topics=["family budgeting"],
        notes="Parent account controls final approval.",
    ),
]

LEDGER = [
    ChoreLedgerEntry(
        id="ledger-001",
        household_id=HOUSEHOLD.id,
        child_user_id="user-maya",
        description="Loaded the dishwasher for a week",
        coins_earned=140,
        amount_cents=1400,
        completed_at=now() - timedelta(days=10),
    ),
    ChoreLedgerEntry(
        id="ledger-002",
        household_id=HOUSEHOLD.id,
        child_user_id="user-maya",
        description="Walked the dog every morning",
        coins_earned=120,
        amount_cents=1200,
        completed_at=now() - timedelta(days=7),
    ),
    ChoreLedgerEntry(
        id="ledger-003",
        household_id=HOUSEHOLD.id,
        child_user_id="user-maya",
        description="Helped organize the garage",
        coins_earned=180,
        amount_cents=1800,
        completed_at=now() - timedelta(days=5),
    ),
    ChoreLedgerEntry(
        id="ledger-004",
        household_id=HOUSEHOLD.id,
        child_user_id="user-maya",
        description="Folded laundry and sorted socks",
        coins_earned=90,
        amount_cents=900,
        completed_at=now() - timedelta(days=2),
    ),
    ChoreLedgerEntry(
        id="ledger-005",
        household_id=HOUSEHOLD.id,
        child_user_id="user-maya",
        description="Cleaned the backyard table",
        coins_earned=100,
        amount_cents=1000,
        completed_at=now() - timedelta(days=1),
    ),
]

RECOMMENDATION = RecommendationSet(
    id="reco-001",
    child_user_id="user-maya",
    household_id=HOUSEHOLD.id,
    total_value_cents=6300,
    threshold_reached=True,
    status=RecommendationStatus.APPROVAL_PENDING,
    summary="Penny built a simple starter mix focused on big companies, broad diversification, and one calmer option.",
)

RECOMMENDATION_OPTIONS = [
    RecommendationOption(
        id="opt-001",
        recommendation_set_id=RECOMMENDATION.id,
        name="Vanguard S&P 500 ETF",
        symbol="VOO",
        allocation_percent=40,
        risk_level="medium",
        rationale="Lets Maya own tiny pieces of many well-known companies she already recognizes.",
        interest_match="Matches her curiosity about technology and brands she sees every day.",
        sort_order=0,
    ),
    RecommendationOption(
        id="opt-002",
        recommendation_set_id=RECOMMENDATION.id,
        name="Fidelity ZERO Total Market Index Fund",
        symbol="FZROX",
        allocation_percent=35,
        risk_level="medium",
        rationale="Covers a broader slice of the stock market and reinforces diversification.",
        interest_match="Good fit for long-term learning about compound growth.",
        sort_order=1,
    ),
    RecommendationOption(
        id="opt-003",
        recommendation_set_id=RECOMMENDATION.id,
        name="iShares Core U.S. Aggregate Bond ETF",
        symbol="AGG",
        allocation_percent=25,
        risk_level="low",
        rationale="Adds a steadier piece so the portfolio feels less bumpy for a first investment.",
        interest_match="Supports the parent goal of keeping risk understandable and age-appropriate.",
        sort_order=2,
    ),
]

APPROVAL = ApprovalRequest(
    id="approval-001",
    recommendation_set_id=RECOMMENDATION.id,
    child_user_id="user-maya",
    parent_user_id="user-nina",
    household_id=HOUSEHOLD.id,
    decision_source="system",
)

CALLS = [
    CallSession(
        id="call-001",
        user_id="user-maya",
        household_id=HOUSEHOLD.id,
        call_type=CallType.SUPPORT,
        direction=CallDirection.OUTBOUND,
        phone_number="+14155550127",
        status=CallStatus.COMPLETED,
        recommendation_set_id=RECOMMENDATION.id,
        transcript="Maya asked how her virtual coins become real investing dollars and whether Penny picked safe options.",
        summary="Explained the $50 threshold, broad-index fund idea, and why a bond ETF is included for balance.",
        answer_source="ghost+nim",
        created_at=now() - timedelta(hours=6),
        started_at=now() - timedelta(hours=6),
        ended_at=now() - timedelta(hours=6, minutes=-4),
        updated_at=now() - timedelta(hours=6, minutes=-4),
    ),
    CallSession(
        id="call-002",
        user_id="user-nina",
        household_id=HOUSEHOLD.id,
        call_type=CallType.APPROVAL,
        direction=CallDirection.OUTBOUND,
        phone_number="+14155550128",
        status=CallStatus.QUEUED,
        recommendation_set_id=RECOMMENDATION.id,
        approval_request_id=APPROVAL.id,
        summary="Parent approval call queued for Nina Hart.",
        created_at=now() - timedelta(minutes=30),
        updated_at=now() - timedelta(minutes=30),
    ),
]

CALL_EVENTS = [
    CallEvent(
        id="event-001",
        call_session_id="call-001",
        event_type="question_answered",
        payload={
            "question": "How do my chore coins turn into investing money?",
            "answer": "Your chores add up in your Penny balance. Once you pass $50, Penny helps turn that into a parent-approved starter investment plan.",
        },
    ),
    CallEvent(
        id="event-002",
        call_session_id="call-002",
        event_type="approval_queued",
        payload={
            "approval_request_id": APPROVAL.id,
            "message": "Approval call is ready to dial the parent.",
        },
    ),
]

KNOWLEDGE = [
    KnowledgeArticle(
        id="kb-001",
        title="How Penny uses the $50 threshold",
        body="When a child reaches at least $50 in virtual chore earnings, Penny can explain a starter investment mix and ask the parent for approval before anything moves forward.",
        tags=["threshold", "balance", "approval"],
    ),
    KnowledgeArticle(
        id="kb-002",
        title="Why Penny suggests diversified starter options",
        body="Penny favors simple diversified funds and calmer balancing assets so the child learns long-term investing without overconcentrating in one company.",
        tags=["diversification", "funds", "risk"],
    ),
    KnowledgeArticle(
        id="kb-003",
        title="Parent safety controls",
        body="Parents remain in control. Approval can happen by phone or manually in the dashboard, and a declined recommendation does not invest anything.",
        tags=["parent", "approval", "safety"],
    ),
]


async def seed_data(store: StorageAdapter) -> None:
    await store.save_household(HOUSEHOLD)

    for user in USERS:
        await store.save_user(user)

    for profile in PROFILES:
        await store.save_profile(profile)

    for entry in LEDGER:
        await store.save_ledger_entry(entry)

    await store.save_recommendation_set(RECOMMENDATION)
    await store.save_recommendation_options(RECOMMENDATION.id, RECOMMENDATION_OPTIONS)
    await store.save_approval_request(APPROVAL)

    for call in CALLS:
        await store.save_call_session(call)

    for event in CALL_EVENTS:
        await store.save_call_event(event)

    for article in KNOWLEDGE:
        await store.save_knowledge_article(article)

    for call in CALLS:
        await store.save_trace(
            TraceSpan(
                id=f"trace-{call.id}",
                call_session_id=call.id,
                operation=f"{call.call_type.value}_call_seed",
                service="seed",
                status="ok",
                duration_ms=500,
                metadata={"status": call.status.value},
            )
        )
