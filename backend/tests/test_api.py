import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "storage" in data["services"]


@pytest.mark.asyncio
async def test_demo_login(client: AsyncClient):
    resp = await client.post("/api/auth/demo-login", json={"email": "maya@demo.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["role"] == "child"
    assert data["token"].startswith("demo-")


@pytest.mark.asyncio
async def test_get_profile(authed_client: AsyncClient):
    resp = await authed_client.get("/api/profile/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "maya@demo.com"
    assert data["profile"]["balance_cents"] >= 5000


@pytest.mark.asyncio
async def test_get_dashboard(authed_client: AsyncClient):
    resp = await authed_client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "child"
    assert data["child"]["recommendations"][0]["recommendation"]["status"] == "approval_pending"


@pytest.mark.asyncio
async def test_get_recommendations(authed_client: AsyncClient):
    resp = await authed_client.get("/api/recommendations/current")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 1
    assert len(data["recommendations"][0]["options"]) == 3


@pytest.mark.asyncio
async def test_manual_approval_update(client: AsyncClient):
    parent = await client.post("/api/auth/demo-login", json={"email": "nina@demo.com"})
    token = parent.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"

    resp = await client.patch(
        "/api/approvals/approval-001",
        json={"status": "approved", "note": "Approved in test", "source": "test"},
    )
    assert resp.status_code == 200
    assert resp.json()["approval"]["status"] == "approved"
