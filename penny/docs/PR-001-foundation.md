# PR #001 — Penny Foundation: Vite + FastAPI Scaffold

## Summary

Sets up the complete project foundation for Penny — an AI financial literacy platform for kids.

### What's in this PR

**Backend (FastAPI)**
- `backend/main.py` — FastAPI app with CORS, router mounts, `/health` endpoint
- `backend/models.py` — Pydantic request/response models for all endpoints
- `backend/routers/chores.py` — 3 endpoints: `/approve`, `/reject`, `/submit-proof`
- `backend/routers/investments.py` — 2 endpoints: `/approve`, `/reject` (returns negotiation data)
- `backend/lib/ghost.py` — Ghost Admin API client (stubbed for demo, real calls wired in)
- `backend/lib/logger.py` — Structured JSON logger used in every route
- `backend/requirements.txt` — fastapi, uvicorn, httpx, pydantic, python-jose

**Frontend (Vite + React + Tailwind)**
- `frontend/src/App.tsx` — React Router, role-based routing (parent/child), demo session storage
- `frontend/src/pages/Login.tsx` — Auth0 button + demo shortcuts (no login needed for demo)
- `frontend/src/pages/ParentDashboard.tsx` — full parent view with balance, chores, investments
- `frontend/src/pages/ChildDashboard.tsx` — child view with coin balance, Penny avatar, chores
- `frontend/src/components/parent/` — ChoreList, InvestmentApproval, NegotiationResult, Portfolio, WeeklyReport
- `frontend/src/components/child/` — CoinBalance, PennyAvatar, ChoreTracker, ChoreProofUpload, Portfolio
- `frontend/src/lib/mockData.ts` — all demo data (Sophie, chores, investment, negotiation)
- `frontend/src/lib/api.ts` — typed fetch wrappers to FastAPI

**Docs & Config**
- `CHECKLIST.md` — autonomous build checklist with test criteria per item
- `docs/schema.md` — Ghost data model + TypeScript types
- `docs/agent-boundaries.md` — what each agent team owns
- `docs/demo-flow.md` — 10-step demo script

### Tests Passed
- ✅ `tsc --noEmit` — zero type errors
- ✅ `uvicorn main:app` starts, `/health` → 200
- ✅ `POST /api/chores/approve` → `{"success":true}`
- ✅ `POST /api/investments/reject` → `{"success":true,"data":{"negotiationData":{...}}}`
- ✅ `npm run dev` starts on :5173, HTTP 200

### Demo Flow Supported
1. `/login` → click "Parent View" → `/parent`
2. Parent sees Sophie at $47.50, 2 pending chores
3. Approve both chores → balance hits $50 → threshold banner + investment card unlocks
4. Reject Nike investment → type reason → NegotiationResult (confidence 72, child argument, warning)
5. `/login` → click "Child View" → `/child`
6. Sophie sees coin balance, Penny avatar placeholder, chore tracker, empty portfolio

### How to Run

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## What's NOT in this PR (future PRs)

| Feature | PR |
|---|---|
| Real Auth0 JWT validation | PR #002 |
| Real Ghost API writes | PR #003 |
| Tavus URL (from Person B) | PR #004 |
| Stock price feed | PR #005 |
| Image storage (S3) | PR #006 |
| Screenshot validation agent | PR #007 |

---

## Reviewers
- Person B: check `VITE_TAVUS_CONVERSATION_URL` in `frontend/.env.example` — fill this in for PR #004
- Backend agent: own `backend/` folder for future PRs
- Frontend agent: own `frontend/src/` for future PRs
