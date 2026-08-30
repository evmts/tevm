# Smithers/Flows implementation notes

TEVM's declaration graph is active against the unpublished Flows source vendored as the `vendor/flows` submodule (built by `scripts/factory/build-flows.mjs` on `pnpm install`), with bun and foundry pinned in `mise.toml` as the `S.Mise` layer. The exact source revision, install path, CLI/model pins, approval rules, and issue routes live in `factory/policy.json`; registry fallbacks are not supported.

## What is executable

- `WORKSPACE.ts`, root `PACKAGE.ts`, and package-local `PACKAGE.ts` files load through the real `@smthrs/targets` API.
- `pnpm factory:runtime-check` validates the full graph and approval refusals, then runs a model-free `Agent.Diff` acceptance/write-set proof in an isolated workspace.
- `//factory:check` executes policy, queue, intake, and declaration-type checks. `smithers.d.ts` is only an empty compatibility anchor and cannot mask missing APIs.
- Package build, test, lint, typecheck, documentation, Cargo, conformance, parity, release, and deployment commands are represented as targets. Root compatibility aggregates call the established pnpm/Nx entry points where this Flows revision has no embedded query target.
- All coding lanes are `Agent.Diff` candidates. Deterministic gates run in the candidate loop; `//:agentLints` runs after the accepted diff because agent targets cannot recursively gate other agent targets.
- `//:mechanicalPrePush` is the candidate-safe repository gate. Its wrapper runs daemonless, cloud-disabled Nx static analysis and hermetic tests sequentially with bounded parallelism. The sandbox allows local loopback servers but denies egress and receives no RPC secrets.
- `//:externalIntegrationTests` is a separate maintainer boundary for the compiler CDN and live viem, MCP, and CLI RPC tests. Network access and the three integration variables are declared only on the package targets that need them.
- Read-only issue intake and approval-gated issue settlement are checked-in GitHub workflows. The candidate job has no repository write credential; a protected `factory-approval` environment gates application of its exact hashed patch and PR creation.
- `.smithers/UI.json` is the strict local-desktop target surface. `sites/contributor` uses published `@smthrs/ui` components for presentation while every executable factory target continues to resolve from the unpublished local Flows checkout.

## Current package-mode boundaries

- Shell processes start at the repository root, including targets declared in nested packages. Nested declarations therefore use `scopedShell('<package>')`, which rewrites package-local binaries and commands to the correct working directory; `//factory:shellScopeLint` rejects drift. Root/factory/scripts/test declarations remain explicitly workspace-relative. Runtime plans and focused executions still verify semantics the typechecker cannot see.
- Package-mode `Agent.Pr` settlement is unbound and approval-required targets have no durable local approval store. TEVM deliberately uses `Agent.Diff` plus the separate GitHub settlement job.
- `Git.Commit`, `Git.Pr`, and some renderer-only GitHub targets are declarations, not a substitute for an operator-approved outward action in this Flows revision.
- `.github/workflows/*.yml` and the composite setup action are rendered by `//.github:github` from `.github/PACKAGE.ts` and the workspace layers (pnpm/node, the Rust layer, the mise layer, `//:vendor` for the `git submodule update --init -- vendor` setup step, and every secret a job's targets declare). The renderer still cannot express the factory's two-job environment/artifact boundary or artifact upload, so the factory workflows stay hand-authored and preserved, and `parity-suites.yml` no longer uploads artifacts.
- The Node runtime declaration reads the compatible `engines.node` range. `.nvmrc`, factory policy, preflight, and CI setup jointly enforce the exact Node release.

## Validation commands

```bash
pnpm factory:preflight
pnpm factory:check
pnpm factory:typecheck
pnpm factory:runtime-check
pnpm factory:ui-check
pnpm exec smthrs target //:mechanicalPrePush --no-cache
pnpm exec smthrs target //:externalIntegrationTests --no-cache
pnpm exec smthrs query '//...'
pnpm exec smthrs target //workflows/issue-to-pr:implementIssue \
  --plan --input issue=123 --input type=bug --input approval=factory:ready
```

The authoritative contributor contract is `AGENTS.md`; operator setup and the issue lifecycle are documented in `factory/README.md`.
The PR-history evidence behind TEVM-specific lints and codegen lanes is recorded in `factory/pr-history.md`.
