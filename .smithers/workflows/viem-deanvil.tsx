// smithers-source: authored
// smithers-display-name: Viem De-Anvil
/** @jsxImportSource smithers-orchestrator */
import {
	ClaudeCodeAgent as SmithersClaudeCodeAgent,
	CodexAgent as SmithersCodexAgent,
	OpenCodeAgent,
	createSmithers,
} from "smithers-orchestrator";
import { z } from "zod/v4";

const VIEM = "/Users/williamcory/evmts-viem";
const MONO = "/Users/williamcory/tevm-monorepo";
const BASE = "tevm-test/final";
const BRANCH = "tevm-test/deanvil";

/** Test domains, partitioned so lanes own disjoint files and rarely collide. */
const DOMAINS = [
	{ key: "actions-public", paths: ["src/actions/public"], engine: "codex" },
	{ key: "actions-wallet-test", paths: ["src/actions/wallet", "src/actions/test"], engine: "codex" },
	{ key: "actions-misc", paths: ["src/actions/ens", "src/actions/getContract.test.ts", "src/actions/index.test.ts"], engine: "kimi" },
	{ key: "account-abstraction", paths: ["src/account-abstraction"], engine: "opus" },
	{ key: "clients-chains", paths: ["src/clients", "src/chains", "src/constants", "src/node"], engine: "kimi" },
	{ key: "chain-extensions", paths: ["src/op-stack", "src/celo", "src/linea", "src/experimental"], engine: "codex" },
	{ key: "core-utils", paths: ["src/utils", "src/errors", "src/accounts", "src/siwe", "src/ens", "src/nonce"], engine: "opus" },
] as const;

const agentFor = (engine: string, cwd: string) =>
	engine === "codex"
		? new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true })
		: engine === "opus"
			? new SmithersClaudeCodeAgent({ model: "opus", cwd })
			: new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd });

const harnessSchema = z.looseObject({
	summary: z.string(),
	harnessApi: z.string(),
	filesDeleted: z.array(z.string()).default([]),
	anvilRemovedFrom: z.array(z.string()).default([]),
	remainingAnvilBlockers: z.array(z.string()).default([]),
	matchersAvailable: z.array(z.string()).default([]),
});

const migrateSchema = z.looseObject({
	domain: z.string(),
	filesMigrated: z.number().default(0),
	filesRemainingOnAnvil: z.number().default(0),
	testsPass: z.boolean().default(false),
	testOutput: z.string().default(""),
	matchersUsed: z.array(z.string()).default([]),
	blockers: z.array(z.string()).default([]),
	summary: z.string(),
});

const verifySchema = z.looseObject({
	anvilFullyRemoved: z.boolean().default(false),
	remainingAnvilRefs: z.array(z.string()).default([]),
	suitePasses: z.boolean().default(false),
	testOutput: z.string().default(""),
	prUrl: z.string().default(""),
	summary: z.string(),
});

const inputSchema = z.object({
	openPr: z.boolean().default(true),
});

const { Workflow, Task, Sequence, Parallel, smithers } = createSmithers({
	input: inputSchema,
	harness: harnessSchema,
	migrate: migrateSchema,
	verify: verifySchema,
});

const CONTEXT = `CONTEXT — read before doing anything:

The repo is the viem fork at ${VIEM}. Branch ${BASE} already added a tevm test lane (see test/setup.tevm.ts)
alongside the existing anvil harness, migrating part of the suite. Roughly 299 files still reference anvil.
The goal now is to finish the job: anvil gone from the build and CI entirely, the bespoke test harness deleted
or made drastically simpler, and every migrated test written IDIOMATICALLY against the tevm test library —
actually using its matchers, not just swapping the client.

The tevm monorepo is at ${MONO} (read-only reference). The test library lives in:
  - ${MONO}/extensions/test-matchers  (the matchers: toBeAddress, toEqualAddress, toThrowContractError,
    toBeReverted / toBeRevertedWithError, event matchers with withEventArgs, etc.)
  - ${MONO}/extensions/test-node
  - ${MONO}/test/test-utils and ${MONO}/test/vitest-matchers
Read their sources and READMEs so you use the REAL API, never an invented one.

KNOWN BLOCKER: @tevm/server currently serves HTTP only — it has no WebSocket server — so viem's webSocket()
and ipc() transport tests cannot run against tevm yet. Work to add WS support to tevm is running separately.
Do NOT fake it, and do NOT delete those tests. Leave ws/ipc transport tests on anvil if and only if there is
genuinely no alternative, and report them under blockers so the last anvil removal can follow the tevm fix.

HONESTY RULES: run the tests you claim pass and paste real output. Never delete a test to make a suite green —
if a test cannot migrate, leave it and report why. Never claim anvil is removed while a reference remains.`;

export default smithers((ctx) => {
	const harness = ctx.outputMaybe("harness", { nodeId: "harness" });
	const migrations = ctx.outputs.migrate ?? [];

	const migrateRollup = migrations
		.map((m: any) => `- ${m.domain}: ${m.filesMigrated} migrated, ${m.filesRemainingOnAnvil} still on anvil, tests pass=${m.testsPass}${m.blockers?.length ? `, blockers: ${m.blockers.join("; ")}` : ""}`)
		.join("\n");

	return (
		<Workflow name="viem-deanvil">
			<Sequence>
				<Task id="harness" output={harnessSchema} agent={agentFor("codex", VIEM)}>
					{`${CONTEXT}

YOU ARE THE HARNESS agent. You go FIRST and you define the foundation every migration lane builds on. Nothing else runs until you finish, so be decisive and leave a clean, documented API.

1. Create branch ${BRANCH} from ${BASE}.
2. Study the existing harness: test/setup.ts, test/setup.global.ts, test/setup.shared.ts, test/setup.tevm.ts, test/src/anvil.ts and the rest of test/src/. Understand exactly what anvil-specific machinery exists (prool proxy, port allocation, per-worker instances, startup polling, snapshot/revert between tests, chain resets).
3. Redesign it around tevm as the ONLY backend. Because tevm runs in-process there should be no ports, no proxy, no child processes, and no startup polling — deleting that machinery is the entire point. Aim to delete test/src/anvil.ts and collapse the setup files into the smallest thing that works.
4. Export a small, ergonomic, well-documented API the migration lanes will use everywhere (e.g. a client factory per test, reset/snapshot helpers, funded accounts, contract deployment helpers). Write it once, write it well; seven lanes are about to depend on it.
5. Register the tevm vitest matchers globally in the setup so every test file can use them without importing.
6. Strip anvil from the build and CI: package.json scripts, .github/workflows/*.yml (the Foundry install step, any anvil service), environment configs, docs in .github/CONTRIBUTING.md. If something still needs it, say so explicitly under remainingAnvilBlockers.
7. Migrate a couple of representative test files yourself as a WORKED EXAMPLE of the idiomatic style — including matcher usage — so the lanes have a pattern to copy rather than inventing seven different styles.
8. Run those tests. Commit and push ${BRANCH}.

Report: the harness API (exact exported names and signatures — the lanes get this text verbatim), files deleted, where anvil was removed from, remaining blockers, and the matcher names actually available.`}
				</Task>
				<Parallel>
					{DOMAINS.map((d) => (
						<Task id={`migrate-${d.key}`} output={migrateSchema} agent={agentFor(d.engine, VIEM)}>
							{`${CONTEXT}

YOU ARE A MIGRATION LANE. Your domain is ${d.key}. You own ONLY these paths:
${d.paths.map((p) => `  - ${p}`).join("\n")}

Six other lanes are migrating other directories on the SAME branch (${BRANCH}) at the same time. Therefore:
- Touch ONLY files under your paths. Never edit the shared harness, CI files, or another lane's directory.
- If you need a harness change, do NOT make it — report it under blockers instead.
- Commit frequently with small, scoped commits, and \`git pull --rebase\` before each push so you interleave cleanly with the other lanes.

THE HARNESS IS ALREADY BUILT. Use this API exactly as given; do not invent helpers:
${harness?.harnessApi ?? "(harness output unavailable — read test/setup.tevm.ts and the harness commit on the branch before proceeding)"}

Matchers available: ${harness?.matchersAvailable?.join(", ") || "(read extensions/test-matchers in the tevm monorepo)"}

YOUR JOB:
1. git checkout ${BRANCH} && git pull --rebase.
2. Migrate every test in your paths off anvil and onto the tevm harness.
3. Make them IDIOMATIC, which is the actual point of this work — not a mechanical client swap:
   - Use the tevm matchers where they express intent better than manual assertions: revert assertions via toBeReverted / toBeRevertedWithError instead of try/catch on error strings, event assertions with withEventArgs instead of hand-decoding logs, address assertions via toEqualAddress instead of lowercased string compares.
   - Prefer the harness's helpers over hand-rolled setup.
   - Delete now-pointless scaffolding (waiting for a node to boot, port juggling, manual snapshot bookkeeping the harness now does).
   - Keep each test's original INTENT and coverage identical. This is a refactor of how tests run, not what they assert.
4. Run your domain's tests: \`pnpm vitest run <your paths>\`. Iterate until green, or until a failure is genuinely blocked by a missing tevm capability.
5. If a test cannot migrate (ws/ipc transport, a tevm gap, a genuinely anvil-specific behavior), LEAVE IT ON ANVIL and report it under blockers with the reason. Do not delete it and do not fake a pass.
6. Push your commits.

Report: files migrated, files still on anvil, whether tests actually pass (with real output), which matchers you used, and every blocker.`}
						</Task>
					))}
				</Parallel>
				<Task id="verify" output={verifySchema} agent={agentFor("codex", VIEM)}>
					{`${CONTEXT}

YOU ARE THE VERIFIER. All seven migration lanes have finished on branch ${BRANCH}.

LANE RESULTS:
${migrateRollup || "(none reported)"}

HARNESS BLOCKERS: ${harness?.remainingAnvilBlockers?.join("; ") || "none reported"}

1. git checkout ${BRANCH} && git pull.
2. Audit the truth rather than trusting the lanes: \`git grep -il anvil -- src test .github package.json\` (exclude site/.cache, CHANGELOG.md, and site build output). Every surviving hit is either a real blocker or unfinished work — list them.
3. Reconcile the lanes: fix conflicting or duplicated harness usage, remove leftover dead imports, and make the style consistent across domains (seven agents will have drifted).
4. Confirm anvil is gone from the build and CI: no Foundry install step, no anvil binary requirement, no prool anvil pool, and anvil/prool removed from package.json dependencies if nothing references them.
5. Run the FULL test suite. Report real output, including failures. Do not paper over a red suite.
6. Update .github/CONTRIBUTING.md and the test README to describe the new tevm-only workflow — contributors should no longer be told to install Foundry.
7. ${ctx.input.openPr ? `Open a PR: gh pr create --repo evmts/viem --base main --head ${BRANCH} --title "..." --body "..." with a thorough description covering what anvil machinery was deleted, how much simpler the harness is now (before/after line counts), which tevm matchers the suite now uses, real test evidence, and an explicit list of anything still on anvil and why. End the body with "🤖 Generated with Smithers multi-agent orchestration".` : "Do not open a PR; just report."}

Report honestly: whether anvil is fully removed, every remaining reference, whether the suite passes, and the PR URL.`}
				</Task>
			</Sequence>
		</Workflow>
	);
});
