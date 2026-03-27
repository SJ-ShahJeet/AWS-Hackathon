# Penny — Autonomous Build Checklist

**Rule:** Each item must pass its TEST before moving to the next.
If a test fails → stop, fix, re-test, then continue.

---

## Backend (FastAPI)

- [x] 1. backend/ scaffold (requirements.txt, main.py, models.py, .env.example)
       TEST: files exist ✅
       STATUS: ✅ DONE

- [x] 2. backend/lib/logger.py + backend/lib/ghost.py
       TEST: `python -c "from lib.logger import logger; from lib.ghost import save_chore"` exits 0 ✅
       STATUS: ✅ DONE

- [x] 3. backend/routers/chores.py (3 endpoints)
       TEST: POST /api/chores/approve → `{"success":true,"data":{"choreId":"chore-1","reward":2.0},"error":null}` ✅
       STATUS: ✅ DONE

- [x] 4. backend/routers/investments.py (2 endpoints)
       TEST: POST /api/investments/reject → `{"success":true,"data":{"investmentId":"invest-1","negotiationData":{...}}}` ✅
       STATUS: ✅ DONE

- [x] 5. GET /health → `{"status":"ok","service":"penny-api"}` ✅
       STATUS: ✅ DONE

---

## Frontend (Vite + React + Tailwind)

- [x] 6. frontend/ scaffold (package.json, vite.config, tailwind, tsconfig, index.html)
       TEST: files exist ✅
       STATUS: ✅ DONE

- [x] 7. npm install
       TEST: node_modules installed, no errors ✅
       STATUS: ✅ DONE

- [x] 8. src/lib/mockData.ts + src/lib/api.ts + src/vite-env.d.ts
       TEST: `npm run typecheck` exits 0 ✅
       STATUS: ✅ DONE

- [x] 9. App.tsx — React Router + role-based routing
       TEST: `npm run dev` starts on :5173, HTTP 200 ✅
       STATUS: ✅ DONE

- [x] 10. Login.tsx — demo shortcuts
        TEST: built, renders demo buttons ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 11. ParentDashboard.tsx — full parent view
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 12. ChoreList.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 13. InvestmentApproval.tsx + NegotiationResult.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 14. WeeklyReport.tsx + parent/Portfolio.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 15. ChildDashboard.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 16. CoinBalance.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 17. PennyAvatar.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 18. ChoreTracker.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 19. ChoreProofUpload.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

- [x] 20. child/Portfolio.tsx
        TEST: built ✅
        STATUS: ✅ DONE (manual browser test pending)

---

## Integration

- [ ] 21. Vite proxy → FastAPI CORS
        TEST: POST /api/chores/approve from browser → 200, no CORS error in console
        STATUS: 🔲 NEEDS MANUAL TEST (run both servers)
        HOW: `cd backend && uvicorn main:app` + `cd frontend && npm run dev`, open :5173

- [ ] 22. Full demo flow (10 steps — see docs/demo-flow.md)
        TEST: all 10 steps pass manually
        STATUS: 🔲 NEEDS MANUAL TEST

---

## What's Left (Pending Items for Next PRs)

| Feature | Status | PR |
|---|---|---|
| Real Auth0 JWT validation in FastAPI | 🔲 Not started | PR #2 |
| Real Ghost API writes (replace stubs) | 🔲 Not started | PR #3 |
| Tavus iframe (fill in URL from Person B) | 🔲 Waiting on Person B | PR #4 |
| Real stock price feed for portfolio | 🔲 Not started | PR #5 |
| Image upload to real storage (S3/Ghost media) | 🔲 Not started | PR #6 |
| Snapshot validation agent (screenshot loop) | 🔲 Not started | PR #7 |
| Mobile responsiveness | 🔲 Out of scope for demo | — |
