# Security Policy

Do not report vulnerabilities through a public issue. Use GitHub's private vulnerability reporting for this repository when enabled.

The MVP bearer-token design is intended for a personal demonstration. A multi-user deployment requires identity, tenant isolation, tenant-scoped retrieval, distributed rate limiting, audit logs, retention and deletion controls, and secret rotation. Do not ingest confidential customer evidence until those controls and an organizational data policy are in place.

Supported branch: `main`.
