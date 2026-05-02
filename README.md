# Unified Action Graph

Unified Action Graph is a Vite React MVP for a single-pane operational intelligence workflow system. It consolidates demo telemetry and live public-source OSINT enrichment into a command dashboard, lets an operator promote signals or findings into detections, assigns detections into workflows, generates deterministic Courses of Action (COAs), and records every operator/system action into an audit timeline.

## Current status

This repository is an MVP prototype, not a production SOC, SIEM, SOAR, or live enterprise remediation platform.

Current capabilities:

- Command dashboard for aggregate feed, detection, workflow, connector, and event-tape status
- Raw feed inbox using seeded demo telemetry
- OSINT Intake for public-source enrichment seeds
- Live public DNS enrichment through a backend route
- Live public RDAP domain metadata enrichment through a backend route
- Live public URLhaus threat-intel metadata enrichment through a backend route
- Live public GitHub repository metadata enrichment through a backend route
- Evidence-backed OSINT findings with source, reliability, snippet, and capture time
- Finding promotion into the existing detection workflow path
- Detection creation from feed promotion
- Workflow creation from detections
- Deterministic COA generation through local TypeScript rules
- Optional server-side OpenRouter advisory review endpoint
- Entity graph visualization with react-force-graph-2d
- Connector/source catalog for reference-only integration planning
- Audit log for OSINT seed creation, enrichment runs, finding promotion, workflow, action execution, and closure events

Current limitations:

- Seeded Raw Feed data is still demo/sample telemetry unless explicitly replaced by real connectors
- Connector catalog entries are reference-only or demo templates; they do not call external APIs
- OSINT enrichment is limited to safe public metadata routes: DNS, RDAP, URLhaus metadata, and GitHub public repo metadata
- URLhaus integration records metadata only and does not download malware samples
- GitHub integration reads public repo metadata only and does not scan secrets or private repositories
- Zustand state is in-memory and resets on page reload
- COA execution updates local workflow state only; it does not call live Okta, AWS, firewall, ticketing, EDR, or robot systems
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

Optional compatibility aliases can remain empty unless a future backend service expects them:

```bash
OPENROUTER_API_KEY=
ROBOMARKET_API=
FREE_ROBOMARKET_API=
```

Optional public GitHub REST API token for higher GitHub API rate limits:

```bash
GITHUB_PUBLIC_TOKEN=optional_github_token_here
```

Important: do not expose private API keys in frontend bundles. LLM/connector calls must be handled through backend/serverless routes, not through Vite client `define` values. Do not prefix secret values with `VITE_`.

OpenRouter: https://openrouter.ai/

## Live public OSINT endpoints

The repository includes safe public-source enrichment endpoints:

```text
POST /api/enrich/dns
POST /api/enrich/rdap
POST /api/enrich/urlhaus
POST /api/enrich/github
```

These endpoints are intentionally scoped to public metadata. They do not perform private scraping, credential collection, exploit execution, malware downloads, device access, or external remediation.

Supported seed types:

```text
domain -> DNS, RDAP, URLhaus
url -> DNS, RDAP, URLhaus
ip -> URLhaus
github_repo -> GitHub public repo metadata
```

Unsupported seed types such as email, username, and company are modeled for the future but do not yet run live enrichment.

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
OSINT seed -> live public enrichment -> finding -> evidence -> entity graph -> detection -> workflow -> COA -> audit
Raw feed signal -> Promote to detection -> Assign to workflow -> Generate COAs -> Execute local action -> Append audit event
```

Main folders:

```text
api/                    Serverless backend endpoints for AI and OSINT enrichment
src/components/views/   UI screens
src/components/layout/  Navigation/layout components
src/data/               Demo/reference source catalogs
src/store/              Zustand platform state and actions
src/services/           Deterministic service logic such as COA generation
src/types/              Core TypeScript domain models
```

## Connector registry foundation

The connector registry is inspired by public API catalogs and OpenAPI discovery tools, but it is intentionally reference-only in this MVP.

It currently provides:

- source category
- auth type
- HTTPS and CORS metadata
- recommended use: feed, enrichment, workflow action, or reference
- reference URL or internal template marker
- explicit truth status showing that the source is not live

See `docs/CONNECTOR_REGISTRY.md` for the connector lifecycle and future live-integration requirements.

## AI upgrade path

1. Deterministic COA engine generates candidate actions.
2. Server-side AI route reviews context and explains risk, tradeoffs, and missing evidence.
3. UI displays AI output as advisory only.
4. Human operator approves or rejects the action.
5. Audit log records whether AI was used.

Do not let AI directly execute external actions.

## Production upgrade path

Recommended next upgrades:

1. Add persistent storage for OSINT seeds, findings, evidence, feeds, detections, workflows, COAs, and audit logs.
2. Add authentication and actor identity.
3. Add input-risk classification before AI review and external connector processing.
4. Add evidence-chain export and case reports.
5. Replace seeded connector state with real connector configuration records.
6. Wire the UI to the `/api/ai-review` endpoint for optional COA review.
7. Add append-only audit guarantees and before/after diffs.
8. Add mobile/tablet responsive layouts for dense views and graph fallback states.
9. Add deterministic tests for OSINT enrichment mapping, promotion, workflow creation, COA generation, and audit logging.

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
GITHUB_PUBLIC_TOKEN=optional_github_token_here
```

## Data truth policy

Seeded telemetry, demo connector entries, and local workflow actions are demo/sample data until real integrations are wired, authenticated, and verified. OSINT enrichment findings from DNS, RDAP, URLhaus, and GitHub are live public-source metadata when the corresponding backend route returns successfully. Do not claim live enterprise actioning, live cloud remediation, private intelligence collection, malware analysis, or credential discovery from this MVP alone.
