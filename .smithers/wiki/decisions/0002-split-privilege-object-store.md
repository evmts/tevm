# ADR 0002: Split-Privilege Shared Smithers Cloud Object Store

- **Status**: Accepted
- **Date**: 2026-11-26
- **Related**: [[coding-factory]], [[mcp-and-byoa]]

```mermaid
flowchart LR
  Trusted["Maintainer / Smithers Sandbox"] -->|SMITHERS_CACHE_WRITE_TOKEN| Store["build.smithers.sh"]
  Untrusted["External Contributor / Fork PR"] -->|SMITHERS_CACHE_READ_TOKEN (read-only)| Store
```

## Context

We want non-maintainers and external contributors to run TEVM builds, tests, and audits freely with fast cache hits, while guaranteeing that untrusted code can never poison the shared build cache or bypass required merge gates.

## Decision

1. Point all workspace caching at the shared Smithers Cloud object store (`https://build.smithers.sh`) with split `SMITHERS_CACHE_READ_TOKEN` and `SMITHERS_CACHE_WRITE_TOKEN` credentials.
2. Restrict `SMITHERS_CACHE_WRITE_TOKEN`, publish tokens, and gate attestations exclusively to Smithers-controlled sandboxes and maintainers (`roninjin10`) using single-use attenuated credentials (`scripts/factory/sandbox-auth.mjs`).
3. Enforce this invariant continuously via root-input-tracing in `scripts/factory/trust-boundary.mjs`.

## Consequences

- Contributors enjoy fast shared cache hits with zero trust risk.
- Cache poisoning and gate-skipping from fork PRs are structurally impossible.
