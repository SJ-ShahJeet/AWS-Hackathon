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
