// smithers-source: authored
// smithers-display-name: Tevm Monorepo Split
/** @jsxImportSource smithers-orchestrator */
import {
	ClaudeCodeAgent as SmithersClaudeCodeAgent,
	CodexAgent as SmithersCodexAgent,
	OpenCodeAgent,
	createSmithers,
} from "smithers-orchestrator";
import { z } from "zod/v4";

const MONO = "/Users/williamcory/tevm-monorepo";
const STAGE = "/Users/williamcory/tevm-split";
const ORG = "evmts";

/** One target repo per lane. `paths` are filter-repo paths from the monorepo root. */
const REPOS = [
	{
		key: "tevm-contract",
		sub: "contract",
		paths: ["packages/contract"],
		blurb: "The @tevm/contract package — the shared kernel type surface used by BOTH the core node and the bundler. Extract it first-class because both sides depend on it.",
	},
	{
		key: "tevm-utils",
		sub: "utils",
		paths: ["packages/utils"],
		blurb: "The @tevm/utils package — shared low-level helpers used by core and bundler.",
	},
	{
		key: "tevm-logger",
		sub: "logger",
		paths: ["packages/logger"],
		blurb: "The @tevm/logger package — shared logging used by core and bundler.",
	},
	{
		key: "tevm-test",
		sub: "test",
		paths: ["extensions/test-matchers", "extensions/test-node", "test/test-utils", "test/vitest-matchers", "test/test-matchers"],
		blurb: "The tevm test library: matchers, the test node, vitest matchers and test utils. Publishes @tevm/test-matchers, @tevm/test-node, @tevm/test-utils. This is the showcase library the evmts/viem PR consumes.",
	},
	{
		key: "tevm-ethers",
		sub: "ethers",
		paths: ["extensions/ethers"],
		blurb: "The @tevm/ethers extension — ethers.js integration. Cadence tracks ethers releases.",
	},
	{
		key: "tevm-mud",
		sub: "mud",
		paths: ["bundler-packages/mud"],
		blurb: "The @tevm/mud integration — cadence tracks MUD releases, audience is MUD game devs.",
	},
	{
		key: "tevm-cli",
		sub: "cli",
		paths: ["cli", "bundler-packages/tevm-run"],
		blurb: "The tevm CLI plus tevm-run. App-shaped: ships binaries and an ink UI, not a library.",
	},
	{
		key: "tevm-bundler",
		sub: "bundler",
		paths: [
			"bundler-packages/base-bundler",
			"bundler-packages/bun",
			"bundler-packages/bundler-cache",
			"bundler-packages/compiler",
			"bundler-packages/config",
			"bundler-packages/esbuild",
			"bundler-packages/requirejs",
			"bundler-packages/resolutions",
			"bundler-packages/resolutions-rs",
			"bundler-packages/rollup",
			"bundler-packages/rspack",
			"bundler-packages/runtime",
			"bundler-packages/runtime-rs",
			"bundler-packages/solc",
			"bundler-packages/solc-rs",
			"bundler-packages/unplugin",
			"bundler-packages/vite",
			"bundler-packages/webpack",
			"lsp",
			"packages/effect",
		],
		blurb: "The whole bundler pipeline (config, compiler, solc/solc-rs, resolutions/resolutions-rs, runtime/runtime-rs, base-bundler, unplugin and every bundler adapter), PLUS the LSP and the vscode extension (they share the resolution/compiler pipeline), PLUS @tevm/effect. Note: whatsabi is deliberately EXCLUDED (rolled into voltaire, being deleted), and mud + tevm-run go to their own repos.",
	},
	{
		key: "tevm-examples",
		sub: "examples",
		paths: ["examples"],
		blurb: "All example apps. They consume PUBLISHED packages only, which doubles as an integration smoke-test suite.",
	},
] as const;

const codex = (cwd: string) => new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd, skipGitRepoCheck: true });
const opus = (cwd: string) => new SmithersClaudeCodeAgent({ model: "opus", cwd });
const kimi = (cwd: string) => new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd });

const extractSchema = z.looseObject({
	repo: z.string(),
	repoUrl: z.string().default(""),
	pushed: z.boolean().default(false),
	packages: z.array(z.string()).default([]),
	buildPasses: z.boolean().default(false),
	testsPass: z.boolean().default(false),
	publishingSetUp: z.boolean().default(false),
	manualStepsRemaining: z.array(z.string()).default([]),
	summary: z.string(),
});

const docsSchema = z.looseObject({
	repo: z.string(),
	vocsVersion: z.string().default(""),
	pagesWritten: z.array(z.string()).default([]),
	deployTarget: z.string().default(""),
	summary: z.string(),
});

const uiSchema = z.looseObject({
	repo: z.string(),
	summary: z.string(),
	componentsBuilt: z.array(z.string()).default([]),
});

const reportSchema = z.looseObject({
	reportPath: z.string(),
	reposCreated: z.array(z.string()).default([]),
	blockers: z.array(z.string()).default([]),
	summary: z.string(),
});

const inputSchema = z.object({
	dryRun: z.boolean().default(false),
});

const { Workflow, Task, Sequence, Parallel, smithers } = createSmithers({
	input: inputSchema,
	extract: extractSchema,
	docs: docsSchema,
	ui: uiSchema,
	report: reportSchema,
});

/** Shared context every lane needs so the repos agree with each other without a barrier. */
const CONVENTIONS = `SHARED CONVENTIONS — every lane must follow these so the repos line up:

- GitHub org: ${ORG}. Monorepo source of truth: ${MONO} (git remote origin = github.com/${ORG}/tevm-monorepo).
- Staging root: ${STAGE}. Your repo is staged at ${STAGE}/<repo-key>. NEVER run git filter-repo inside ${MONO} — it rewrites history destructively. Always \`git clone ${MONO} <staging-dir>\` (a local clone is fast and keeps history) and filter THAT clone.
- Cross-repo dependencies are PUBLISHED npm packages with CARET RANGES, never \`workspace:*\` and never pinned exact versions. e.g. "@tevm/contract": "^1.0.0". Pinning recreates the lockstep the split exists to remove.
- \`tevm\` itself (the core meta-package) is a PEER dependency with a range (">=1.0.0") wherever a satellite needs the node at runtime, plus a devDependency for local testing.
- Every repo: pnpm, changesets, biome (copy the monorepo's biome.json), tsconfig extending @tevm/tsconfig or an inlined equivalent, and the repo's own CI.
- Package manager: pnpm 9.x. Node 24 (.nvmrc), matching the monorepo.
- Docs subdomain for this repo: <sub>.tevm.sh (assigned per lane below). The umbrella docs stay at tevm.sh.
- Do not delete anything from ${MONO} in your lane. A separate cleanup PR removes the extracted trees after the new repos are live.`;

export default smithers((ctx) => {
	const extracts = ctx.outputs.extract ?? [];
	const docs = ctx.outputs.docs ?? [];
	const uis = ctx.outputs.ui ?? [];

	const rollup = [
		...extracts.map((e: any) => `EXTRACT ${e.repo}: ${e.repoUrl || "(no url)"} pushed=${e.pushed} build=${e.buildPasses} tests=${e.testsPass} publishing=${e.publishingSetUp}\n  ${e.summary}\n  manual: ${(e.manualStepsRemaining ?? []).join("; ") || "none"}`),
		...docs.map((d: any) => `DOCS ${d.repo}: vocs=${d.vocsVersion} deploy=${d.deployTarget}\n  ${d.summary}`),
		...uis.map((u: any) => `UI ${u.repo}: ${u.summary}`),
	].join("\n\n");

	return (
		<Workflow name="tevm-split">
			<Sequence>
				<Parallel>
					{REPOS.map((r) => {
						const dir = `${STAGE}/${r.key}`;
						return (
							<Sequence>
								<Task id={`extract-${r.key}`} output={extractSchema} agent={codex(STAGE)}>
									{`You are the EXTRACTION agent for the new repo ${ORG}/${r.key}. Do the whole job: carve it out of the tevm monorepo with history, make it build and test standalone, create the GitHub repo, push it, and set up publishing.

WHAT THIS REPO IS:
${r.blurb}

MONOREPO PATHS THAT MOVE INTO IT:
${r.paths.map((p) => `- ${p}`).join("\n")}

${CONVENTIONS}

STEPS:
1. mkdir -p ${STAGE} && git clone ${MONO} ${dir} && cd ${dir}
2. Run git-filter-repo (installed at /opt/homebrew/bin/git-filter-repo) keeping ONLY the paths above, so git history and blame for those files survive:
   git filter-repo --force ${r.paths.map((p) => `--path ${p}`).join(" ")}
   Then restructure the tree so the packages sit at a sensible root (e.g. packages/<name>/ or a single-package root if there is only one). Use \`git filter-repo --path-rename\` for the move so history follows the rename.
3. Write the repo root: package.json (pnpm workspaces if multi-package), pnpm-workspace.yaml, .nvmrc (24), biome.json copied from the monorepo, tsconfig, .gitignore, LICENSE (copy from monorepo), and a real README explaining what the repo is, how it relates to tevm, and how to install.
4. Rewire EVERY dependency that used to be \`workspace:*\`/\`workspace:^\` and now lives in another repo to a published caret range per the conventions. Keep intra-repo deps as workspace refs. Check the actual latest published version with \`npm view <pkg> version\` and use \`^<that>\`; if a package has never been published, use ^1.0.0 and list it under manualStepsRemaining.
5. \`pnpm install\`, then make the build pass and the tests pass. Fix what the extraction broke (import paths, tsconfig references, missing devDeps). If a test genuinely cannot run standalone (needs the monorepo's fixtures or an RPC env var), skip it explicitly with a comment naming why, and list it in manualStepsRemaining — never delete a test silently and never claim a green suite you did not run.
6. Add changesets (.changeset/config.json) with the packages in this repo.
7. .github/workflows/ci.yml: install, lint, typecheck, build, test on Node 24.
8. .github/workflows/release.yml: changesets release with NPM PROVENANCE. That means the job needs \`permissions: { contents: write, pull-requests: write, id-token: write }\`, npm >= 9.5, and publishConfig \`{ "access": "public", "provenance": true }\` in each package.json. Use the changesets/action with NPM_TOKEN from secrets. Do NOT publish by hand from your machine — the pipeline publishes on merge.
9. Create and push the repo:
   gh repo create ${ORG}/${r.key} --public --source ${dir} --remote origin --description "<one line>" --push
   (If the repo already exists, push to it instead of failing. Default branch: main.)
10. Report honestly: repoUrl, whether you pushed, package names, whether build and tests ACTUALLY passed (run them), whether publishing is wired, and every remaining manual step (NPM_TOKEN secret, first release, unpublished deps, skipped tests).

Do not touch ${MONO}. Do not open PRs against the monorepo.`}
								</Task>
								<Parallel>
									<Task id={`docs-${r.key}`} output={docsSchema} agent={opus(dir)}>
										{`You are the DOCUMENTATION agent for ${ORG}/${r.key}, working in ${dir} (the extraction agent just created and pushed this repo).

WHAT THIS REPO IS:
${r.blurb}

YOUR JOB: give this repo a first-class docs site and genuinely good documentation.

1. Scaffold a vocs docs site in ./docs (or ./site) using the LATEST vocs — currently 2.7.0. The monorepo's existing site at ${MONO}/docs/node is on vocs 1.4.1, so read it for content and structure but MIGRATE the config to vocs 2.x (the 1.x→2.x major has breaking config/API changes — check the vocs docs/changelog and get it actually building, do not guess).
2. Write the docs. This is the real work, not scaffolding:
   - A landing page that says what the package is and why it exists.
   - Getting started / install, with correct published package names and ranges.
   - Guides for the main use cases, with COMPLETE runnable examples (real imports, no "..." elisions), following the monorepo's CLAUDE.md conventions.
   - API reference. Reuse the JSDoc already in the source; where JSDoc is missing or wrong, FIX IT IN THE SOURCE as part of this work (the monorepo convention is: when you notice missing JSDoc, you add it, with @throws and @example).
   - A page explaining how this repo relates to tevm core and the other split repos.
3. Deployment: the site deploys to ${r.sub}.tevm.sh. Configure it the way the monorepo already does it (Vercel — see ${MONO}/docs/node/vercel.json), add the vercel.json / project config and a docs deploy workflow. The Vercel CLI on this machine is authenticated as roninjin10. Do NOT guess at DNS you cannot verify: configure what you can and report the exact remaining step (domain assignment in the Vercel project / DNS record for ${r.sub}.tevm.sh) as part of your summary.
4. Verify the site BUILDS (\`pnpm docs:build\` or equivalent). Report real output.
5. Commit and push to main (or a docs branch + PR if main is protected).

Report: vocsVersion you landed on, the pages you wrote, the deploy target, and an honest summary including anything left manual.`}
									</Task>
									<Task id={`ui-${r.key}`} output={uiSchema} agent={kimi(dir)}>
										{`You are the UI agent for ${ORG}/${r.key}, working in ${dir}.

WHAT THIS REPO IS:
${r.blurb}

YOUR JOB: the visual/UI layer of this repo's docs site at ${r.sub}.tevm.sh. A documentation agent is writing the CONTENT in parallel — do not fight it over prose files; you own look, feel, and interactive components.

1. Give the vocs site a polished, cohesive theme consistent across every tevm.sh subdomain: shared color tokens, typography, logo/wordmark treatment, dark AND light mode both correct.
2. Build the landing/hero for ${r.sub}.tevm.sh: what this package does, a copy-paste install line, and a short code sample that renders beautifully.
3. Add the interactive components this specific package deserves — e.g. for the test library, a live matcher playground; for the bundler, a before/after of importing a .sol file; for cli, an animated terminal. Keep them dependency-light and self-contained.
4. Cross-repo navigation: a header/switcher linking the tevm.sh family (tevm.sh plus contract/utils/logger/test/ethers/mud/cli/bundler/examples subdomains) so the sites feel like one product.
5. Make sure the site actually builds and looks right; do not ship broken CSS.
6. Commit and push (or open a PR if main is protected). Coordinate with the docs agent by keeping your changes in theme/component files rather than content pages.

Report what you built.`}
									</Task>
								</Parallel>
							</Sequence>
						);
					})}
				</Parallel>
				<Task id="report" output={reportSchema} agent={opus(MONO)}>
					{`You are the REPORT agent. Every extraction, docs, and UI lane for the tevm monorepo split has finished. Produce the human-facing deliverable.

LANE REPORTS:
${rollup}

1. Verify the claims rather than trusting them: for each repo, \`gh repo view ${ORG}/<key>\` to confirm it exists and was pushed, and check that a CI workflow and a release workflow with provenance are present (\`gh api repos/${ORG}/<key>/contents/.github/workflows\`).
2. Write a self-contained HTML report to /Users/williamcory/Desktop/tevm-repo-split/split-report.html — one file, inline CSS, no external assets, dark and light both readable. It must cover: every repo created with its URL and packages, what published-range dependency wiring was used, build/test status per repo, publishing + provenance status, docs site status and its tevm.sh subdomain, and a clearly separated "REMAINING MANUAL STEPS" section (NPM_TOKEN org secret, Vercel domain assignment/DNS per subdomain, first releases, anything a lane flagged).
3. Also list the follow-up work the split still needs in the monorepo itself: deleting the extracted trees, removing whatsabi (rolled into voltaire), and switching core to consume the published shared packages.
4. Open it with \`open <path>\`.

Report the file path, the repos confirmed created, and any blockers.`}
				</Task>
			</Sequence>
		</Workflow>
	);
});
