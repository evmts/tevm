// smithers-source: authored
// smithers-display-name: Tevm — Unblock Viem De-Anvil
/** @jsxImportSource smithers-orchestrator */
import {
	ClaudeCodeAgent as SmithersClaudeCodeAgent,
	CodexAgent as SmithersCodexAgent,
	OpenCodeAgent,
	createSmithers,
} from "smithers-orchestrator";
import { z } from "zod/v4";

const MONO = "/Users/williamcory/tevm-monorepo";
const STAGE = "/Users/williamcory/tevm-fixes";
const REPO = "evmts/tevm";

/**
 * Each gap is quoted from the viem PR's own "Honesty about rc.151" section — these are the
 * documented reasons viem still needs anvil. Fix them at the source, in tevm.
 */
const GAPS = [
	{
		key: "fork-state-reads",
		engine: "codex",
		title: "Locally-written state is invisible on a forked node",
		detail: `Quoted from the viem PR: "on a forked node rc.151 resolves balances and storage through eth_getProof against the upstream *historical* block, so locally written values are invisible."

This is the single biggest blocker — it forces entire matcher families (toHaveState, toHaveStorageAt, toChangeBalance, toChangeTokenBalance) to run only against non-fork createTevmNode() instances. Writing a balance or storage slot locally and reading it back MUST return the local value, not the upstream one. Also: "forked slots other than the lazily cached one read back as zero" — reading an uncached forked storage slot returns 0 instead of fetching it.

Focus on packages/state (the fork transport / proxy StateManager, getProof-based resolution, and the local-vs-remote cache precedence). Local writes must always win over the remote fetch, and an uncached forked slot must fall through to the provider rather than defaulting to zero.`,
	},
	{
		key: "storage-padding",
		engine: "kimi",
		title: "eth_getStorageAt returns the storage word right-padded",
		detail: `Quoted from the viem PR: "eth_getStorageAt returns the storage word right-padded". A storage word must come back as a canonical 32-byte left-padded hex value, matching anvil/geth. viem's setStorageAt/getStorageAt suites diverge because of this. Fix the encoding in the eth_getStorageAt handler and add tests asserting exact byte layout against a known slot.`,
	},
	{
		key: "blob-fork",
		engine: "codex",
		title: "Common.copy() drops customCrypto, breaking forks of blocks with 4844 txs",
		detail: `Quoted from the viem PR: "rc.151's Common.copy() drops customCrypto, so a forked anchor containing EIP-4844 transactions cannot be deserialized." This forced the viem fork to pin to blob-free block 22263621 instead of the natural anchor. Forking any recent mainnet block is effectively broken, which is a major correctness problem well beyond viem.

Fix Common.copy() in packages/common to carry customCrypto through, then verify by forking a mainnet block that CONTAINS type-3 blob transactions and reading it back successfully.`,
	},
	{
		key: "timestamp-interval",
		engine: "kimi",
		title: "anvil_setBlockTimestampInterval is recorded but never applied",
		detail: `Quoted from the viem PR: "anvil_setBlockTimestampInterval is recorded but not applied to mined blocks." The handler stores the interval and then mining ignores it. Make mined blocks actually advance their timestamp by the configured interval, and make anvil_removeBlockTimestampInterval restore default behavior. Test by setting an interval, mining several blocks, and asserting the timestamp deltas.`,
	},
	{
		key: "mining-modes",
		engine: "codex",
		title: "setAutomine and setIntervalMining are unsupported",
		detail: `Quoted from the viem PR, listing what "still needs [anvil]": setAutomine and setIntervalMining. Implement anvil_setAutomine (mine immediately on every accepted transaction) and anvil_setIntervalMining (mine on a wall-clock interval), matching anvil semantics and interacting correctly with the existing manual/auto mining config in packages/node and the mining handlers in packages/actions. Interval mining must be cleanly stoppable so it never leaks a timer and hangs a test process.`,
	},
	{
		key: "send-unsigned-tx",
		engine: "opus",
		title: "sendUnsignedTransaction is unsupported",
		detail: `Quoted from the viem PR, listing what "still needs [anvil]": sendUnsignedTransaction. Implement eth_sendUnsignedTransaction — submit a transaction from an arbitrary sender without a signature, as anvil does. It should interact correctly with impersonation and the txpool. Add tests covering a normal send, a send from an unfunded account, and the resulting receipt.`,
	},
	{
		key: "impersonation",
		engine: "opus",
		title: "Auto-impersonation makes the 'No Signer available' negatives impossible",
		detail: `Quoted from the viem PR: "Tevm auto-impersonates, so the 'No Signer available' negatives cannot hold." Because tevm always impersonates, viem's impersonateAccount / stopImpersonatingAccount suites cannot assert the failure path that anvil produces.

Make this behavior configurable so tevm can faithfully emulate anvil: when impersonation is NOT active for an address and no signer exists, sending from that address should error the way anvil does. Keep the current permissive behavior as the DEFAULT so this is not a breaking change — add an opt-in strict mode (e.g. a node/client option) and make stopImpersonatingAccount meaningful under it. Document the option with JSDoc and examples.`,
	},
	{
		key: "ipc-server",
		engine: "codex",
		title: "No IPC server, so viem's ipc() transport tests need anvil",
		detail: `Quoted from the viem PR: "WebSocket and IPC transports ... still need it [anvil]." WebSocket support is being added in a separate run — YOUR job is IPC. Add an IPC (unix domain socket) JSON-RPC server to packages/server so viem's ipc() transport can connect to a tevm node, including newline-delimited JSON framing and subscription support. Follow whatever module/file layout the WebSocket work establishes if it has already landed; check packages/server for createWebSocketServer before designing yours, and stay consistent with it.`,
	},
] as const;

const agentFor = (engine: string, cwd: string) =>
	engine === "codex"
		? new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true })
		: engine === "opus"
			? new SmithersClaudeCodeAgent({ model: "opus", cwd })
			: new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd });

const fixSchema = z.looseObject({
	gap: z.string(),
	reproduced: z.boolean().default(false),
	fixed: z.boolean().default(false),
	packagesTouched: z.array(z.string()).default([]),
	testsAdded: z.array(z.string()).default([]),
	testOutput: z.string().default(""),
	prUrl: z.string().default(""),
	summary: z.string(),
	notes: z.string().default(""),
});

const inputSchema = z.object({
	openPr: z.boolean().default(true),
});

const { Workflow, Task, Parallel, smithers } = createSmithers({
	input: inputSchema,
	fix: fixSchema,
});

export default smithers((ctx) => (
	<Workflow name="tevm-unblock-viem">
		<Parallel>
			{GAPS.map((g) => {
				const dir = `${STAGE}/${g.key}`;
				return (
					<Task id={`fix-${g.key}`} output={fixSchema} agent={agentFor(g.engine, STAGE)}>
						{`You are fixing a REAL BUG in tevm. Every gap in this workflow was documented by the viem team's own migration PR as a reason viem must keep anvil around. The directive is explicit: fix the blocker in tevm rather than working around it downstream.

THE GAP — ${g.title}:
${g.detail}

SETUP (you work in an isolated clone; seven sibling agents are fixing other gaps in their own clones):
1. mkdir -p ${STAGE} && git clone ${MONO} ${dir} && cd ${dir}
2. git checkout -b fix/${g.key}
3. pnpm install
   NOTE: ${MONO} is the live working tree and other agents are active in it. Work ONLY in ${dir}. Never edit ${MONO}.

METHOD — this repo practices documentation-driven, test-first development (see ${MONO}/CLAUDE.md):
4. REPRODUCE FIRST. Write a failing test that demonstrates the bug before you change any source. If you cannot reproduce it, say so honestly in your report rather than "fixing" something that already works — the viem PR describes rc.151 behavior and some of it may already be fixed on main.
5. Fix the root cause, not the symptom. Trace it to the actual package (packages/state, packages/common, packages/actions, packages/node, packages/server, …).
6. Follow repo conventions strictly: source is JavaScript with JSDoc (NOT TypeScript); one item per file; complete JSDoc including @throws and @example with real runnable examples; explicit return types; add any new public API to every barrel file recursively, including the top-level tevm package directory.
7. NEVER MOCK. This repo's testing convention forbids it — use real clients, real forks, and real RPC. Fork tests should use a real provider; the repo uses mainnet and optimism (https://mainnet.optimism.io) and the TEVM_RPC_URLS_MAINNET / TEVM_RPC_URLS_OPTIMISM env vars.
8. Run the tests with \`pnpm vitest run <path>\` (never bare \`bun test\`, and never the interactive \`test\` script). Paste REAL output in your report. A claimed pass you did not run is worse than a reported failure.
9. Make sure you did not break neighboring tests in the packages you touched.

DELIVER:
10. Commit with an emoji conventional-commit message (🐛 fix(<scope>): … or ✨ feat(<scope>): …), push the branch, and ${ctx.input.openPr ? `open a PR against ${REPO} main with \`gh pr create\` — describe the bug, the root cause you found, the fix, the tests you added, and quote the viem PR line that motivated it. End the body with "🤖 Generated with Smithers multi-agent orchestration".` : "report without opening a PR."}

Report: whether you reproduced it, whether you fixed it, packages touched, tests added, real test output, and the PR URL. If the bug turned out not to exist on current main, report that clearly — that is a valuable finding, not a failure.`}
					</Task>
				);
			})}
		</Parallel>
	</Workflow>
));
