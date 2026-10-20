# AI Product Discovery Engine

[![CI](https://github.com/MadanMohan0537/ai-product-discovery-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/MadanMohan0537/ai-product-discovery-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Turn scattered customer feedback into a ranked list of product opportunities, each linked back to the records that support it.**

**Live demo:** <https://ai-product-discovery-engine.madanmohanlearning.workers.dev/>. Press **Load sample**, then **Discover opportunities**. The page runs `runDiscovery` in the browser. The deployed `app.js` does not call `fetch` or `/api/`.

`GET /api/health` on that host returned HTTP 200 on 2026-10-20:

```json
{"status":"ok","service":"ai-product-discovery-engine","persistence":true,"mode":"deterministic-baseline"}
```

`persistence: true` means that deployment has a D1 binding. It does not report how many rows are stored.

## 1. Problem and who it's for

Product teams collect interviews, support tickets, surveys, reviews, and sales notes, and synthesis still happens by hand across disconnected tools. The loudest anecdote often wins, and the records behind a later "why this?" are easy to lose.

The [PRD](docs/PRD.md) names these intended users and jobs. This repository has no usage data for them.

| Intended users | Job to be done |
|---|---|
| Product managers | Reduce synthesis time and defend discovery decisions with evidence |
| Founders | Find repeated unmet needs without reading every message |
| UX researchers | Connect themes to participants and segments |
| Product analysts | Combine qualitative signals with product evidence |
| Customer success | Surface recurring friction and retention risk |

## 2. Requirements (from the [PRD](docs/PRD.md))

| # | Acceptance criterion | In this repository |
|---|---|---|
| 1 | Every opportunity cites at least one source record | Met. Each opportunity's `evidence` array is the cluster's records. |
| 2 | Users can inspect the scoring formula and the component scores | Partial. `scoreOpportunity` in `pipelines/discovery.js` is the formula, and each API opportunity includes `scoreComponents`. The dashboard shows the integer score and does not render the components or the weights. |
| 3 | Invalid records cannot silently enter the analysis | Met. `normalizeRecord` throws. `POST /api/discover` returns 422, or 413 when the batch is larger than 1,000 records. |
| 4 | The local demo works without a paid API | Met. The page and the pipeline have no model provider. |
| 5 | API access fails closed without a token | Met. A missing `API_TOKEN`, or a bearer token that does not match, returns 401. |
| 6 | The README separates implemented connectors from planned ones | Met by the sections below. |

**Non-goals:** approving roadmap work, estimating engineering effort, claiming causal impact, or replacing a researcher's judgment.

## 3. Approach

```mermaid
flowchart TD
  A[Feedback records] --> B[Normalize and validate]
  B --> C[128-dim feature-hashing vectors]
  C --> D[Incremental cosine clustering]
  D --> E[Pain and request regexes]
  E --> F[Opportunity and weighted score]
  F --> G[Evidence links back to records]
  G --> H[Dashboard or API]
```

The default cluster threshold is 0.28. Pain and request counts come from word lists in `pipelines/discovery.js`.

The score is `Math.round(100 * weighted sum)` of these components. Each component is capped at 1 before weighting.

| Component | Weight | Computation |
|---|---:|---|
| Frequency | 32% | cluster size / max(3, 20% of the corpus) |
| Source breadth | 20% | distinct sources / 3 |
| Customer breadth | 18% | distinct customer ids / 5. When no record has a customer id, the record count is used instead of the id count |
| Segment breadth | 15% | distinct segments / 3 |
| Recency | 15% | 45-day half-life of the average evidence age, measured from the newest timestamp in that batch |

The result also includes a heuristic `confidence`: `0.42 + 0.08 × cluster size + 0.05 × distinct sources`, capped at 0.95. It also includes `sourceCounts`, `affectedSegments`, and `recommendedExperiment`. The score is a review order. It does not estimate business value, revenue, or feasibility.

The returned `model` string is `local-hashed-semantic-baseline-v1`. The implementation is feature hashing of tokens.

## 4. What exists today

- A browser dashboard in `apps/web/` with a light/dark toggle. Input is one `segment|source|feedback text` line per record. **Load sample** fills six sample lines. **Discover opportunities** analyzes them locally.
- The pipeline in `pipelines/discovery.js`. `npm run build` copies it to `apps/web/discovery.js`. That copy is gitignored.
- A Cloudflare Worker in `backend/src/worker.js` that serves the dashboard and the API:
  - `GET /api/health` is public.
  - `POST /api/discover` accepts a JSON array of records, or `{"records":[...],"options":{...}}`, up to 1,000 records. `normalizeRecord` requires `text`. Aliases such as `feedback` or `comment` are ignored here.
  - Requests that send an `Origin` header must match an entry in `ALLOWED_ORIGINS` exactly, or the worker returns 403. A request with no `Origin` header, such as the `curl` example below, skips that check and still needs the bearer token.
  - `GET /api/opportunities` reads D1. The default `limit` is 25 and the maximum is 100. The response includes title, problem, score, confidence, counts, segments, keywords, and experiment. It does not include the stored evidence text. With no D1 binding the route returns 503.
- Optional D1 history. `persist` runs only when `env.DB` is set. `backend/wrangler.jsonc` binds D1 database `discovery-engine-db`, so local `wrangler dev` does persist. Apply `backend/migrations/0001_initial.sql` first. Stored opportunity rows include the raw evidence JSON.
- CSV and JSON libraries in `connectors/csv.js` and `connectors/json.js`. The CSV parser accepts quoted multiline fields. Neither the dashboard nor the worker imports these modules.
- A template brief helper in `agents/opportunity-agent.js`. It copies fields from an existing opportunity and lists evidence ids. The dashboard and the worker do not call it.
- JSON Schema files in `backend/schema/`. The pipeline sets `schemaVersion` to `"1.0.0"`. The worker does not validate requests or responses against those files.
- [PRD](docs/PRD.md), [product strategy](docs/PRODUCT_STRATEGY.md), [metrics](docs/METRICS.md), and [architecture](docs/ARCHITECTURE.md).
- **22 tests** in `tests/*.test.js`, invoked by `npm test`. `npm run check` builds the web copy, syntax-checks the pipeline, connectors, worker, and dashboard, then runs those tests.
- GitHub Actions (`.github/workflows/ci.yml`) runs `npm run check` and `npm run evaluate` on Node.js 20 for pushes to `main` and for pull requests. The latest completed run on `main` succeeded when checked on 2026-10-20.
- A Docker Compose file for PostgreSQL with pgvector (`pgvector/pgvector:pg17`). `backend/postgres/001_schema.sql` creates a `vector(384)` column and an HNSW cosine index. The worker does not connect to that database. The baseline vectors are 128-dimensional.

## 5. How success would be measured

From [docs/METRICS.md](docs/METRICS.md). Nothing in the repository is a measured value for these.

| Metric | Definition | Status |
|---|---|---|
| North star | Accepted evidence-backed opportunities per discovery cycle. An opportunity counts when a PM accepts it as worth further discovery and its cited evidence is valid. | Not yet measured |
| Insight precision | Accepted surfaced opportunities / reviewed surfaced opportunities | Not yet measured |
| Evidence validity | Correctly supporting citations / audited citations | Not yet measured |
| Time to first reviewed opportunity | Median time from import to first reviewed opportunity | Not yet measured |
| Guardrail | Percentage of high-impact opportunities supported by only one source | Not yet measured |

`npm run evaluate` reads `evaluation/seed.json` and prints:

```json
{
  "datasetSize": 4,
  "opportunityCount": 2,
  "evidenceTraceability": 1,
  "evidenceCoverage": 1,
  "warning": "Seed metrics validate plumbing, not production insight precision."
}
```

That output checks the metric code on four seed records. It is not a measure of insight quality.

## 6. Trade-offs and limitations

- Feature hashing matches shared tokens. Paraphrases that use different words stay in different clusters unless a later labeled benchmark supports another representation.
- Clustering and ids such as `opportunity-1` apply to a single request. A later request starts over.
- Titles are `Improve` plus up to three frequent tokens, or `Review uncategorized feedback`.
- The score omits revenue, strategy fit, effort, and causal impact.
- The dashboard path and the worker path are the end-to-end inputs: pipe-delimited lines in the browser, and JSON records with `text` on `POST /api/discover`. The CSV and JSON connector modules are tested libraries only.
- Slack, Zendesk, Intercom, Reddit, Apple and Google reviews, product analytics, interview repositories, Workers AI, and Vectorize are named in `connectors/README.md` or `docs/ARCHITECTURE.md` as future work. `wrangler.jsonc` has no Workers AI or Vectorize binding.
- D1 stores raw evidence on the opportunity row. Consent, retention, deletion, and tenant isolation are undefined here. One bearer token fits a personal demo. It does not isolate tenants.

## Quick start

`npm test` and `npm run evaluate` use Node's built-in test runner. CI runs them on Node.js 20.

`npm run dev` and `npm run deploy` use Wrangler. `backend/package.json` depends on `wrangler@^4.33.1`. There is no lockfile. A fresh install on 2026-10-20 resolved Wrangler 4.151.3, whose package `engines.node` is `>=22.0.0`. Use Node.js 22 or newer for the dev server and for deploy. These commands were run on Node.js v22.23.3.

```bash
git clone https://github.com/MadanMohan0537/ai-product-discovery-engine.git
cd ai-product-discovery-engine
npm install
npm test
npm run evaluate
```

Dashboard lines:

```text
segment|source|feedback text
New SMB users|interview|Onboarding is confusing and setup is hard
Enterprise admins|sales|We need SAML SSO before security review
```

The local API needs a token and the D1 tables. `.env.example` lists `API_TOKEN`, `ALLOWED_ORIGINS`, and `DATABASE_URL`. The worker reads `API_TOKEN` and `ALLOWED_ORIGINS` from Wrangler. No code reads `DATABASE_URL`. Put the token in `backend/.dev.vars`, which is gitignored:

```bash
echo 'API_TOKEN=local-development-token' > backend/.dev.vars
npm --prefix backend run db:migrate:local
npm run dev
```

`npm run dev` builds the web assets, then starts Wrangler on <http://localhost:8787>. `backend/wrangler.jsonc` sets `ALLOWED_ORIGINS` to `http://localhost:8787` and binds D1. Without the local migration, `POST /api/discover` returns 422 because `discovery_runs` is missing, and `GET /api/opportunities` returns 500.

```bash
curl -X POST http://localhost:8787/api/discover \
  -H 'Authorization: Bearer local-development-token' \
  -H 'Content-Type: application/json' \
  --data '{"records":[{"text":"Please add SSO","source":"sales","segment":"Enterprise"}]}'
```

After the migration, that request returns 201 and a body with `opportunityCount`. The same call without the `Authorization` header returns 401.

Deploy to a Cloudflare account from the repository root so the web pipeline copy is built. `npm run deploy` in `backend/` is only `wrangler deploy` and skips that build. The checked-in `database_id` belongs to the database named in `wrangler.jsonc`. An account that does not own that database needs its own id in that file.

```bash
cd backend
npx wrangler d1 create discovery-engine-db
# replace database_id in backend/wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret put API_TOKEN
cd ..
npm run deploy
```

For a browser on another origin to call the API, add that origin to `ALLOWED_ORIGINS`. The dashboard itself does not call the API.

Remote deploy was not run as part of checking this README.

## Roadmap

These items are not implemented:

1. A labeled retrieval and cluster-quality benchmark.
2. Human merge, split, rename, accept, and reject actions.
3. Stable opportunity identity across runs, and alerts for emerging problems.
4. One authenticated connector end to end, with cursor and retry tests.
5. Semantic embeddings evaluated against the baseline.
6. Redaction, retention, and tenant isolation.

## Related repositories

These are separate repositories. This codebase does not call them.

- [feedback-prioritizer](https://github.com/MadanMohan0537/feedback-prioritizer): a Python and Streamlit feedback collector with vendor adapters and NLP fallbacks.
- [product-evidence-to-decision-suite](https://github.com/MadanMohan0537/product-evidence-to-decision-suite): a separate suite whose own README describes fifty-one projects from evidence through experiments and governance.

## License

[MIT](LICENSE)
