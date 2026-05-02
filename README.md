# Unified Action Graph

Unified Action Graph is a Vite React MVP for a single-pane operational intelligence workflow system. It consolidates demo telemetry feeds into a command dashboard, lets an operator promote raw signals into detections, assigns detections into workflows, generates deterministic Courses of Action (COAs), and records every operator/system action into an audit timeline.

## Current status

This repository is an MVP prototype, not a production SOC, SIEM, SOAR, or live enterprise integration platform.

Current capabilities:

- Command dashboard for aggregate feed, detection, workflow, connector, and event-tape status
- Raw feed inbox using seeded demo telemetry
- Detection creation from feed promotion
- Workflow creation from detections
- Deterministic COA generation through local TypeScript rules
- Optional server-side OpenRouter advisory review endpoint
- Entity graph visualization with react-force-graph-2d
- Audit log for promotion, workflow, action execution, and closure events

Current limitations:

- Data is seeded demo/sample telemetry unless explicitly replaced by real connectors
- Connector statuses are UI/demo state only unless real backend integrations are added
- Zustand state is in-memory and resets on page reload
- COA execution updates local workflow state only; it does not call live Okta, AWS, firewall, ticketing, or EDR systems
- AI/LLM output is advisory only and must not execute external actions

## Tech stack

- Vite
- React
- TypeScript
- Zustand
- Tailwind CSS
- react-force-graph-2d
- date-fns
- lucide-react
- OpenRouter-ready AI provider configuration

## Local setup

Prerequisites:

- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Type-check:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

## Environment variables

Copy `.env.example` to `.env.local` when adding future server-side AI or connector services.

Recommended OpenRouter free-router variables:

```bash
UNIFIED_ACTION_GRAPH_API=your_openrouter_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openrouter/free
```

Optional compatibility aliases can remain empty unless a backend service expects them:

```bash
OPENROUTER_API_KEY=
ROBOMARKET_API=
FREE_ROBOMARKET_API=
```

Important: do not expose private API keys in frontend bundles. LLM/connector calls should be handled through backend/serverless routes, not through Vite client `define` values.

OpenRouter: https://openrouter.ai/

## Server-side AI endpoint

The repository includes a server-side advisory endpoint:

```text
POST /api/ai-review
```

It uses `UNIFIED_ACTION_GRAPH_API` first, then optional compatibility aliases if present. It defaults to `AI_MODEL=openrouter/free` and returns advisory analysis only.

The deterministic COA engine remains the fallback source of truth. The AI endpoint should only review, summarize, and flag missing evidence. It must not execute external actions.

## Architecture overview

Core flow:

```text
Raw feed signal -> Promote to detection -> Assign to workflow -> Generate COAs -> Execute local action -> Append audit event
```

Main folders:

```text
src/components/views/   UI screens
src/components/layout/  Navigation/layout components
src/store/              Zustand platform state and actions
src/services/           Deterministic service logic such as COA generation
src/types/              Core TypeScript domain models
api/                    Serverless backend endpoints for Vercel-style deployment
```

## AI upgrade path

1. Deterministic COA engine generates candidate actions.
2. Server-side AI route reviews context and explains risk, tradeoffs, and missing evidence.
3. UI displays AI output as advisory only.
4. Human operator approves or rejects the action.
5. Audit log records whether AI was used.

Do not let AI directly execute external actions.

## Production upgrade path

Recommended next upgrades:

1. Add persistent storage for feeds, detections, workflows, COAs, and audit logs.
2. Add authentication and actor identity.
3. Replace seeded connector state with real connector configuration records.
4. Wire the UI to the `/api/ai-review` endpoint for optional COA review.
5. Add append-only audit guarantees, before/after diffs, and exportable case reports.
6. Add mobile/tablet responsive layouts for dense views and graph fallback states.
7. Add deterministic tests for promotion, workflow creation, COA generation, and audit logging.

## Deployment

The current app can be deployed as a standard Vite app on Vercel.

Suggested Vercel settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Vercel environment variables:

```bash
UNIFIED_ACTION_GRAPH_API=your_openrouter_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openrouter/free
```

## Data truth policy

All bundled telemetry, connectors, graph entities, and workflows are demo/sample data until real integrations are wired, authenticated, and verified. Do not claim live enterprise actioning, live cloud remediation, or live security integrations from this MVP alone.
