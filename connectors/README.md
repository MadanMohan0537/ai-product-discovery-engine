# Connector contracts

The MVP accepts CSV and JSON. Every connector must emit the normalized contract `{id, text, source, segment, customerId, timestamp, metadata}`. External integrations belong here as independently testable adapters; credentials must remain in runtime secrets.

Planned adapters: Zendesk, Intercom, Slack, Reddit, Apple/Google reviews, product analytics, and interview repositories. They are not represented as implemented until an end-to-end fetch, cursor, retry, and contract test exists.
