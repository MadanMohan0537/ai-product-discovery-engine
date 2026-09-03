# Contributing

Keep changes evidence-backed and independently testable. Before opening a pull request, run `npm run check` and explain which product metric or user problem the change addresses.

Connector pull requests must include normalization tests and must not claim an integration is complete unless fetching, pagination/cursors, retries, credential handling, and deletion behavior are implemented. Model changes must include a representative labeled evaluation and comparison with the deterministic baseline.

Never commit customer feedback, secrets, `.dev.vars`, or `.env` files.
