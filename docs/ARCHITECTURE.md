# Architecture

## Deployable baseline

The Cloudflare Worker serves the static dashboard, secures the API, runs the shared hashed-vector discovery pipeline, and optionally persists runs in D1. Raw evidence is included in persisted opportunity records, so real deployments must establish retention, deletion, access, and consent policies.

## Optional semantic path

Workers AI can generate embeddings within its allocation and Vectorize can support similarity search. These bindings are intentionally not required by the MVP. The Docker Compose profile supplies PostgreSQL with pgvector for local experiments using exact or HNSW cosine search.

## Data contracts

Connectors emit normalized feedback records. The pipeline produces versioned opportunities with score components and source evidence. The UI and API import the same pipeline module.

## Security boundary

Bearer authentication is suitable for a personal deployment, not multi-tenant SaaS. Production expansion requires user identity, tenant-scoped queries and vector indexes, encryption and retention controls, distributed abuse prevention, audit logs, and secret rotation.

## Scaling boundary

The deterministic pipeline is O(n × k) during incremental clustering and capped at 1,000 records per request. Larger corpora should move preprocessing to background jobs, retain stable cluster identities, and use evaluated approximate retrieval with tenant filtering.
