import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.storage import store
from app.services.seed import seed_data


@pytest_asyncio.fixture
async def seeded_store():
    await seed_data(store)
    return store


@pytest_asyncio.fixture
async def client(seeded_store):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def authed_client(client: AsyncClient):
    resp = await client.post("/api/auth/demo-login", json={"email": "maya@demo.com"})
    token = resp.json()["token"]
    client.headers["Authorization"] = f"Bearer {token}"
    yield client
