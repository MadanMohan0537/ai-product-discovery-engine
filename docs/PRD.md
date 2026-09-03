# Product Requirements Document

## Product

AI Product Discovery Engine converts fragmented qualitative evidence into ranked, traceable product opportunities.

## Users and jobs

- Product managers: reduce synthesis time and defend discovery decisions with evidence.
- Founders: find repeated unmet needs without reading every message.
- UX researchers: connect themes to participants and segments.
- Product analysts: combine qualitative signals with product evidence.
- Customer success teams: surface recurring friction and retention risk.

## MVP scope

CSV/JSON ingestion, normalization, local embeddings, clustering, problem signals, opportunity generation, transparent scoring, evidence retrieval, dashboard, secured API, D1 history, and evaluation plumbing.

## Acceptance criteria

1. Every opportunity contains at least one source record.
2. Users can inspect the formula and component scores.
3. Invalid records cannot silently enter analysis.
4. The local demo works without a paid API.
5. API access fails closed without a token.
6. The README distinguishes implemented connectors from planned integrations.

## Non-goals

The MVP does not autonomously approve roadmap work, estimate engineering effort, claim causal impact, or impersonate customer research judgment.
