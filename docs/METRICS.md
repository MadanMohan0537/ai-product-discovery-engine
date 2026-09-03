# Metrics

## North-star candidate

**Accepted evidence-backed opportunities per discovery cycle.** An opportunity counts only when a PM accepts it as worth further discovery and its cited evidence is valid.

## Quality metrics

- Insight precision: accepted surfaced opportunities / reviewed surfaced opportunities
- Evidence validity: correctly supporting citations / audited citations
- Evidence coverage: ingested records assigned to at least one opportunity / valid ingested records
- Duplicate-customer-adjusted frequency
- Cluster stability across consecutive runs
- Segment coverage and source diversity

## Workflow metrics

- Median time from import to first reviewed opportunity
- Self-reported synthesis time saved
- Opportunity acceptance, rejection, merge, and split rates
- Human correction rate

## Guardrails

- Unsupported-claim rate
- Sensitive-data exposure incidents
- Percentage of high-impact opportunities supported by only one source
- Connector freshness and ingestion failure rate

The seed evaluation in this repository validates metric computation only. It does not establish model quality.
