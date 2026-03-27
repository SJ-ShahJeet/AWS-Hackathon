# RootCause Relay

**Empathetic support-to-engineering deep agent** — not a chatbot wrapper.

A frustrated user reports a product issue. The system understands their emotional state, diagnoses the technical root cause, creates an engineering artifact with evidence, and returns a grounded, empathetic user-facing update. All autonomously.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit if needed (works as-is for demo)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Edit if needed
npm run dev
```

### 3. Open

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Demo Accounts

| Email | Name | Role | Default View |
|-------|------|------|-------------|
| alice@demo.com | Alice Chen | Customer | Issue intake + tracking |
| bob@demo.com | Bob Martinez | Customer | Issue intake + tracking |
| support@demo.com | Sam Support | Support | Dashboard with filters |
| engineer@demo.com | Eva Engineer | Engineer | Technical investigation |
| admin@demo.com | Ada Admin | Admin | Observability + traces |

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   FastAPI API    │────▶│  Agent Engine    │
│  Next.js 14  │◀────│  REST + SSE     │◀────│  Orchestrator    │
│  TypeScript  │     │  Pydantic       │     │  Tool Adapters   │
│  Tailwind    │     │  Typed schemas  │     │  Trace/Verify    │
└─────────────┘     └─────────────────┘     └──────────────────┘
                           │                        │
                    ┌──────┴──────┐          ┌──────┴──────┐
                    │  Storage    │          │  Adapters   │
                    │  In-Memory  │          │  (Mocked)   │
                    │  (Aero-     │          │  LLM, Auth  │
                    │   spike     │          │  Code, Spec │
                    │   ready)    │          │  KB, Voice  │
                    └─────────────┘          └─────────────┘
```

## What Makes This a Deep Agent

1. **Task Decomposition** — Breaks complaints into emotional state, severity, product area, missing info
2. **Tool Routing** — Routes to different adapters: auth, knowledge base, code insight, spec gen
3. **Multi-Step Execution** — 12+ sequential steps with retry logic and state persistence
4. **Memory/State** — Every step output is stored, traceable, and queryable
5. **Verification** — Checks all steps completed before marking resolved; escalates on low confidence
6. **Graceful Fallback** — Retries failed steps (2x), escalates if confidence < 50%
7. **Operational Empathy** — Generates user updates that acknowledge frustration, explain next steps, and never over-promise

## Sponsor Integration Mapping

| Sponsor | Integration Point | Current Implementation |
|---------|------------------|----------------------|
| **Anthropic / AWS** | LLM Planner — complaint analysis, plan generation, empathetic responses | Mock with realistic NLP heuristics |
| **Okta** | Auth — demo login, token validation, role-based access | Mock with demo accounts |
| **Bland** | Voice — transcript webhook, call processing | Mock with transcript cleaning |
| **Macroscope** | Code Insight — code area analysis, recent changes, failure modes | Mock with realistic code knowledge base |
| **Kiro** | Spec Generation — engineering specs, fix plans, task breakdown | Mock with template-based generation |
| **Airbyte** | Ticketing/Actions — ticket creation, external connectors | Mock with ticket ID generation |
| **Aerospike** | Storage — issue state, agent memory, workflow persistence | In-memory store (same interface) |
| **TrueFoundry** | Observability — trace spans, metrics, execution graphs | Mock with structured logging |
| **Overmind** | Optimization — prompt/policy tuning hooks | Interface defined, mock adapter |

Every adapter has a clean abstract interface (`backend/app/adapters/base.py`). Swap in real implementations by implementing the interface.

## Seeded Demo Data

5 pre-loaded issues that demonstrate different scenarios:

1. **Duplicate charge after checkout retry** — billing, high severity, resolved with full artifact
2. **Promo code breaks checkout** — checkout, high severity, resolved with full artifact
3. **Password reset email missing** — auth, high severity, mid-execution
4. **File upload silently fails** — file-management, critical, analyzing phase
5. **Billing page crashes on mobile** — UI, medium severity, intake (ready to run)

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── adapters/       # Tool adapter interfaces + mock implementations
│   │   ├── agent/          # Orchestrator — the deep agent engine
│   │   ├── api/            # FastAPI route handlers
│   │   ├── core/           # Config, logging
│   │   ├── schemas/        # Pydantic data models + API models
│   │   ├── services/       # Business logic, auth, seed data
│   │   ├── storage/        # Storage abstraction + in-memory impl
│   │   ├── tracing/        # Trace/observability utilities
│   │   └── main.py         # FastAPI app entry
│   ├── tests/              # pytest async tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   │   ├── page.tsx          # Landing
│   │   │   ├── login/            # Demo login
│   │   │   ├── issues/           # Issue intake + detail
│   │   │   ├── dashboard/        # Support dashboard
│   │   │   ├── engineer/         # Engineer investigation
│   │   │   ├── admin/            # Admin observability
│   │   │   └── not-found.tsx     # 404
│   │   ├── components/
│   │   │   ├── layout/     # Navbar, Providers
│   │   │   ├── issues/     # Composer, Timeline, Artifact, List
│   │   │   ├── shared/     # Status/Severity/Emotion badges, Confidence meter, Skeletons
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── lib/            # API client, utilities
│   │   └── store/          # Zustand auth store
│   ├── .env.example
│   └── package.json
├── docs/
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/demo-login` — Demo login with email
- `GET /api/auth/me` — Get current user

### Issues
- `POST /api/issues/intake` — Submit new issue
- `GET /api/issues` — List issues (filterable)
- `GET /api/issues/{id}` — Issue detail with messages
- `GET /api/issues/{id}/timeline` — Agent plan + steps
- `POST /api/issues/{id}/run-agent` — Trigger agent workflow
- `POST /api/issues/{id}/retry-step` — Retry a failed step
- `POST /api/issues/{id}/escalate` — Manual escalation

### Artifacts
- `GET /api/issues/{id}/artifact` — Engineering artifact
- `POST /api/issues/{id}/artifact/regenerate` — Re-run analysis

### Voice/Webhooks
- `POST /api/webhooks/bland/transcript` — Bland voice transcript

### Observability
- `GET /api/traces` — All traces
- `GET /api/traces/{id}` — Issue-specific traces
- `GET /api/traces/{id}/graph` — Execution graph
- `GET /api/health` — System health

### Live Updates
- `GET /api/issues/{id}/stream` — SSE endpoint

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all variables. The app runs fully in demo mode without any real API keys.

## Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

12 tests covering:
- Health check
- Auth flow (login, me, unauthorized)
- Issue CRUD (list, detail, intake, 404)
- Timeline and artifact retrieval
- Full orchestration flow (intake → analysis → plan → execute → verify → artifact)
- SSE callback capture

## Key Design Decisions

- **Adapter pattern everywhere** — every external service is behind an interface, making sponsor API integration a matter of implementing one class
- **Realistic mock data** — not lorem ipsum; actual plausible issue scenarios, code areas, team names, and failure modes
- **Background task execution** — agent runs asynchronously, UI polls for updates
- **Empathy is computed** — the system detects emotional state and adjusts language accordingly, never using generic platitudes
- **Confidence-driven escalation** — if the agent isn't confident enough, it escalates rather than guessing
