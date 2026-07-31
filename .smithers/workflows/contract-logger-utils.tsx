// smithers-source: authored
// smithers-display-name: Contract Logger Utils
/** @jsxImportSource smithers-orchestrator */
import { ClaudeCodeAgent as SmithersClaudeCodeAgent, CodexAgent as SmithersCodexAgent, createSmithers } from "smithers-orchestrator";
import { z } from "zod/v4";

const STAGE = "/Users/williamcory/stack-prod";
const MONO = "/Users/williamcory/tevm-monorepo";
const ORG = "evmts";

const codex = (cwd: string) => new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true });
const opus = (cwd: string) => new SmithersClaudeCodeAgent({ model: "opus", cwd });

const verifySchema = z.looseObject({
	repo: z.string(),
	buildPasses: z.boolean().default(false),
	testsPass: z.boolean().default(false),
	testOutput: z.string().default(""),
	docsBuild: z.boolean().default(false),
	vocsVersion: z.string().default(""),
	publishWired: z.boolean().default(false),
	versionChosen: z.string().default(""),
	prUrl: z.string().default(""),
	blockers: z.array(z.string()).default([]),
	humanActionsNeeded: z.array(z.string()).default([]),
	summary: z.string(),
});

const planSchema = z.looseObject({
	feasible: z.boolean().default(false),
	voltaireJsBindings: z.string().default(""),
	categorized: z.string().default(""),
	callSites: z.number().default(0),
	recommendation: z.string().default(""),
	reportPath: z.string().default(""),
	blockers: z.array(z.string()).default([]),
	summary: z.string(),
});

const inputSchema = z.object({ execute: z.boolean().default(false) });

const { Workflow, Task, Parallel, smithers } = createSmithers({
	input: inputSchema,
	verify: verifySchema,
	plan: planSchema,
});

const REPOS = [
	{
		key: "tevm-contract",
		sub: "contract",
		blurb: "The @tevm/contract package — the shared type surface used by BOTH the tevm core node and the bundler. It is the genuine boundary between those two worlds, which is why it gets its own repo even though core has 9 dependents on it and the bundler only 3.",
	},
	{
		key: "tevm-logger",
		sub: "logger",
		blurb: "The @tevm/logger package — small, generic logging used across core (5 dependents) and the bundler (2). Standalone enough to version on its own cadence.",
	},
] as const;

const RULES = `GROUND RULES:
- Work only in your own clone under ${STAGE}/<repo>. Never touch ${MONO} (a live session works there) or a sibling lane's directory.
- Clone: git clone https://github.com/${ORG}/<repo> ${STAGE}/<repo> ; branch prod/<repo>-readiness.
- Push a branch and open a PR. Do NOT merge and do NOT publish by hand — wire CI so release happens on merge/tag. Publishing is irreversible.
- Run every build/test you claim and paste REAL output. A precise blocker beats a false success.
- Anything needing a human (npm scope, secret, DNS/Vercel domain, token, 2FA) goes in humanActionsNeeded as a concrete instruction.
- Cross-repo deps are PUBLISHED packages with caret ranges — never workspace:* and never pinned exact. Verify each with \`npm view <pkg> version\`.
- IMPORTANT: @tevm/utils is being retired in favour of voltaire and has NO repo of its own (evmts/tevm-utils was created in error and is archived). Do not add a dependency on any tevm-utils repo. If this package imports @tevm/utils, depend on its PUBLISHED version from core for now and note it.`;

export default smithers((ctx) => (
	<Workflow name="contract-logger-utils">
		<Parallel>
			{REPOS.map((r) => (
				<Task id={`verify-${r.key}`} output={verifySchema} agent={codex(STAGE)}>
					{`You are making ${ORG}/${r.key} genuinely PRODUCTION READY. It was scaffolded by an earlier automated run — it already has src, docs, site, .changeset, and ci/docs/release workflows — but NONE of that is verified. Treat it all as unproven claims.

WHAT IT IS:
${r.blurb}

${RULES}

DO THIS:
1. Clone and branch. Install from scratch with the repo's package manager.
2. Does it BUILD? Run it. Extraction commonly breaks import paths, tsconfig references and devDependencies.
3. Do TESTS pass? Run them, paste real counts and output. Tests dropped or skipped during extraction are a FINDING — report them rather than accepting a suite that no longer covers anything. If coverage is thin for a package this widely depended on, add meaningful tests.
4. Verify the package.json: correct name, a REAL release version (not 0.0.0), correct repository/homepage after the evmts/tevm-monorepo -> evmts/tevm rename, proper exports/types, and \`publishConfig: { access: "public", provenance: true }\`.
5. Confirm release.yml actually publishes with npm provenance (\`permissions: id-token: write\`) via the repo's release mechanism, and that changesets config is valid (\`changeset status\` must run clean).
6. Does the DOCS site BUILD? Run its build. Confirm it uses the LATEST vocs (check \`npm view vocs version\`; do not accept 1.x) and deploys to ${r.sub}.tevm.sh. Improve any documentation that is thin or obviously auto-generated filler — this package is depended on widely, so its docs matter. Follow the monorepo's JSDoc conventions: complete docs with @throws and working @example blocks, and fix missing or wrong JSDoc in the source as you go.
7. Fix everything you can. Open a PR. Report honestly, including every remaining human action.`}
				</Task>
			))}
			<Task id="plan" output={planSchema} agent={opus(MONO)}>
				{`You are assessing whether @tevm/utils can be RETIRED in favour of voltaire. Read-only analysis and a written plan — do NOT change code in ${MONO}.

THE DECISION (from the maintainer): "@tevm/utils shouldn't exist, that's just voltaire." evmts/voltaire is "Ethereum primitives and cryptography" (Zig + Rust). The claim is that @tevm/utils duplicates it. evmts/tevm-utils was created by an automated run and is archived — utils gets no repo of its own.

YOUR JOB is to find out whether that retirement is actually feasible, and at what cost. Be rigorous and skeptical; a clear "not yet, because X" is a valuable answer.

1. Inventory ${MONO}/packages/utils/src exhaustively and CATEGORIZE every export into:
   (a) pure re-exports of third-party libraries (it re-exports viem, abitype and ethereumjs — those call sites should import directly from the source library, no voltaire needed),
   (b) genuine Ethereum primitives / cryptography that voltaire is the right home for (e.g. Bloom, signature helpers),
   (c) tevm-specific glue that belongs in core regardless (e.g. prefundedAccounts, createMemoryDb, MemoryDb, SerializeToJson, invariant).
   This categorization is the core deliverable — the answer differs per bucket.
2. THE CRITICAL UNKNOWN: does voltaire actually expose consumable JavaScript/TypeScript bindings today? It is a Zig + Rust project. Clone https://github.com/${ORG}/voltaire to a scratch directory and find out — is there an npm package, napi/wasm bindings, a published artifact? Note that the npm name \`voltaire\` is taken by an UNRELATED package at 0.0.1. If voltaire has no usable JS surface, then bucket (b) is BLOCKED on building one, and you must say so plainly instead of writing a migration plan that cannot be executed.
3. Count the real migration surface: how many packages and call sites import @tevm/utils, and which of the three buckets each usage falls into. (Roughly 23 core packages depend on it.)
4. Recommend a concrete sequenced plan, honest about ordering and risk — including whether bucket (a) can be done immediately and independently (it can, since it is just changing import sources) while (b) waits on voltaire bindings.
5. Write a self-contained HTML report to /Users/williamcory/Desktop/tevm-stack-readiness/utils-voltaire.html — one file, inline CSS, no external assets, readable in both light and dark. Include the full per-export categorization table, the voltaire bindings finding, the call-site counts, the sequenced plan, and the risks. Open it with \`open <path>\`.

Report: whether it is feasible, what you found about voltaire's JS bindings, the categorization summary, call-site count, your recommendation, the report path, and any blockers.`}
			</Task>
		</Parallel>
	</Workflow>
));
