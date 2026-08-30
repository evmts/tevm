# TEVM coding factory

The coding factory is the executable governance layer over TEVM's existing Nx, pnpm, Vitest, Biome, Cargo, Foundry, conformance, and release commands. Package-mode declarations live in `WORKSPACE.ts`, root `PACKAGE.ts`, and package-local `PACKAGE.ts` files. They run against the unpublished sibling checkout at `../flows/flows`; registry fallbacks are forbidden.

## Setup

```bash
node scripts/factory/bootstrap.mjs --install
pnpm factory:preflight
pnpm factory:check
pnpm factory:runtime-check
pnpm factory:query
```

The bootstrapper is conservative: it creates a missing Flows or Zevm sibling at the revision in `factory/policy.json`, but it never rewrites an existing checkout. With `--install`, it also links the local Flows CLI globally (the generated Git hooks invoke `smthrs` from `PATH`) and installs the declared hooks. Preflight verifies that both the installed packages and hook CLI resolve through that exact local checkout and that the coding CLI/model pins match policy.

Full preflight also checks that `TEVM_TEST_ALCHEMY_KEY`,
`TEVM_RPC_URLS_MAINNET`, and `TEVM_RPC_URLS_OPTIMISM` are present without
printing their values. The RPC variables use the repository's existing
comma-separated failover-list convention.

`factory:runtime-check` is model-free. It validates the complete graph and typed approval refusals, then binds Flows' scripted fake agent to prove a candidate can pass its gate and that an out-of-scope edit is rejected without touching the tracked tree.

For the smallest proof, run:

```bash
pnpm exec smthrs target //factory:check --plan
pnpm exec smthrs target //factory:check
pnpm exec smthrs target //packages/address:typecheck --plan
```

## Issue lifecycle

1. GitHub issue forms produce one supported `type:*` label and required, machine-checkable sections.
2. `scripts/factory/issue-intake.mjs` normalizes the event into the contract in `factory/schemas/issue-intake.schema.json`. It copies no issue body into its output and treats issue content as untrusted.
3. `//workflows/issue-triage:triageIssue` can create a reviewable plan under `factory/queue/issues/`. It has no outward GitHub capability.
4. A maintainer applies `factory:ready`. Any pause or security label wins over approval.
5. Bug/docs routes use `//workflows/issue-to-pr:implementIssue` to create a mechanically gated code candidate. Feature/maintenance routes use `//workflows/issue-triage:triageIssue` to create a queue-plan candidate; conformance intake does the same before the specialized fixture lane is invoked. Candidate targets cannot commit, push, or open a PR.
6. The GitHub settlement job runs only for the approval label and the protected `factory-approval` environment. It reruns route-appropriate checks before pushing a dedicated branch and opening either an implementation PR or a plan PR.

Example local commands:

```bash
node scripts/factory/issue-intake.mjs --issue 123 --format markdown
pnpm exec smthrs target //workflows/issue-triage:triageIssue \
  --input issue=123 --input type=bug
pnpm exec smthrs target //workflows/issue-to-pr:implementIssue \
  --input issue=123 --input type=bug --input approval=factory:ready
```

Package-mode Flows currently has no durable approval store and its `Agent.Pr` settlement interface is intentionally unbound. The factory therefore uses `Agent.Diff` for the candidate and keeps the outward Git operation in a distinct GitHub Environment gate. This is a visible boundary, not a silent fallback.

## Gate layers

- `//factory:check`: policy, queue contract, deterministic intake tests,
  repository identity, source integrity, and declaration safety.
- `//factory:declarationsTypecheck`: every `WORKSPACE.ts`/`PACKAGE.ts` declaration checked against the real linked package types; no ambient API mask.
- `//factory:shellScopeLint`: nested Shell declarations must use the typed package-cwd adapter, preventing tools from silently running against the repository root.
- `//factory:repositoryMetadataLint`: every declared package repository and release-workflow identity resolves to `evmts/tevm`; `repositoryMetadataWrite` is the bounded mechanical repair.
- `//factory:sourceIntegrity`: no unresolved merge conflicts or orphaned gitlinks enter a candidate, including generated documentation.
- `//:mechanicalPrePush`: repository lint, typecheck, and hermetic tests that can execute against an agent's scratch candidate. It disables the Nx daemon and Nx Cloud, runs static analysis before tests with two Nx workers, permits loopback servers, and denies internet egress.
- `//:externalIntegrationTests`: the compiler download plus live viem, MCP, and CLI integration suites. This maintainer lane declares its network and RPC-secret capabilities explicitly and is never part of an agent candidate loop.
- `//:agentLints`: judgment checks over the applied diff, including JSON-RPC wire contracts, regression-proof quality, and semantic scope derived from Will Cory's PR history.
- `//:prePush`: candidate-safe mechanical checks, the external-integration lane, and agentic judgment.
- `//:ci`: the full build, coverage, fixture, Rust, package, docs, factory, and changeset suite.

To exercise the trust boundary independently:

```bash
pnpm exec smthrs target //:mechanicalPrePush --no-cache
pnpm exec smthrs target //:externalIntegrationTests --no-cache
```

Release, prerelease, snapshot, deployment, commit, push, PR, issue mutation, and fork actions remain outward operations. Their required secrets are declared, never ambient, and their approval rules are recorded in `factory/policy.json`.

## PR-history-derived lanes

The evidence and exact PR links live in `factory/pr-history.md`. The resulting
reusable lanes are local `Agent.Diff` candidates:

```bash
pnpm factory:rpc-repair -- \
  --input method=eth_getStorageAt \
  --input 'report=short storage values are right-padded; expect a 32-byte left-padded wire value' \
  --input 'reference=Ethereum JSON-RPC eth_getStorageAt'

pnpm factory:surface-sync -- \
  --input package=packages/actions \
  --input symbol=ethSendUnsignedTransactionHandler

pnpm exec smthrs target //workflows/add-jsonrpc-method:addJsonrpcMethod \
  --input method=eth_getBlockReceipts
```

`repairRpcRegression` writes a failing public-boundary regression first and
repairs the full request/result/handler/procedure/dispatch contract.
`syncPublicSurface` cannot touch implementations; it synchronizes named barrels,
the existing `tevm` facade, written/generated docs, and the changeset. The
existing `addJsonrpcMethod` lane now includes the same wire-serialization and
negative-branch matrix for new methods.

## Contributor UI

The contributor portal is a static Smithers-components app. It opens explicit
GitHub issue forms, the fork confirmation page, discussions, docs, and the
private security-advisory path; it never accepts a token or performs a GitHub
write. Policy, issue-form, target, and toolchain facts are generated from their
authoritative repository sources.

```bash
pnpm factory:contributor-data-check
pnpm factory:ui-check
pnpm factory:ui
```

Open the repository in the local Flows desktop to load `.smithers/UI.json`.
That strict manifest exposes safe no-input checks, lints, recipes, and gates
through the desktop's existing opaque target grants. Parameterized issue,
JSON-RPC, conformance, coverage, and public-surface lanes remain copyable in the
portal so their required input is visible before execution. Outward commit,
fork, PR, release, and deployment targets are deliberately absent from the
one-click manifest.

## CI and the local Flows source

CI checks out `smithersai/flows-proto` at the policy SHA, links it into the same `../flows/flows` location used locally, and installs with the checked-in lockfile. Update the policy SHA, local link verification, and CI checkout together when upgrading Flows.

## Operator checklist

- Configure the GitHub `factory-approval` environment with required maintainers before enabling issue settlement.
- Configure the `factory-admin` environment with required maintainers, then manually dispatch `Configure coding factory` to upsert `.github/labels.yml`. It never deletes unrelated labels.
- Add `OPENAI_API_KEY` as an environment-scoped secret for programmatic Codex CLI use; never expose it to fork-triggered jobs.
- Create labels from `.github/labels.yml` or install the repository settings app that syncs them.
- Run intake on opened/edited issues without secrets or write permissions.
- Keep `factory:ready` restricted to maintainers/triagers and remove it whenever issue scope changes.
- Investigate `.flows/artifacts/` when an agent loop exhausts; failed candidates are preserved instead of published.
