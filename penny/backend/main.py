"""
Penny — FastAPI Application Entry Point
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chores, investments
from lib.logger import logger

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

# Routers
app.include_router(chores.router)
app.include_router(investments.router)


@app.get("/health")
async def health():
    logger.info("[API][health] ping")
    return {"status": "ok", "service": "penny-api"}


@app.on_event("startup")
async def startup():
    logger.info("[PENNY] API starting up", extra={"frontend_url": frontend_url})
    from lib.db import run_migrations, close_pool
    await run_migrations()


@app.on_event("shutdown")
async def shutdown():
    from lib.db import close_pool
    await close_pool()
