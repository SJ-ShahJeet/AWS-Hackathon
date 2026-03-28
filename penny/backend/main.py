"""
Penny — FastAPI Application Entry Point
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import chores, investments
from lib.logger import logger
from lib.auth import verify_token

load_dotenv()

app = FastAPI(title="Penny API", version="1.0.0")

# CORS — allow Vite dev server
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Penny core routers
app.include_router(chores.router)
app.include_router(investments.router)

# Customer-care routers
from care.api.calls import router as care_calls_router
from care.api.dashboard import router as care_dashboard_router
from care.api.profile import router as care_profile_router
from care.api.observability import router as care_observability_router
from care.api.webhooks import router as care_webhooks_router
from care.api.auth import router as care_auth_router

app.include_router(care_auth_router)
app.include_router(care_calls_router)
app.include_router(care_dashboard_router)
app.include_router(care_profile_router)
app.include_router(care_observability_router)
app.include_router(care_webhooks_router)


@app.get("/health")
async def health():
    logger.info("[API][health] ping")
    return {"status": "ok", "service": "penny-api"}


@app.get("/api/me")
async def get_me(payload: dict = Depends(verify_token)):
    """Return current user identity, creating on first login."""
    from lib.db import upsert_user, get_children_for_parent
    sub = payload.get("sub", "")
    email = payload.get("https://penny-app/email", "") or payload.get("email", "")
    roles = payload.get("https://penny-app/roles", [])
    role = "parent" if "parent" in roles else "child" if "child" in roles else "unknown"

    user = await upsert_user(auth0_sub=sub, email=email, role=role)
    result = {
        "id": user["id"],
        "role": user["role"],
        "family_id": user["family_id"],
        "display_name": user.get("display_name", ""),
        "email": user.get("email", ""),
    }
    if role == "parent":
        children = await get_children_for_parent(user["id"])
        result["children"] = [
            {"id": c["id"], "display_name": c.get("display_name", "")}
            for c in children
        ]
    return {"success": True, "data": result}


@app.on_event("startup")
async def startup():
    logger.info("[PENNY] API starting up", extra={"frontend_url": frontend_url})
    from lib.db import run_migrations
    await run_migrations()
    # Seed customer-care demo data
    from care.services.seed import seed_data
    from care.storage import store as care_store
    await seed_data(care_store)
    logger.info("[PENNY] customer-care demo data seeded")


@app.on_event("shutdown")
async def shutdown():
    from lib.db import close_pool
    await close_pool()
