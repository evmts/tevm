// smithers-source: authored
// smithers-display-name: Reseat Kimi Lanes
/** @jsxImportSource smithers-orchestrator */
import { ClaudeCodeAgent as SmithersClaudeCodeAgent, createSmithers } from "smithers-orchestrator";
import { z } from "zod/v4";

const STAGE = "/Users/williamcory/quality-work";
const ORG = "evmts";

const opus = (cwd: string) => new SmithersClaudeCodeAgent({ model: "opus", cwd });

const outSchema = z.looseObject({
	lane: z.string(),
	summary: z.string(),
	prUrl: z.string().default(""),
	verified: z.boolean().default(false),
	findings: z.array(z.string()).default([]),
	blockers: z.array(z.string()).default([]),
});

const inputSchema = z.object({ noop: z.boolean().default(false) });
const { Workflow, Task, Parallel, smithers } = createSmithers({ input: inputSchema, out: outSchema });

const SHARED = `SHARED RULES:
- Several other runs are live. Do NOT work in /Users/williamcory/tevm-monorepo. Clone fresh into ${STAGE}/<lane>.
- Open a PR from branch quality/<lane>. Never merge anything.
- Run what you claim and paste REAL output. A precise blocker beats a false success.
- These docs sites are ALREADY LIVE and serving (verified HTTP 200), so do not break a working site. Verify the site still builds before you push.`;

/** The three UI lanes plus the viem review that were stranded when kimi hit its billing-cycle quota. */
const LANES = [
	{
		key: "ui-voltaire",
		repo: "voltaire",
		sub: "voltaire",
		extra: "Voltaire is Ethereum primitives and cryptography (Zig + Rust), published on npm as @tevm/voltaire@0.4.0 with real ESM+CJS JS bindings, 71 subpath exports. A good interactive component here is a live encode/decode or hashing playground built on those published bindings.",
	},
	{
		key: "ui-guillotine-mini",
		repo: "guillotine-mini",
		sub: "mini",
		extra: "guillotine-mini is a tiny, simple EVM written in Zig. A natural interactive component is a compact bytecode/opcode stepper that makes the EVM's simplicity legible.",
	},
	{
		key: "ui-zevm",
		repo: "zevm",
		sub: "zevm",
		extra: "zevm is the EVM implementation tevm consumes as a pnpm workspace member, published as @evmts/zevm. It ships native platform packages under npm/platforms/*. Documenting platform support clearly matters here.",
	},
] as const;

export default smithers(() => (
	<Workflow name="reseat-kimi">
		<Parallel>
			{LANES.map((l) => (
				<Task id={l.key} output={outSchema} agent={opus(STAGE)}>
					{`You own the visual/UI layer of the docs site for ${ORG}/${l.repo}, served at ${l.sub}.tevm.sh.

${SHARED}

CONTEXT: ${l.extra}

A documentation agent already wrote the CONTENT for this site and it is live. You own theme, layout and interactive components — do not rewrite its prose.

DO THIS:
1. Clone ${ORG}/${l.repo} to ${STAGE}/${l.key}, branch quality/${l.key}. Find the docs site (it may be under docs/ or site/) and check open PRs too, since recent docs work may still be on an unmerged branch — build on that branch if so, and say which you used.
2. Apply a theme consistent across the tevm.sh family: shared color tokens, typography, logo treatment, and BOTH dark and light mode correct. Check an existing sibling site (e.g. bundler.tevm.sh or contract.tevm.sh) to match rather than inventing a new look.
3. Build the hero/landing: what this project is, a copy-paste install line, and a code sample that renders well.
4. Add ONE genuinely useful interactive component suited to this project (see context above). Keep it dependency-light and self-contained. One good component beats three broken ones.
5. Add cross-repo navigation linking the family: tevm.sh plus the contract, logger, test, bundler, cli, ethers, mud, examples, voltaire, guillotine, mini and zevm subdomains — all of which are live.
6. Verify the site BUILDS and renders correctly in both themes. Paste real build output.
7. Commit, push, open the PR.`}
				</Task>
			))}
			<Task id="viem-review" output={outSchema} agent={opus(STAGE)}>
				{`Review the two open PRs in the ${ORG}/viem fork and produce a concrete follow-up scope.

${SHARED}

CONTEXT: ${ORG}/viem is a fork of wevm/viem being migrated from anvil to tevm.
- PR #1 added an in-process tevm test lane.
- PR #2 ("Complete the Anvil-to-Tevm test migration", 291 files) deleted test/src/anvil.ts, migrated the mainnet/OP-Stack/ZKsync suites, and pointed Alto at an HTTP tevm/server. It kept FOUR WebSocket/IPC suites on an opt-in anvil lane because @tevm/server was HTTP-only.

THAT CONSTRAINT IS NOW LIFTED: tevm PRs #2084 (WebSocket JSON-RPC with eth_subscribe) and #2080 (IPC) are MERGED into evmts/tevm main. They are not yet published to npm (publishing is blocked on npm trusted-publisher config), so the viem fork cannot consume them from the registry yet — factor that into sequencing.

DO THIS:
1. Clone ${ORG}/viem to ${STAGE}/viem-review. Read both PRs with \`gh pr diff <n> --repo ${ORG}/viem\`.
2. Review PR #2 for REAL problems: tests weakened or silently skipped during migration; assertions that now verify tevm's behaviour instead of what the test was written to protect; leaked node/server instances between tests; anywhere the migration changed what a test actually proves.
3. PR #2's own description admits remaining failures (tevm method gaps, InvalidBlockError fork divergences, Alto/account-abstraction issues, snapshot drift). Assess each: is it a genuine tevm gap or a migration mistake? Those need very different fixes, and conflating them is how real bugs get written off as "known issues".
4. Write a precise follow-up scope for finishing the job once WS/IPC publish: exactly which four suites remain on anvil, what each needs, and what would then be left before anvil can leave the build and CI entirely. Note that \`pnpm install\` still runs contracts:build with forge, which is a Foundry dependency separate from anvil.
5. Post the review as comments on PR #2 (\`gh pr comment 2 --repo ${ORG}/viem --body "..."\`) and put the follow-up scope in your findings. Do not merge anything.`}
			</Task>
		</Parallel>
	</Workflow>
));
