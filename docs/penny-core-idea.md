# Penny — AI Voice Financial Literacy Agent for Kids
## Core Idea, Architecture & Build Plan

---

## The One-Liner
> *Penny turns chores into compound interest.*

## The Tagline
> *Your kid's first $50 is the most important investment you'll ever make.*

## The Problem
The average millionaire started investing at 14. The average American starts at 33.
That's 19 years of compound interest — gone.
Most kids learn about money too late. By the time they get their first job, the habits are already set. Existing tools (Greenlight, BusyKid) show dashboards — nobody talks to the kid.

---

## What Penny Does

### Core Loop
1. Kid completes chores → parent approves → earns virtual coins
2. Balance tracked in real-time (Aerospike)
3. At **$50 threshold** → Penny activates (video avatar via Tavus CVI)
4. Penny talks to kid as a **friend first** — detects interests from conversation
5. Portfolio Agent suggests **3 investment options** based on interests + risk profile
6. Kid picks one → **parent approval** requested via Bland phone call
7. Parent approves → trade executed (simulated)
8. Parent rejects → must give a reason → **Negotiation Agent** runs analysis
9. Analysis + reason fed back to kid as a learning moment
10. **Risk Monitor Agent** watches portfolio 24/7 → alerts parent + kid on major news

### The 5 Agents
| Agent | What It Does |
|---|---|
| **Penny (Friend Agent)** | Tavus video avatar, talks like a friend, Socratic teaching, interest detection |
| **Portfolio Builder** | Generates 3 options with risk %, projected return, based on kid's interests |
| **Approval Agent** | Sends Bland phone call to parent, collects approval or rejection + reason |
| **Negotiation Agent** | If parent rejects: runs historical performance, diversification score, confidence score — shows parent data before final call, feeds reasoning back to kid |
| **Risk Monitor** | Tavily web search on holdings 24/7, fires Bland alert to parent + kid on major news events |

### Self-Improving Layer
After every conversation Aerospike stores:
- Topics covered + whether kid understood
- Engagement level
- Which examples/analogies worked (sports? candy? gaming?)
- Attention span in minutes

Next conversation Claude reads this full history and adapts. Penny never repeats a lesson Sophie already mastered. She gets smarter about each kid with every call.

---

## Full Flow

```
Kid earns chores money
        ↓
Aerospike tracks balance
        ↓
Hits $50 threshold
        ↓
Penny (Tavus avatar) appears — friend mode
"You hit $50! What do you want to do with it?"
        ↓
Detects interests from chat → "you mentioned Nike and Adidas"
        ↓
Portfolio Agent suggests 3 options:
  Option A — Nike        (8% projected, moderate risk)
  Option B — Sports ETF  (5% projected, low risk)
  Option C — Adidas      (11% projected, higher risk)
        ↓
Kid picks Option A
        ↓
Bland dials parent phone:
"Sophie wants to invest $50 in Nike. Press 1 to approve, 2 to reject."
        ↓
        ├── Parent approves → Trade executed in Aerospike
        └── Parent rejects → Must type reason
                ↓
        Negotiation Agent runs:
          - Historical: "Blocking Apple in 2019 = -400% opportunity"
          - Diversification: "60% sports exposure — slightly concentrated"
          - Confidence score: 73% positive outcome probability
          → All shown to parent before final decision
                ↓
        Parent final answer + reason → Penny tells kid:
        "Dad said no because we already own Adidas and New Balance.
         That's called concentration risk — here's why diversity matters."
        ↓
Risk Monitor runs 24/7:
  Tavily searches news on portfolio holdings
  Nike CEO scandal found →
  Bland calls parent + Penny tells kid:
  "Big news on Nike — want to review your position?"
        ↓
Sunday → Ghost emails parent weekly report card
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Kid-facing UI | **Next.js 14** + Tailwind CSS |
| Penny's face | **Tavus CVI** — real-time video avatar, iframe embed |
| Parent phone alerts | **Bland** — outbound calls for approvals + risk alerts |
| AI brain | **Truefoundry → Claude Sonnet** — all 5 agents route through here |
| Auth | **Auth0** — parent/child RBAC, child cannot touch real money |
| Real-time data | **Aerospike** — balance, threshold, portfolio, lesson history |
| Market data sync | **Airbyte** — mock market prices pipeline |
| Parent reports | **Ghost** — weekly report card email |
| News search | **Tavily API** — real-time web search for Risk Monitor |
| Backend | **FastAPI (Python)** |

---

## Sponsor Tools (6 = $8,248 prize exposure)

| Tool | Role | Prize Track |
|---|---|---|
| Auth0 | Parent/child RBAC | $1,750 |
| Bland | Parent phone call approvals + risk alerts | $1,500 |
| Truefoundry | AI Gateway routing all 5 agents | $600 |
| Aerospike | Real-time threshold + portfolio + lesson memory | $650 |
| Airbyte | Market data pipeline | $1,750 |
| Ghost | Weekly parent report card | $1,998 |

---

## 3-Person Team Split (3 hours build, 1 hour debug)

### Person A — Frontend + Auth + Approval Flow
- Next.js app, Auth0 login (parent/child roles)
- Parent dashboard: pending approvals, portfolio view, reason field (required on reject)
- Child dashboard: coin balance, Tavus iframe embed, trade history
- Wire all pages to FastAPI endpoints

### Person B — Voice + AI Brain (Most Critical)
- Tavus CVI: create Penny replica + persona
- Truefoundry gateway + Claude Sonnet connected
- Penny conversation flow: friend opener → interest detection → portfolio suggestions
- Negotiation Agent: historical data + diversification + confidence score
- Bland: parent phone call trigger on investment request
- Risk Monitor: Tavily search → Bland alert call

### Person C — Data + Backend + Reports
- FastAPI skeleton, all endpoints
- Aerospike: coins, portfolio, threshold_status, lesson_profile schemas
- $50 threshold trigger → fires Penny activation
- Lesson outcome writer: end-of-call → updates Aerospike
- Airbyte mock sync: static market prices JSON
- Ghost weekly report card

### Integration Checkpoints
| Time | Handoff |
|---|---|
| T+30min | Share .env with all API keys |
| T+45min | Person A gives `/chore/approve` endpoint to Person B |
| T+1:30 | Person B gives Tavus session URL structure to Person A for iframe |
| T+2:00 | Person C gives `context_builder()` to Person B for Claude prompt injection |
| T+3:00 | Full end-to-end run together |

---

## What to Mock vs Build Real
| Feature | Real | Mock |
|---|---|---|
| $50 threshold → Penny activates | Real | — |
| Tavus avatar conversation | Real | — |
| Interest detection → 3 options | Real | — |
| Parent Bland call | Real | — |
| Negotiation Agent analysis | Real | — |
| Trade execution | Aerospike update only | No real brokerage |
| Risk Monitor | 1-2 Tavily searches | Full automation |
| Airbyte | Static JSON | Real connectors |

---

## Tavus Quick Start
```javascript
const res = await fetch('https://tavusapi.com/v2/conversations', {
  method: 'POST',
  headers: { 'x-api-key': process.env.TAVUS_KEY },
  body: JSON.stringify({
    replica_id: 'PENNY_REPLICA_ID',
    persona_id: 'PENNY_PERSONA_ID',
    conversation_name: 'Penny Session'
  })
})
const { conversation_url } = await res.json()
// Drop conversation_url into an iframe — Penny is live
```

## Bland Parent Alert Quick Start
```javascript
await fetch('https://api.bland.ai/v1/calls', {
  method: 'POST',
  headers: { authorization: process.env.BLAND_KEY },
  body: JSON.stringify({
    phone_number: parentPhone,
    task: `Sophie wants to invest $50 in Nike. Press 1 to approve, 2 to reject.`,
    record: true
  })
})
```

---

## 3-Minute Demo Script
```
0:00  "Sophie has been doing chores all month. She just hit $50."

0:15  Penny's face appears on screen via Tavus —
      "Hey! You saved $50 — that's huge! I know you love Nike and Adidas.
       Want to invest in something you actually care about?"

0:45  Portfolio Agent shows 3 options with risk + projected returns

1:00  Sophie picks Nike. Bland dials Dad's phone live on stage.
      "Sophie wants to invest $50 in Nike. Press 1 to approve."

1:20  Dad rejects. Types reason: "We already own Adidas and New Balance."

1:30  Negotiation Agent shows Dad: diversification score, confidence 73%,
      historical performance data — before he makes final call.

1:50  Dad confirms reject. Penny tells Sophie:
      "Dad said no — we're already heavy in sports brands.
       That's concentration risk. Want to try the ETF instead?"

2:10  Risk Monitor fires: Tavily found Nike earnings drop.
      Bland calls Dad: "Nike down 8% — good call avoiding it."

2:40  Ghost weekly report email shown — Sophie's week in review.

2:55  "Penny doesn't just teach. She learns. She adapts. She acts.
       The investor your kid hasn't become yet — starts today."
```

---

## Hackathon Challenge Alignment
**Challenge: "Build agents that don't just think, they act"**
- Autonomous: Penny fires without human trigger once threshold hit
- Self-improving: Aerospike lesson history → Claude adapts every call
- Real-time data: Tavily news search, Aerospike live balance
- Meaningful action: Trades executed, parent calls fired, risk alerts sent
- Continuously learns: Kid profile builds with every conversation
