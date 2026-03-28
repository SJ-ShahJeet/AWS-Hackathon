"""
Penny — PostgreSQL Database Layer (Ghost/Timescale)
All DB reads/writes go through here.
"""
import os
import asyncpg
from lib.logger import logger

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        url = os.getenv("DATABASE_URL", "")
        logger.info("[DB] connecting to Ghost/Timescale")
        _pool = await asyncpg.create_pool(url, ssl="require", min_size=1, max_size=5)
        logger.info("[DB] pool created")
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ── Schema ────────────────────────────────────────────────────────────────────

CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS families (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    auth0_sub   TEXT UNIQUE NOT NULL,
    email       TEXT,
    role        TEXT NOT NULL,
    family_id   TEXT NOT NULL REFERENCES families(id),
    display_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO families (id, name) VALUES ('shah-family', 'Shah Family')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, auth0_sub, email, role, family_id, display_name)
VALUES ('sophie-001', 'pending-child', 'child@penny.com', 'child', 'shah-family', 'Sophie')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, auth0_sub, email, role, family_id, display_name)
VALUES ('parent-001', 'pending-parent', 'parent@penny.com', 'parent', 'shah-family', 'Parent')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS chores (
    id          TEXT PRIMARY KEY,
    child_id    TEXT NOT NULL,
    title       TEXT NOT NULL,
    reward      NUMERIC(10,2) NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    planned_date TEXT,
    proof_image_url TEXT,
    parent_note TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
    id              TEXT PRIMARY KEY,
    child_id        TEXT NOT NULL,
    ticker          TEXT NOT NULL,
    company_name    TEXT NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    shares          NUMERIC(12,6) NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending',
    risk            TEXT NOT NULL DEFAULT 'Moderate',
    projected_return TEXT NOT NULL DEFAULT '8%',
    parent_reason   TEXT,
    negotiation_data JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id              SERIAL PRIMARY KEY,
    child_id        TEXT NOT NULL,
    ticker          TEXT NOT NULL,
    company_name    TEXT NOT NULL,
    shares          NUMERIC(12,6) NOT NULL,
    purchase_price  NUMERIC(10,2) NOT NULL,
    current_price   NUMERIC(10,2) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(child_id, ticker)
);

CREATE TABLE IF NOT EXISTS child_balances (
    child_id    TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    balance     NUMERIC(10,2) NOT NULL DEFAULT 0,
    threshold   NUMERIC(10,2) NOT NULL DEFAULT 50,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO child_balances (child_id, name, balance, threshold)
VALUES ('sophie-001', 'Sophie', 47.50, 50.00)
ON CONFLICT (child_id) DO NOTHING;
"""


async def run_migrations():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES)
    logger.info("[DB] migrations complete")


# ── Chores ────────────────────────────────────────────────────────────────────

async def insert_chore(chore: dict) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO chores (id, child_id, title, reward, status, description, planned_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        """, chore["id"], chore["child_id"], chore["title"],
            chore["reward"], chore.get("status", "pending"),
            chore.get("description"), chore.get("planned_date"))
        return dict(row)


async def get_chores(child_id: str) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM chores WHERE child_id = $1 ORDER BY created_at DESC",
            child_id
        )
        return [dict(r) for r in rows]


async def update_chore_status(chore_id: str, status: str, parent_note: str | None = None) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE chores
            SET status = $1, parent_note = COALESCE($2, parent_note), updated_at = NOW()
            WHERE id = $3
            RETURNING *
        """, status, parent_note, chore_id)
        return dict(row) if row else {}


async def approve_chore_atomic(chore_id: str, reward: float) -> dict:
    """Approve chore and update balance in a single transaction."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            chore = await conn.fetchrow("""
                UPDATE chores
                SET status = 'approved', updated_at = NOW()
                WHERE id = $1 AND status = 'pending'
                RETURNING *
            """, chore_id)
            if not chore:
                raise ValueError(f"Chore {chore_id} not found or already processed")

            balance_row = await conn.fetchrow("""
                UPDATE child_balances
                SET balance = balance + $1, updated_at = NOW()
                WHERE child_id = $2
                RETURNING balance
            """, reward, chore["child_id"])

            new_balance = float(balance_row["balance"]) if balance_row else 0.0
            return {
                "chore": dict(chore),
                "child_id": chore["child_id"],
                "new_balance": new_balance,
            }


async def update_chore_proof(chore_id: str, proof_url: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE chores SET proof_image_url = $1, updated_at = NOW()
            WHERE id = $2 RETURNING *
        """, proof_url, chore_id)
        return dict(row) if row else {}


# ── Balance ───────────────────────────────────────────────────────────────────

async def get_balance(child_id: str) -> float:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT balance FROM child_balances WHERE child_id = $1", child_id
        )
        return float(row["balance"]) if row else 0.0


async def add_to_balance(child_id: str, amount: float) -> float:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE child_balances
            SET balance = balance + $1, updated_at = NOW()
            WHERE child_id = $2
            RETURNING balance
        """, amount, child_id)
        return float(row["balance"]) if row else 0.0


# ── Investments ───────────────────────────────────────────────────────────────

async def insert_investment(inv: dict) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO investments
            (id, child_id, ticker, company_name, amount, shares, status, risk, projected_return)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        """, inv["id"], inv["child_id"], inv["ticker"], inv["company_name"],
            inv["amount"], inv.get("shares", 0), inv.get("status", "pending"),
            inv.get("risk", "Moderate"), inv.get("projected_return", "8%"))
        return dict(row)


async def update_investment_status(inv_id: str, status: str,
                                    parent_reason: str | None = None,
                                    negotiation_data: dict | None = None) -> dict:
    import json
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            UPDATE investments
            SET status = $1,
                parent_reason = COALESCE($2, parent_reason),
                negotiation_data = COALESCE($3::jsonb, negotiation_data)
            WHERE id = $4
            RETURNING *
        """, status, parent_reason,
            json.dumps(negotiation_data) if negotiation_data else None,
            inv_id)
        return dict(row) if row else {}


async def upsert_portfolio_holding(child_id: str, ticker: str, company_name: str,
                                    shares: float, purchase_price: float) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO portfolio_holdings (child_id, ticker, company_name, shares, purchase_price, current_price)
            VALUES ($1, $2, $3, $4, $5, $5)
            ON CONFLICT (child_id, ticker)
            DO UPDATE SET
                shares = portfolio_holdings.shares + EXCLUDED.shares,
                current_price = EXCLUDED.current_price,
                updated_at = NOW()
            RETURNING *
        """, child_id, ticker, company_name, shares, purchase_price)
        return dict(row) if row else {}


async def get_portfolio(child_id: str) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM portfolio_holdings WHERE child_id = $1 ORDER BY updated_at DESC",
            child_id
        )
        return [dict(r) for r in rows]


# ── Users ────────────────────────────────────────────────────────────────────

async def upsert_user(auth0_sub: str, email: str | None, role: str,
                       family_id: str = "shah-family") -> dict:
    """Create or update a user on first login. Returns user row."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Try to find by auth0_sub first
        existing = await conn.fetchrow(
            "SELECT * FROM users WHERE auth0_sub = $1", auth0_sub
        )
        if existing:
            return dict(existing)

        # Try to find by email (seed rows have placeholder auth0_sub)
        if email:
            by_email = await conn.fetchrow(
                "SELECT * FROM users WHERE email = $1", email
            )
            if by_email:
                await conn.execute(
                    "UPDATE users SET auth0_sub = $1 WHERE id = $2",
                    auth0_sub, by_email["id"]
                )
                return dict(by_email)

        # Completely new user — create
        user_id = f"{role}-{auth0_sub.split('|')[-1][:8]}"
        row = await conn.fetchrow("""
            INSERT INTO users (id, auth0_sub, email, role, family_id, display_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, user_id, auth0_sub, email, role, family_id,
            email.split('@')[0] if email else role)

        if role == "child":
            await conn.execute("""
                INSERT INTO child_balances (child_id, name, balance, threshold)
                VALUES ($1, $2, 0, 50.00)
                ON CONFLICT (child_id) DO NOTHING
            """, user_id, email.split('@')[0] if email else "Child")

        return dict(row)


async def get_user_by_sub(auth0_sub: str) -> dict | None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE auth0_sub = $1", auth0_sub
        )
        return dict(row) if row else None


async def get_children_for_parent(parent_id: str) -> list[dict]:
    """Get all children in the same family as the given parent."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT u.* FROM users u
            JOIN users parent ON parent.family_id = u.family_id
            WHERE parent.id = $1 AND u.role = 'child'
        """, parent_id)
        return [dict(r) for r in rows]
