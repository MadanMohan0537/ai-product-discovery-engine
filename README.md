<div align="center">

# AI Product Discovery Engine

**Turn fragmented customer evidence into ranked, traceable product opportunities.**

Local-first · Evidence-backed · Transparent scoring · Cloudflare-ready · Zero paid APIs required

[![CI](https://github.com/MadanMohan0537/ai-product-discovery-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/MadanMohan0537/ai-product-discovery-engine/actions/workflows/ci.yml)
![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![Tests](https://img.shields.io/badge/tests-22%20passing-22c55e)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

Product teams collect interviews, support tickets, surveys, reviews, sales notes, competitor evidence, and analytics—but synthesis still happens manually across disconnected tools. AI Product Discovery Engine normalizes that evidence, groups recurring problems, generates candidate opportunities, ranks them through an inspectable formula, and preserves the supporting records behind every recommendation.

This is designed as a flagship AI Product Manager portfolio project: it combines product strategy, discovery workflow design, responsible AI boundaries, evaluation, data architecture, and a working full-stack MVP.

## At a glance

| | |
|---|---|
| **Problem** | Customer evidence is fragmented and expensive to synthesize manually. |
| **Users** | Product managers, founders, product analysts, UX researchers, and customer-success teams. |
| **MVP input** | CSV or JSON feedback records. |
| **MVP output** | Ranked opportunities with confidence, segments, source counts, experiments, and traceable evidence. |
| **Default runtime** | Browser-local analysis or a secured Cloudflare Worker. |
| **Cost posture** | No paid API, hosted model, or database is required for the working baseline. |

## Delivery status

| Capability | Status | Boundary |
|---|---|---|
| CSV/JSON ingestion and normalization | Implemented | End-to-end |
| Discovery pipeline and opportunity scoring | Implemented | Deterministic lexical baseline |
| Evidence-backed dashboard | Implemented | Local-first, responsive light/dark UI |
| Worker API and optional D1 history | Implemented | Bearer-token protected |
| PostgreSQL/pgvector environment | Supplied | Infrastructure only; not wired to the Worker |
| External SaaS connectors | Planned | Zendesk, Intercom, Slack, Reddit, app stores, analytics |
| Semantic embedding adapters | Planned | Must outperform the baseline in evaluation |

## Live product flow

```mermaid
flowchart TD
  A[CSV, JSON, interviews, tickets, reviews] --> B[Normalize and validate]
  B --> C[Embedding adapter]
  C --> D[Topic clustering]
  D --> E[Problem detection]
  E --> F[Opportunity generation]
  F --> G[Transparent scoring]
  G --> H[Evidence retrieval]
  H --> I[Opportunity dashboard]
```

The default embedding adapter is a deterministic 128-dimensional feature-hashing baseline that runs locally and in Cloudflare Workers. Optional Workers AI, Vectorize, or PostgreSQL/pgvector paths can be evaluated later without making paid services mandatory.

## What is implemented

- CSV and JSON connector contracts with multiline CSV support
- Strict normalized record validation
- Deterministic local embeddings
- Incremental cosine-similarity clustering
- Pain and request signal extraction
- Evidence-backed opportunity generation
- Transparent five-component opportunity score
- Confidence, source counts, affected segments, and recommended experiments
- Evidence retrieval from every opportunity to its original records
- Local-first responsive light/dark dashboard
- Secured Cloudflare Worker API
- Optional Cloudflare D1 history
- Optional PostgreSQL + pgvector Docker environment
- Versioned JSON schemas
- Evaluation harness and seed dataset
- Automated algorithm, connector, agent, API, and evidence tests
- PRD, product strategy, metrics, and architecture documents

## Example opportunity

```json
{
  "title": "Improve onboarding / setup / checklist",
  "problem": "2 pain signals and 1 request signal across 3 records.",
  "score": 82,
  "confidence": 0.81,
  "evidenceCount": 3,
  "sourceCounts": { "support": 2, "interview": 1 },
  "affectedSegments": ["New SMB users"],
  "recommendedExperiment": "Prototype a focused onboarding improvement and test task completion.",
  "evidence": [{ "id": "ticket-42", "source": "support", "text": "…" }]
}
```

## Repository map

```text
apps/web/              Local-first opportunity dashboard
backend/               Cloudflare Worker, D1 migration, schemas, pgvector setup
connectors/            CSV/JSON adapters and connector contract
pipelines/             Discovery, clustering, scoring, evidence retrieval
agents/                Evidence-grounded opportunity brief generator
evaluation/            Seed dataset and metric computation
tests/                 Unit and HTTP route tests
docs/                  PRD, strategy, metrics, and architecture
docker-compose.yml     Optional local PostgreSQL/pgvector environment
```

## Quick start

Requires Node.js 20 or newer.

```bash
git clone https://github.com/MadanMohan0537/ai-product-discovery-engine.git
cd ai-product-discovery-engine
npm install
npm test
npm run dev
```

Open `http://localhost:8787`. Press **Load sample**, then **Discover opportunities**. Browser analysis stays on the device and needs no token, model download, or database.

## Input format

The dashboard accepts one record per line:

```text
segment|source|feedback text
New SMB users|interview|Onboarding is confusing and setup is hard
Enterprise admins|sales|We need SAML SSO before security review
```

The programmatic contract is:

```json
{
  "id": "ticket-42",
  "text": "Setup is confusing",
  "source": "zendesk",
  "segment": "New SMB users",
  "customerId": "customer-7",
  "timestamp": "2026-09-01T12:00:00Z",
  "metadata": {}
}
```

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Runtime status |
| `POST` | `/api/discover` | Bearer token | Analyze up to 1,000 records |
| `GET` | `/api/opportunities?limit=25` | Bearer token | Read persisted ranked opportunities |

```bash
curl -X POST http://localhost:8787/api/discover \
  -H 'Authorization: Bearer local-development-token' \
  -H 'Content-Type: application/json' \
  --data '{"records":[{"text":"Please add SSO","source":"sales","segment":"Enterprise"}]}'
```

## Opportunity scoring

The MVP avoids an opaque “AI score.” Each score is a weighted combination:

| Component | Weight | Meaning |
|---|---:|---|
| Frequency | 32% | Share of corpus supporting the cluster |
| Source breadth | 20% | Independent channels represented |
| Customer breadth | 18% | Distinct customers, when IDs are available |
| Segment breadth | 15% | Distinct affected segments |
| Recency | 15% | 45-day evidence half-life |

Scores prioritize review; they do not calculate business value, causality, revenue, or engineering feasibility.

## Cloudflare deployment

The default path uses assets + Worker + optional D1. Cloudflare currently provides free allocations suitable for prototypes, but limits can change and exceeding them can stop operations rather than remain free.

```bash
cd backend
npm install
npx wrangler d1 create discovery-engine-db
# Replace REPLACE_WITH_D1_DATABASE_ID in wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret put API_TOKEN
npm run deploy
```

Set `ALLOWED_ORIGINS` to the exact deployed origin. For stateless operation, remove the D1 binding. Never commit `.dev.vars` or real connector credentials.

### Optional semantic retrieval

- **Workers AI + Vectorize:** a future Cloudflare-native adapter. The current repository does not claim that adapter is implemented.
- **PostgreSQL + pgvector:** run `docker compose up -d` for the local database and HNSW cosine index. Application wiring is intentionally left as an evaluated extension, not represented as active persistence.

## Evaluation

```bash
npm run check
npm run evaluate
```

The repository currently has **22 automated tests** covering the algorithms, connectors, opportunity agent, evidence traceability, and HTTP behavior. `npm run check` runs syntax validation and the complete test suite; the GitHub Actions workflow runs the same checks on pushes and pull requests.

The report computes evidence traceability and coverage. The bundled four-record seed validates plumbing only. A real evaluation should add human-labeled theme pairs, opportunity acceptance decisions, evidence-validity audits, cluster stability, and unsupported-claim review.

See [METRICS.md](docs/METRICS.md) for the complete measurement plan.

## Product documentation

- [PRD](docs/PRD.md)
- [Product strategy](docs/PRODUCT_STRATEGY.md)
- [Success and guardrail metrics](docs/METRICS.md)
- [Architecture and scaling boundaries](docs/ARCHITECTURE.md)

The opportunity-solution-tree concept informs the product direction: opportunities should connect to a desired product outcome and remain distinct from possible solutions. The MVP therefore recommends experiments but does not silently turn them into roadmap commitments.

## Product principles

- **Evidence before narrative:** every opportunity links back to source records.
- **Inspectable prioritization:** score components and weights are visible and replaceable.
- **Human decision ownership:** outputs support discovery; they do not make roadmap decisions.
- **Baseline before complexity:** semantic models earn adoption through measured improvement.
- **Privacy by deployment choice:** teams can analyze locally or operate their own secured Worker.

## Security and privacy

- Browser analysis sends no feedback to a server.
- API access fails closed without `API_TOKEN`.
- Cross-origin requests require an exact allowlisted origin.
- Responses include CSP, `nosniff`, no-referrer, and no-store headers.
- D1 statements are parameterized and writes are bounded in batches.
- Inputs and batch sizes are bounded.
- Browser-rendered evidence is escaped.
- Internal errors are not exposed to clients.

D1 persistence stores raw source evidence so results remain traceable. Before using real customer data, define consent, minimization, retention, deletion, tenant isolation, and access policies. The bearer token is appropriate for a personal demo, not a multi-tenant production service.

## Honest limitations

- Feature hashing provides lexical similarity, not true semantic understanding.
- Online clustering is scoped to one request and does not preserve topic identity across runs.
- Opportunity titles are keyword summaries, not generated strategic narratives.
- Scoring does not include revenue, strategy, effort, or causal impact.
- The seed dataset is too small for accuracy claims.
- CSV and JSON are the only end-to-end connectors today.
- Slack, Zendesk, Intercom, Reddit, app-store, analytics, Workers AI, and Vectorize integrations are roadmap items.
- PostgreSQL/pgvector infrastructure is supplied for experiments but is not wired into the Worker.

## Roadmap

1. Run a labeled retrieval and cluster-quality benchmark.
2. Add human merge, split, rename, accept, and reject actions.
3. Implement stable cross-run opportunity identity and emerging-problem alerts.
4. Ship one authenticated connector end to end with cursor and retry tests.
5. Evaluate semantic embeddings against the deterministic baseline.
6. Add evidence-level redaction, retention, and tenant isolation.
7. Connect opportunities to explicit product outcomes and experiment results.

## License

[MIT](LICENSE)
