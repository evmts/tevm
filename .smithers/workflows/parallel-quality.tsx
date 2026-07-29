// smithers-source: authored
// smithers-display-name: Parallel Quality Work
/** @jsxImportSource smithers-orchestrator */
import { CodexAgent as SmithersCodexAgent, OpenCodeAgent, createSmithers } from "smithers-orchestrator";
import { z } from "zod/v4";

const STAGE = "/Users/williamcory/quality-work";
const MONO = "/Users/williamcory/tevm-monorepo";
const ORG = "evmts";

const sol = (cwd: string) => new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true });
const kimi = (cwd: string) => new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd });

const outSchema = z.looseObject({
	lane: z.string(),
	whatChanged: z.string(),
	prUrl: z.string().default(""),
	verified: z.boolean().default(false),
	evidence: z.string().default(""),
	findings: z.array(z.string()).default([]),
	blockers: z.array(z.string()).default([]),
	summary: z.string(),
});

const inputSchema = z.object({ noop: z.boolean().default(false) });

const { Workflow, Task, Parallel, smithers } = createSmithers({ input: inputSchema, out: outSchema });

/**
 * IMPORTANT constraint shared by every lane: three other runs are ALREADY working this stack.
 * A codex sol oneshot is merging nine PRs into evmts/tevm right now, and two workflows are
 * preparing the satellite repos. So every lane here must avoid the files those touch, work in
 * its own clone, and open its own PR.
 */
const SHARED = `SHARED RULES — read carefully, several concurrent runs are in flight:

- Another agent is RIGHT NOW merging nine PRs into ${ORG}/tevm (#2076-#2084) and cutting a release. Do NOT merge anything, do NOT push to main, and do NOT touch those PRs' branches.
- Do NOT work in ${MONO} — a live session owns it. Clone fresh: git clone https://github.com/${ORG}/<repo> ${STAGE}/<lane-name>
- Open ONE focused PR from a branch named quality/<lane-name>. Leave it open for review; never merge it.
- AVOID files the in-flight PRs touch, or you will create merge conflicts for the agent merging them. Check first with:
    gh pr list --repo ${ORG}/tevm --json number,files --jq '.[].files[].path' | sort -u
  Those currently include packages/actions, packages/errors, packages/node, packages/server, packages/memory-client and docs/node/pages/api/methods.mdx. If your lane must touch one, keep the change minimal and say so in your report.
- Run everything you claim. Paste REAL output. Never report a passing suite you did not execute — a precise blocker is worth more than a false success.
- Repo conventions (${MONO}/CLAUDE.md): source is JavaScript with JSDoc, not TypeScript; one item per file; complete JSDoc with @throws and working @example blocks; explicit return types; new public API must be added to every barrel file recursively including the top-level tevm package. NEVER mock if it can be avoided — use real clients and real RPC (mainnet or https://mainnet.optimism.io). Run tests with vitest, never bare 'bun test', and never the interactive 'test' script.`;

const LANES = [
	{
		key: "review-prs",
		engine: "sol",
		title: "Adversarially review the nine in-flight PRs",
		prompt: `You are performing a REAL code review of the nine open PRs in ${ORG}/tevm (#2076, #2077, #2078, #2079, #2080, #2081, #2082, #2083, #2084). They are about to be merged and are the only review these EVM-correctness changes will get, so this is high-stakes.

They were produced by automated agents fixing bugs that viem's test-migration PR documented. Titles: send-unsigned-tx, fork-state-reads (test-only), timestamp-interval, impersonation (adds opt-in strictImpersonation), ipc-server, storage-padding, mining-modes, the CI unbreaking PR, and the WebSocket server.

This lane is READ-ONLY on code: do not open a PR of your own and do not push commits. Your deliverable is review feedback.

1. For each PR: \`gh pr diff <n> --repo ${ORG}/tevm\` and read it properly.
2. Hunt for REAL defects, not style nits. Prioritise: incorrect EVM/JSON-RPC semantics versus what geth/anvil actually do; off-by-one and encoding errors (padding, byte lengths, hex casing); resource leaks (the interval-mining timer must be stoppable or it will hang test processes; WebSocket/IPC connections must clean up); unhandled error paths; behaviour changes that are silently BREAKING (strictImpersonation is supposed to default to false — verify it actually does); and tests that assert the implementation rather than the specification.
3. Verify claims. Where a PR says a test passes, check the test actually exercises the fixed path rather than trivially passing. #2077 deliberately contains only a regression test because the bug could not be reproduced on main — confirm that test would genuinely FAIL against the buggy behaviour it describes, since a regression test that cannot fail is worthless.
4. Cross-PR interactions matter: #2080 (IPC) and #2084 (WebSocket) both add JSON-RPC transports and both touch the lockfile — check for duplicated logic that should be shared, and inconsistent subscription handling between them.
5. Post your findings as PR review comments with \`gh pr comment <n> --repo ${ORG}/tevm --body "..."\`. Be specific: file, line, what is wrong, why it matters, and the suggested fix. If a PR is genuinely clean, say so briefly rather than inventing concerns.

Report every finding you posted, ranked most severe first, in the findings array.`,
	},
	{
		key: "docs-vocs-core",
		engine: "sol",
		title: "Upgrade tevm core docs from vocs 1.4.1 to latest 2.x",
		prompt: `The tevm core docs site at docs/node is pinned to vocs 1.4.1. Latest is 2.7.2. Upgrade it.

${SHARED}

1. Clone ${ORG}/tevm to ${STAGE}/docs-vocs-core, branch quality/docs-vocs-core.
2. Confirm the current latest with \`npm view vocs version\` and upgrade docs/node to it. 1.x -> 2.x is a MAJOR with breaking config and API changes — read the vocs changelog/migration notes and actually resolve them rather than bumping the version and hoping.
3. The site MUST build. Run the build and paste real output. A docs site that does not build is not documentation, and "the version number is higher" is not the deliverable.
4. While you are in there, fix what the upgrade exposes: broken links, dead pages, stale code samples that no longer compile against current APIs, and examples using APIs that were renamed. Do not do a wholesale rewrite — this lane is the upgrade plus the breakage it reveals.
5. docs/node/pages/api/methods.mdx is touched by an in-flight PR — avoid editing that specific file if you can, and keep it minimal if you cannot.
6. Open the PR with a body describing the breaking changes you had to handle, so a reviewer can follow the migration.`,
	},
	{
		key: "coverage-core",
		engine: "kimi",
		title: "Raise test coverage on under-tested core packages",
		prompt: `Improve real test coverage in ${ORG}/tevm core packages.

${SHARED}

1. Clone to ${STAGE}/coverage-core, branch quality/coverage-core.
2. Find where coverage is genuinely weakest. Many packages declare coverage thresholds in vitest.config.ts (with autoUpdate) — read those numbers to find the low ones, then confirm by running coverage for a few candidates. AVOID packages/actions, packages/errors, packages/node, packages/server and packages/memory-client: in-flight PRs touch them and you would cause conflicts. Good candidates are the smaller, self-contained packages (utils-adjacent helpers, rlp, trie, tx, txpool, predeploys, receipt-manager, sync-storage-persister, address, block, consensus).
3. Pick 2-4 packages and write MEANINGFUL tests: real edge cases, error paths, and boundary conditions that would actually catch a regression. Do NOT pad coverage with tests that call a function and assert it does not throw — that raises a number while catching nothing, and is worse than no test because it looks like protection.
4. NEVER mock if you can avoid it (repo rule). Use real clients and real RPC where needed. Repetition in test files is fine; ts-ignore in tests is fine.
5. Run the suites you wrote and paste real output, including the coverage delta per package. Do not update coverage threshold numbers by hand — the configs autoUpdate.
6. Open the PR listing per-package before/after coverage.`,
	},
	{
		key: "jsdoc-core",
		engine: "kimi",
		title: "Fix missing and wrong JSDoc across the core public API",
		prompt: `Audit and improve JSDoc across ${ORG}/tevm's public API. The repo convention is explicit: when JSDoc is missing you add it, and existing JSDoc may be WRONG so fix it.

${SHARED}

1. Clone to ${STAGE}/jsdoc-core, branch quality/jsdoc-core.
2. Audit the public API surface — what the barrel files export — for JSDoc that is missing, incomplete, or inaccurate. Per CLAUDE.md every public item wants a description, @param, @returns, @throws, and a COMPLETE working @example: real imports, no "..." elisions, code a reader could paste and run.
3. Correctness over volume. An @example that does not actually work, or a @param that describes a parameter the function no longer takes, is worse than nothing because readers trust it. Where you can, base examples on the package's own tests, which are known to work.
4. Prefer the repo's inline-import style in JSDoc types (e.g. @param {import('../common/CallEvents.js').CallEvents} events) rather than adding top-level imports, for tree-shaking.
5. AVOID packages/actions, packages/errors, packages/node, packages/server and packages/memory-client — in-flight PRs touch them. Plenty of other packages need this.
6. Verify you broke nothing: run typecheck (the repo uses checkJs, so bad JSDoc types are real type errors) and the affected packages' tests. Paste real output.
7. Open the PR summarising which packages you covered and any places where the existing JSDoc was actively wrong — those are worth calling out as findings.`,
	},
	{
		key: "utils-phase0",
		engine: "sol",
		title: "Execute Phase 0 of the @tevm/utils retirement",
		prompt: `Execute the cheapest, fully independent phase of retiring @tevm/utils.

${SHARED}

BACKGROUND: @tevm/utils is being retired in favour of @tevm/voltaire (published on npm at 0.4.0 with real ESM+CJS JS bindings, 71 subpath exports). A feasibility assessment found that ~119 of @tevm/utils's ~140 exports are pure pass-throughs of viem, abitype and @evmts/zevm — only signature.js contains original crypto. A full report is at /Users/williamcory/Desktop/tevm-stack-readiness/utils-voltaire.html — READ IT FIRST.

Phase 0 from that report is pure deletion and needs no voltaire work and no approvals:
1. Clone to ${STAGE}/utils-phase0, branch quality/utils-phase0.
2. Remove the two self-declared backward-compatibility exports (GenesisState and AsyncEventEmitter) from packages/utils, updating any internal callers to import from the real source instead.
3. Resolve the bytesToBigint / bytesToBigInt casing duplicate — keep the correctly-cased one, migrate callers, remove the other.
4. This is a PUBLIC API change, so it needs a changeset, and the correct bump is a MAJOR/breaking one for @tevm/utils unless these exports were explicitly marked deprecated-for-removal. Read what the code says about them and choose honestly; if you are unsure whether removal is safe, do the migration but say plainly in the PR that the bump level needs a human decision.
5. Do NOT attempt the larger migration (rewriting ~119 pass-through call sites, or moving signature.js to voltaire). That is later phases and would collide with the in-flight merges.
6. Run typecheck and the affected packages' tests. Paste real output. Open the PR referencing the assessment.`,
	},
	{
		key: "viem-review",
		engine: "kimi",
		title: "Review the two viem fork PRs and scope what WS/IPC unblocks",
		prompt: `Review the two open PRs in the ${ORG}/viem fork and produce a concrete follow-up scope.

${SHARED}
(Note: the shared rules about tevm PR files do not apply here — this lane works in ${ORG}/viem, a different repo. Still open a PR/comment rather than merging.)

CONTEXT: ${ORG}/viem is a fork of wevm/viem being migrated from anvil to tevm.
- PR #1 added an in-process tevm test lane, migrating what tevm rc.151 supported.
- PR #2 ("Complete the Anvil-to-Tevm test migration", 291 files) deleted test/src/anvil.ts, migrated the mainnet/OP-Stack/ZKsync suites, and pointed Alto at an HTTP tevm/server. It kept FOUR WebSocket/IPC suites on an explicit opt-in anvil lane because @tevm/server was HTTP-only.

THAT LAST CONSTRAINT IS NOW BEING LIFTED: tevm PRs #2084 (WebSocket JSON-RPC transport with eth_subscribe) and #2080 (IPC transport) are about to merge, so the ws/ipc suites will be migratable once those publish.

1. Clone ${ORG}/viem to ${STAGE}/viem-review. Read both PRs (\`gh pr diff <n> --repo ${ORG}/viem\`).
2. Review PR #2 for real problems: tests weakened or silently skipped during migration; assertions that now verify tevm's behaviour instead of the behaviour the test was written to protect; leaked node/server instances between tests; and anywhere the migration changed what a test actually proves. PR #2's own description admits remaining failures (tevm method gaps, InvalidBlockError fork divergences, Alto/account-abstraction issues, snapshot drift) — assess whether each is genuinely a tevm gap or a migration mistake, because those need very different fixes.
3. Write a precise follow-up scope for finishing the job once WS/IPC land: exactly which four suites are still on anvil, what each needs, and what would then remain before anvil can be removed from the build and CI entirely (note that \`pnpm install\` still runs contracts:build with forge, which is a separate Foundry dependency from anvil).
4. Post your review as comments on PR #2 with \`gh pr comment 2 --repo ${ORG}/viem --body "..."\`, and put the follow-up scope in your report findings.`,
	},
] as const;

export default smithers(() => (
	<Workflow name="parallel-quality">
		<Parallel>
			{LANES.map((l) => (
				<Task id={l.key} output={outSchema} agent={l.engine === "sol" ? sol(STAGE) : kimi(STAGE)}>
					{`LANE: ${l.title}\n\n${l.prompt}`}
				</Task>
			))}
		</Parallel>
	</Workflow>
));
