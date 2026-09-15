# Meridian — Vetic Calling Agent Dashboard

The persistence + observability layer for the [Vetic voice agent](https://github.com/tanishqd1216-source/vetic-call-analysis) — a LiveKit-based AI agent that handles outbound service-recovery calls and inbound support calls for a pet-grooming business. This repo is deliberately separate from the agent itself: the agent stays a "wrap, don't replace" text-in/audio-out process, and this is the missing piece around it — real call-history persistence, a proper dashboard, an ERP-style department/agent picker, and CRM/MCP integration management. Internally called the Vetic dashboard; branded "Meridian" only in the UI's own marketing chrome.

## Architecture

- **`backend/`** — Express 5 + TypeScript, Prisma 7 ORM, Postgres (Neon in production). Zod-validated routes, pino structured logging.
- **`frontend/`** — Next.js 16 (App Router, Turbopack), Tailwind, TypeScript. A public marketing site plus an auth-gated app shell.

## What's actually in here

| Area | Routes / pages | Notes |
|---|---|---|
| **Call observability** | `/calls-history`, `/calls-history/:callId`; `POST /api/events`, `GET /api/calls*` | Real call history ingested from the LiveKit agent's own event reporting — per-turn latency breakdown (EOU/STT/LLM-TTFT/TTS-TTFB), token counts, business fields (owner/pet/service/clinic/city). |
| **ERP department/agent picker** | `/erp`, `/erp/departments/:id/agents/:id/launch`; `GET /api/departments*` | Launches the agent's own webcall console (`webcall_server.py`) inside an iframe rather than reimplementing call placement. |
| **CRM / MCP integrations** | `GET/POST/PATCH/DELETE /api/integrations`, `GET /api/internal/integrations` | AES-256-GCM-encrypted connection config, consumed by the LiveKit agent at call time via the internal service-to-service route. Backend-complete; no frontend page currently links to it. |
| **Auth** | `/` (login), `POST /api/auth/*` | Real bcrypt + opaque-session auth (not a stub), gating `/erp` and `/calls-history`. Single-tenant in practice — the schema supports multiple companies, but nothing exposes provisioning one; `prisma/seed.ts` creates exactly one demo tenant. |
| **Marketing site** | `/capabilities/*`, `/industries/*`, `/use-cases/*`, `/developers/*`, `/book-demo`, etc. | Public, unauthenticated. Some pages show hardcoded stats (e.g. "92%+ First-Contact Resolution") that are not computed from real data — a known, open issue, not yet reconciled. |

## Eval tracking has moved

This dashboard used to have its own `/evals` section (Prisma models `PromptVersion`/`EvalRun`/`EvalResult`, backed by `tests/eval/run_eval.py` in the agent repo POSTing results here). That's been decommissioned — eval runs, historical backfill, and experiment comparison now live in **LangSmith** instead; see the agent repo's `livekit_agent/tests/eval/` for the current harness (`run_langsmith_eval.py`, `langsmith_setup_datasets.py`, `langsmith_backfill.py`) and `CASE_STUDY.md` for the full story of what that harness found.

`backup-before-evals-drop-20260915/` preserves the pre-decommission state — the full raw row data from the three dropped tables, plus copies of every source file that was deleted or edited during the decommission — kept since this repo had no git history to fall back on at the time this happened.

## Running locally

```bash
# backend
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT/session secrets, etc.
npm install
npm run build           # prisma generate + tsc
npm run dev              # tsx watch src/index.ts, default port 4000

# frontend (separate terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev              # next dev, default port 3000
```

`backend/prisma/seed.ts` provisions one demo company/user (`operator@vetic.in`) idempotently — run `npx prisma db seed` after your first migration if you need a login to test with.

## Known open issues

- Marketing pages' hardcoded conversion stats aren't derived from real `Call`/eval data.
- `POST /api/events` and `GET /api/calls*` have no auth — anyone who can reach the backend can post call events or read call history.
- CRM/MCP integration management is backend-complete but has no linked frontend page yet.
