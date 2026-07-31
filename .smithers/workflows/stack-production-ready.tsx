// smithers-source: authored
// smithers-display-name: Stack Production Ready
/** @jsxImportSource smithers-orchestrator */
import {
	ClaudeCodeAgent as SmithersClaudeCodeAgent,
	CodexAgent as SmithersCodexAgent,
	OpenCodeAgent,
	createSmithers,
} from "smithers-orchestrator";
import { z } from "zod/v4";

const STAGE = "/Users/williamcory/stack-prod";
const ORG = "evmts";
const MONO = "/Users/williamcory/tevm-monorepo";

/**
 * NEW repos needing the full treatment: production readiness + a vocs 2.x docs site + UI.
 * Zig/Rust projects — "publish" may mean npm (native bindings), crates.io, or the Zig
 * package registry; each lane determines and reports the right target rather than guessing.
 */
const FULL = [
	{
		key: "voltaire",
		sub: "voltaire",
		blurb: "Ethereum primitives and cryptography, Zig + Rust (Cargo.toml + build.zig). Has a docs/sdk directory but no vocs site. Note: the npm name `voltaire` is already taken by an unrelated package at 0.0.1, so scoping (e.g. @tevm/voltaire or @evmts/voltaire) is likely required — verify before assuming.",
	},
	{
		key: "guillotine",
		sub: "guillotine",
		blurb: "An ultra-high performance and flexible EVM written in Zig (plus Cargo). docs/ holds plain markdown (README, dev, mini, performance, reports) and there is no vocs site. Note: the npm name `guillotine` is taken by an unrelated package at 1.3.1, so scoping is likely required.",
	},
	{
		key: "guillotine-mini",
		sub: "mini",
		blurb: "A tiny and simple EVM written in Zig. Has package.json (name `guillotine-mini`, version 0.1.0, unpublished) and docs/ with markdown only. The most npm-shaped of the Zig repos.",
	},
	{
		key: "zevm",
		sub: "zevm",
		blurb: "The EVM implementation tevm consumes as a pnpm workspace member (../zevm/npm/zevm). Published to npm as @evmts/zevm but stuck at version 0.0.0, which is not a real release. It builds ESM + CJS via tsc and ships native platform packages under npm/platforms/*. tevm pins it by commit SHA in .github/actions/setup — see the pinning comment there before changing anything about its build.",
	},
] as const;

/** Split repos that ALREADY have docs/ or site/ plus ci.yml, docs.yml and release.yml from an earlier run. These need verification and repair, not rebuilding. */
const VERIFY = [
	{ key: "tevm-test", sub: "test" },
	{ key: "tevm-bundler", sub: "bundler" },
	{ key: "tevm-cli", sub: "cli" },
	{ key: "tevm-ethers", sub: "ethers" },
	{ key: "tevm-mud", sub: "mud" },
	{ key: "tevm-examples", sub: "examples" },
] as const;

const codex = (cwd: string) => new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true });
const opus = (cwd: string) => new SmithersClaudeCodeAgent({ model: "opus", cwd });
const kimi = (cwd: string) => new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd });

const readySchema = z.looseObject({
	repo: z.string(),
	buildPasses: z.boolean().default(false),
	testsPass: z.boolean().default(false),
	testOutput: z.string().default(""),
	publishTarget: z.string().default(""),
	publishWired: z.boolean().default(false),
	versionChosen: z.string().default(""),
	prUrl: z.string().default(""),
	blockers: z.array(z.string()).default([]),
	humanActionsNeeded: z.array(z.string()).default([]),
	summary: z.string(),
});

const docsSchema = z.looseObject({
	repo: z.string(),
	vocsVersion: z.string().default(""),
	docsBuild: z.boolean().default(false),
	pagesWritten: z.array(z.string()).default([]),
	deployTarget: z.string().default(""),
	humanActionsNeeded: z.array(z.string()).default([]),
	summary: z.string(),
});

const uiSchema = z.looseObject({
	repo: z.string(),
	summary: z.string(),
	builds: z.boolean().default(false),
});

const reportSchema = z.looseObject({
	reportPath: z.string(),
	readyRepos: z.array(z.string()).default([]),
	blockedRepos: z.array(z.string()).default([]),
	humanActionsNeeded: z.array(z.string()).default([]),
	summary: z.string(),
});

const inputSchema = z.object({
	publish: z.boolean().default(false),
});

const { Workflow, Task, Sequence, Parallel, smithers } = createSmithers({
	input: inputSchema,
	ready: readySchema,
	docs: docsSchema,
	ui: uiSchema,
	report: reportSchema,
});

const RULES = `GROUND RULES — apply to every lane:

- Work ONLY inside your own staging clone under ${STAGE}. Never touch ${MONO} (a live session is working there) and never touch a sibling lane's directory.
- Clone with: git clone https://github.com/${ORG}/<repo> ${STAGE}/<repo>
- Branch: prod/<repo>-readiness. Push the branch and open a PR. Do NOT merge, and do NOT run \`npm publish\` / \`cargo publish\` by hand — wire the pipeline so a release happens through CI on merge. Publishing is irreversible; a human decides when to pull that trigger.
- HONESTY IS THE POINT. Run every build and test you claim, and paste real output. Never assert a green suite you did not run. If something cannot be made to work, report it under blockers with the specific reason — a precise blocker is far more valuable than a false success.
- Anything that needs a human (an npm org/scope you cannot create, a missing secret, DNS or a Vercel domain, an expired token, 2FA, a crates.io owner invite) goes in humanActionsNeeded, phrased as a concrete instruction the human can act on.
- Docs subdomains are <sub>.tevm.sh, matching the family already established for the split repos.
- Follow each repo's existing conventions rather than imposing tevm's. Zig repos are Zig, not TypeScript.`;

export default smithers((ctx) => {
	const readies = ctx.outputs.ready ?? [];
	const docsOut = ctx.outputs.docs ?? [];
	const uisOut = ctx.outputs.ui ?? [];

	const rollup = [
		...readies.map(
			(r: any) =>
				`READY ${r.repo}: build=${r.buildPasses} tests=${r.testsPass} publish=${r.publishTarget}(wired=${r.publishWired}) version=${r.versionChosen} pr=${r.prUrl}\n  ${r.summary}\n  blockers: ${(r.blockers ?? []).join("; ") || "none"}\n  human: ${(r.humanActionsNeeded ?? []).join("; ") || "none"}`,
		),
		...docsOut.map((d: any) => `DOCS ${d.repo}: vocs=${d.vocsVersion} builds=${d.docsBuild} deploy=${d.deployTarget}\n  ${d.summary}\n  human: ${(d.humanActionsNeeded ?? []).join("; ") || "none"}`),
		...uisOut.map((u: any) => `UI ${u.repo}: builds=${u.builds} — ${u.summary}`),
	].join("\n\n");

	return (
		<Workflow name="stack-production-ready">
			<Sequence>
				<Parallel>
					{/* New repos: readiness first, then docs + UI in parallel behind it. */}
					{FULL.map((r) => {
						const dir = `${STAGE}/${r.key}`;
						return (
							<Sequence>
								<Task id={`ready-${r.key}`} output={readySchema} agent={codex(STAGE)}>
									{`You are making ${ORG}/${r.key} PRODUCTION READY and setting up publishing.

WHAT IT IS:
${r.blurb}

${RULES}

DO THIS:
1. Clone and branch. Read the README, build files (build.zig / build.zig.zon / Cargo.toml / package.json) and any CI under .github/workflows to understand how it is meant to be built.
2. Get a clean build from scratch, exactly as a new contributor would: document the toolchain versions actually required (Zig version, Rust toolchain, Node) and make sure the documented commands work. Pin toolchain versions in CI.
3. Get the test suite running and passing. Report real numbers. If tests do not exist, say so plainly rather than inventing trivial ones.
4. Determine the CORRECT publish target and say why: npm (with native platform packages?), crates.io, the Zig package manager, or GitHub releases with prebuilt binaries. For npm, check whether the bare name is taken (it is for voltaire and guillotine) and pick a scope accordingly. Verify with \`npm view <name>\` / \`cargo search\` rather than assuming.
5. Choose a real starting version and justify it. 0.0.0 is not a release; neither is silently jumping to 1.0.0 for something unfinished. Prefer an honest 0.x or a prerelease tag.
6. Wire publishing in CI: build, test, then publish on a tag or release, with npm provenance where npm is the target (\`permissions: id-token: write\` plus \`publishConfig: { access: "public", provenance: true }\`). Add changesets only if the repo already uses them; do not impose them on a Zig repo.
7. Add the production hygiene a consumer expects: LICENSE, a real README with install and usage, correct repository/homepage metadata, and a .gitignore that excludes build artifacts.
8. Open a PR. Report honestly, including every human action still required.`}
								</Task>
								<Parallel>
									<Task id={`docs-${r.key}`} output={docsSchema} agent={opus(dir)}>
										{`You are writing the DOCUMENTATION for ${ORG}/${r.key} in ${dir}.

WHAT IT IS:
${r.blurb}

${RULES}

DO THIS:
1. Scaffold a vocs docs site using the LATEST vocs (2.7.0 at time of writing — verify with \`npm view vocs version\` and use the actual latest). If the repo has existing markdown under docs/, treat it as source material to migrate and improve, not as something to discard. Do not copy an old vocs 1.x config from elsewhere; 1.x -> 2.x has breaking config changes.
2. Write genuinely good documentation, which is the real work here:
   - A landing page that explains what this project is and why it exists.
   - Install and getting started, with the ACTUAL toolchain requirements and commands you verified.
   - Guides for the primary use cases, with complete runnable examples — no "..." elisions.
   - An API/reference section derived from the real source, not invented.
   - A page explaining how this project relates to the rest of the stack (tevm, zevm, guillotine, guillotine-mini, voltaire) so a reader can situate it.
3. For a Zig or Rust project, document the native build honestly: platform support, prerequisites, and how to consume it from another language if that is supported.
4. Deployment target is ${r.sub}.tevm.sh, matching the family used by the split repos. Configure what you can (the monorepo deploys docs on Vercel; the Vercel CLI on this machine is authenticated as roninjin10) and report the exact remaining domain/DNS step under humanActionsNeeded rather than guessing at DNS you cannot verify.
5. Verify the site BUILDS and paste real output. A docs site that does not build is not documentation.
6. Commit and push to the same branch the readiness agent used (prod/${r.key}-readiness), pulling with --rebase first since another agent is working alongside you. Keep to docs files so you do not collide with the UI agent.`}
									</Task>
									<Task id={`ui-${r.key}`} output={uiSchema} agent={kimi(dir)}>
										{`You are the UI agent for ${ORG}/${r.key} in ${dir}, owning the look and feel of its docs site at ${r.sub}.tevm.sh.

${RULES}

A documentation agent is writing the CONTENT in parallel on the same branch — you own theme and components, it owns prose. Stay in theme/component files, and \`git pull --rebase\` before each push.

DO THIS:
1. Apply a theme consistent with the rest of the tevm.sh family: shared color tokens, typography, logo treatment, and BOTH dark and light mode correct.
2. Build the hero/landing presentation: what this project is, a copy-paste install line, and a code sample that renders beautifully.
3. Add interactive components that suit this specific project — for an EVM, something like an opcode or gas explorer or a bytecode trace view; for a primitives library, a live encode/decode playground. Keep them dependency-light and self-contained.
4. Add cross-repo navigation linking the family (tevm.sh plus the test/bundler/cli/ethers/mud/examples/voltaire/guillotine/mini/zevm subdomains) so the sites read as one product.
5. Verify the site builds and looks right in both themes. Do not ship broken CSS.
6. Commit and push.`}
									</Task>
								</Parallel>
							</Sequence>
						);
					})}
					{/* Already-scaffolded split repos: verify and repair only. */}
					{VERIFY.map((r) => (
						<Task id={`verify-${r.key}`} output={readySchema} agent={codex(STAGE)}>
							{`You are VERIFYING and REPAIRING ${ORG}/${r.key}, which was extracted from the tevm monorepo by an earlier automated run. It already has docs/ or site/ plus ci.yml, docs.yml and release.yml. Your job is to find out whether any of that actually WORKS, and fix what does not.

${RULES}

Treat the earlier run's output as unverified claims. Specifically:
1. Clone and branch. \`pnpm install\` (or the repo's package manager) from scratch.
2. Does it BUILD? Run it. Extraction commonly breaks import paths, tsconfig references and missing devDependencies.
3. Do the TESTS pass? Run them and paste real output. Tests skipped or deleted during extraction are a finding — report them; do not quietly accept a suite that no longer covers anything.
4. Are cross-repo dependencies correct? They must be PUBLISHED packages with caret ranges, never \`workspace:*\` and never pinned exact versions. Confirm each referenced version actually exists with \`npm view <pkg> version\`. IMPORTANT: @tevm/contract, @tevm/utils and @tevm/logger deliberately REMAIN in the evmts/tevm core repo — depend on their published versions, and do not try to point at split-out repos for them (tevm-contract, tevm-utils and tevm-logger were created in error and are archived).
5. Is publishing genuinely wired? release.yml should build, test and publish via the repo's release mechanism with npm provenance (\`permissions: id-token: write\`, \`publishConfig: { access: "public", provenance: true }\`). Check the package version is a real release version and the package name is correct and available.
6. Does the DOCS site build? Run its build. Confirm it is on the LATEST vocs (verify with \`npm view vocs version\`) rather than 1.x, and that it deploys to ${r.sub}.tevm.sh. Fix or upgrade it if not, and improve any documentation that is thin or plainly auto-generated filler.
7. Fix everything you can, open a PR, and report the rest under blockers and humanActionsNeeded.`}
						</Task>
					))}
				</Parallel>
				<Task id="report" output={reportSchema} agent={opus(MONO)}>
					{`You are the REPORT agent for a stack-wide production-readiness push across ${ORG}: voltaire, guillotine, guillotine-mini, zevm, and the six repos split out of the tevm monorepo (tevm-test, tevm-bundler, tevm-cli, tevm-ethers, tevm-mud, tevm-examples). The core repo evmts/tevm is being handled separately by the orchestrator.

LANE REPORTS:
${rollup || "(none)"}

1. VERIFY rather than trust. For each repo: \`gh repo view ${ORG}/<repo>\`, confirm the PR exists, and check that CI and release workflows are present via \`gh api repos/${ORG}/<repo>/contents/.github/workflows\`. Where a lane claimed passing tests, sanity-check that the claim is specific (real counts and output) rather than vague — flag vague claims as unverified.
2. Write a self-contained HTML report to /Users/williamcory/Desktop/tevm-stack-readiness/report.html — ONE file, inline CSS, no external assets, readable in BOTH light and dark. It must contain:
   - A status matrix across all repos: builds, tests, publish target + whether publishing is wired, chosen version, docs site + vocs version + subdomain, PR link.
   - A clearly separated "WHAT THE HUMAN MUST DO" section, deduplicated and ordered by what unblocks the most: npm scopes/tokens, org secrets, Vercel domains and DNS per subdomain, crates.io ownership, anything needing 2FA.
   - An honest "NOT READY" section naming every repo that is not production ready and precisely why.
3. Do NOT present unverified lane claims as facts. If a lane was vague, say so.
4. Open it with \`open <path>\`.

Report the file path, which repos are genuinely ready, which are blocked, and the deduplicated human action list.`}
				</Task>
			</Sequence>
		</Workflow>
	);
});
