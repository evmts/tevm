# TEVM Maintainer Runbook (Smithers Cloud)

TEVM runs publicly as a Smithers Cloud coding factory at **https://smithers.sh/evmts/tevm**, mirroring two-way to **https://github.com/evmts/tevm**.

## Trust Model

- **Maintainers**: `roninjin10` (authoritative list lives in `factory/policy.json` and `.smithers/FACTORY.ts`).
- **Trusted execution**: Runs inside Smithers-controlled sandboxes or explicitly invoked by maintainers. Only trusted runs may write to the shared object store (`https://build.smithers.sh`), attest release/deploy gates, or touch protected environments (`npm-release`, `docs-deploy`, `factory-approval`).
- **Untrusted execution**: Non-maintainers and external contributors are encouraged to run CI, tests, playgrounds, and Uphill audits locally or via fork PRs. Untrusted runs get read-only shared cache hits (`SMITHERS_CACHE_READ_TOKEN`), can never write to `https://build.smithers.sh` (`SMITHERS_CACHE_WRITE_TOKEN` is absent), and can never skip gates or access release/deploy secrets.

## One-Time Sandbox Authentication

Print a single-use, short-lived credential for an agent or sandbox (never pass secrets via argv):

```sh
# Read secret from a 0600 file or SMITHERS_SANDBOX_AUTH_SECRET env var
node scripts/factory/sandbox-auth.mjs mint \
  --subject agent-sandbox \
  --actor roninjin10 \
  --trust trusted-sandbox \
  --scope cache:read,cache:write,mcp:read,mcp:write \
  --ttl 600

# Verify and consume once (replay is deterministically rejected)
node scripts/factory/sandbox-auth.mjs verify --token "$SMTHRS_ONE_TIME_TOKEN"

# Print BYOA MCP connection guide for Claude Code, Codex, Antigravity, and Cursor
node scripts/factory/sandbox-auth.mjs mcp-guide
```

## Public Authenticated MCP Server

Every coding agent interacting with TEVM (creating artifacts, TODOs, issues, PRs/Changes, or stacks of changesets) connects to:

- **Endpoint**: `https://smithers.sh/evmts/tevm/mcp` (OAuth 2.1 + PKCE)
- **Discovery**: `https://smithers.sh/.well-known/oauth-protected-resource/evmts/tevm/mcp`

## Automatic Release and Docs Pipeline

Merging a Change from Smithers Cloud onto GitHub `main` automatically triggers:

1. **CI & ZEVM Build** (`.smithers/workflows/ci.ts`, `.github/workflows/ci.yml`): compiles native ZEVM, runs tests, typechecks, and `//factory:check`.
2. **Lighthouse Backpressure Audit** (`.smithers/workflows/uphill.ts`, `.github/workflows/uphill.yml`): scores Footprint, Quality, Architecture, and Factory & Trust against committed baselines.
3. **Automatic Release** (`.smithers/workflows/release.ts`, `.github/workflows/prerelease.yml` / `.github/workflows/release.yml`): opens or publishes the Changesets release (`next` while `.changeset/pre.json` exists, stable automatically once prerelease mode exits) with npm provenance.
4. **Automatic Docs & Factory Portal Publish** (`.smithers/workflows/docs-publish.ts`, `.github/workflows/docs-publish.yml`): regenerates/verifies `docs/node/public/llms.txt`, builds `@tevm/node-docs` and `@tevm/contributor-portal` (with attached Uphill Lighthouse HTML/JSON report), and deploys under `environment: docs-deploy`.
5. **Wiki & Mythical History Refresh** (`.smithers/workflows/wiki-refresh.ts`): validates Obsidian wiki links and regenerates `.smithers/history/MYTHICAL.md`.

## Regenerating Generated Surfaces

Never hand-edit generated files. Run the declaring targets instead:

```sh
# Regenerate .smithers/factory.json and .smithers/home.json from .smithers/FACTORY.ts
pnpm exec smthrs target //factory:projectionWrite --write

# Regenerate .github/workflows/*.yml and .github/actions/setup/action.yml
pnpm exec smthrs target //.github:github --write

# Regenerate docs/node/public/llms.txt
pnpm exec smthrs target //factory:llmsTxtWrite --write

# Refresh Uphill rules, Lighthouse snapshot, and contributor portal data
uphill rules --write
node scripts/factory/sync-uphill-snapshot.mjs --write
pnpm factory:contributor-data-write

# Run all deterministic factory checks
pnpm exec smthrs target //factory:check
```

See [`.smithers/wiki/README.md`](.smithers/wiki/README.md) for the full Obsidian engineering wiki and [`.smithers/history/MYTHICAL.md`](.smithers/history/MYTHICAL.md) for the Mythical History of TEVM.
