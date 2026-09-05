/// <reference path="../smithers.d.ts" />
/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: GitHub Actions expressions are literal `${{ }}` text. */
const S = Smithers

import { Package as root } from '../PACKAGE.js'
import '../test/PACKAGE.js'
import '../tevm/PACKAGE.js'

// Sibling workspaces must exist before pnpm resolves workspace dependencies.
// Raw steps keep that ordering explicit while the pinned Flows renderer still
// owns every workflow file and the shared toolchain setup action.
const nativeSteps = (command: string): NonNullable<Parameters<typeof S.Github.Workflow>[0]['steps']> => [
	{ uses: 'actions/checkout@v4', with: { 'fetch-depth': '0' } },
	{ name: 'Checkout pinned native sources', run: 'node scripts/factory/checkout-native.mjs' },
	{ uses: './.github/actions/setup' },
	{ run: command },
]
const releaseSteps: NonNullable<Parameters<typeof S.Github.Workflow>[0]['steps']> = [
	...nativeSteps('pnpm exec changeset status'),
	{
		name: 'Create version PR or publish approved packages',
		uses: 'changesets/action@v1',
		with: { version: 'pnpm release:version', publish: 'pnpm release:publish' },
		env: {
			GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
			NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
			NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}',
		},
	},
]
const rpcEnvironment = {
	TEVM_RPC_URLS_MAINNET: '${{ secrets.TEVM_RPC_URLS_MAINNET }}',
	TEVM_RPC_URLS_OPTIMISM: '${{ secrets.TEVM_RPC_URLS_OPTIMISM }}',
	TEVM_TEST_ALCHEMY_KEY: '${{ secrets.TEVM_TEST_ALCHEMY_KEY }}',
}

// The workflow files are emitted from the graph, not hand-written: each
// Workflow maps triggers to targets and the renderer writes the actions
// boilerplate from the WORKSPACE.ts layers: pnpm and node from the package
// manager and runtime declarations, rustup from the Rust layer, bun and
// foundry from the mise layer (mise.toml), and the vendored submodules from
// //:vendor. The composite action it renders is .github/actions/setup, and
// `pnpm install` builds vendor/flows through the postinstall script. Every
// secret a job's targets declare becomes that job's env. Check mode fails on
// drift; --write regenerates.
const setup = S.Github.Setup({
	cacheUrl: S.Secret('SMITHERS_CACHE_URL'),
	cacheToken: S.Secret('SMITHERS_CACHE_TOKEN'),
})

// ci.yml as one pipeline over //:ci. Its twelve sequential steps exist
// upstream because nx run-many is one process; here an unchanged target is a
// cache hit and the steps become graph structure. `affected` stays off: the
// CLI at the pinned Flows revision does not parse --affected-base yet.
// //:changesetCheck diffs against origin/main, so the job checks out full
// history.
const ci = S.Github.Workflow({
	name: 'ci',
	on: {
		push: { branches: ['main'] },
		pullRequest: true,
		workflowDispatch: true,
	},
	concurrency: { group: 'ci-${{ github.ref }}', cancelInProgress: 'pull_request' },
	setup,
	fullHistory: true,
	env: rpcEnvironment,
	steps: nativeSteps('pnpm exec smthrs target //:ci'),
})

// release.yml: the changesets release train on the v1 branch. changesets/action
// opens the Version Packages PR when changesets are pending and publishes when
// the PR has merged; //:version and //:publish are those two halves. The
// `.changeset/pre.json` existence guard is the same condition //:prerelease
// keys on.
const release = S.Github.Workflow({
	name: 'release',
	on: {
		push: { branches: ['v1'] },
		workflowDispatch: true,
	},
	concurrency: { group: 'release-${{ github.ref }}', cancelInProgress: false },
	permissions: { contents: 'write', pullRequests: 'write', idToken: 'write' },
	setup,
	env: rpcEnvironment,
	steps: releaseSteps,
})

// prerelease.yml: every push to main publishes under the `next` tag with
// trusted publishing (id-token, no NPM_TOKEN).
const prerelease = S.Github.Workflow({
	name: 'prerelease',
	on: { push: { branches: ['main'] } },
	concurrency: { group: 'prerelease-${{ github.ref }}', cancelInProgress: false },
	permissions: { contents: 'write', pullRequests: 'write', idToken: 'write' },
	setup,
	env: rpcEnvironment,
	steps: releaseSteps,
})

// prerelease-exit.yml: dispatch with a branch input; the Diff removes
// pre.json. The current Flows workflow renderer does not yet model committing
// generated changes, so the checked-in workflow remains authoritative for
// that final commit step.
const prereleaseExit = S.Github.Workflow({
	name: 'prerelease-exit',
	on: {
		workflowDispatch: {
			inputs: {
				branch: {
					description: 'Exit prerelease mode on release branch',
					required: true,
					default: 'main',
					type: 'string',
				},
			},
		},
	},
	permissions: { contents: 'write' },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //:prereleaseExit --write'),
})

// snapshot.yml: dispatch-only snapshot publish.
const snapshot = S.Github.Workflow({
	name: 'snapshot',
	on: { workflowDispatch: true },
	concurrency: { group: 'snapshot-${{ github.ref }}', cancelInProgress: false },
	setup,
	env: rpcEnvironment,
	steps: nativeSteps('pnpm exec smthrs target //:snapshot'),
})

// jsr-publish.yml: dispatch with a dry-run switch. //tevm:publishJsr carries
// the OIDC auth; the dry-run input maps to its `dryRun` flag.
const jsrPublish = S.Github.Workflow({
	name: 'jsr-publish',
	on: {
		workflowDispatch: {
			inputs: {
				dry_run: {
					description: 'Run in dry-run mode without publishing',
					required: true,
					default: false,
					type: 'boolean',
				},
			},
		},
	},
	permissions: { contents: 'read', idToken: 'write' },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //tevm:publishJsr'),
})

// wasm-size-check.yml: the byte budget on the napi/wasm artifacts. The yml
// today measures nothing (its Zig build was removed) and stores placeholder
// baselines in .wasm-sizes.json; the graph's S.Size.Gate targets are the
// real check, so the workflow reduces to running them.
const wasmSize = S.Github.Workflow({
	name: 'wasm-size-check',
	on: {
		push: { branches: ['main'] },
		pullRequest: true,
		workflowDispatch: true,
	},
	setup,
	steps: nativeSteps('pnpm exec smthrs target //:cargoBuilds'),
})

// parity-suites.yml: the three parity jobs (RPC fast subset, bounded
// conformance, hive smoke) on every PR; //:nightlyConformance keeps the
// unbounded corpus run on its Cron, where hours are acceptable. Artifact upload is still retained in
// the checked-in workflow because package-mode Workflow does not expose an
// artifact declaration yet.
const paritySuites = S.Github.Workflow({
	name: 'parity-suites',
	on: { pullRequest: true, workflowDispatch: true },
	setup,
	env: rpcEnvironment,
	steps: nativeSteps('pnpm exec smthrs target //test:parityFast //test:conformanceFast //test:hiveSmoke'),
})

// The //:nightlyConformance Cron renders itself as
// workflows/cron-nightlyConformance.yml: every labeled Cron in the graph is
// projected, so a second explicit schedule here would run the suite twice.
// Manual runs go through parity-suites.yml's workflow_dispatch, which also
// runs //test:conformanceFast.

// claude-code-review.yml's checklist runs as //:prReview on every PR.
const review = S.Github.Workflow({
	name: 'review',
	on: { pullRequest: true },
	concurrency: { group: 'review-${{ github.ref }}', cancelInProgress: true },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //:prReview'),
})

// The drift-checked renderer. Hand-written workflows without target
// equivalents are preserved: claude.yml (the @claude mention bot, driven by
// GitHub issue and review events, not tree checks), claude-auto-update.yml
// (the daily Claude Code maintenance job; its work is the agent lanes under
// workflows/ once those run on a schedule), and claude-code-review.yml, which
// //:prReview reads as its prompt. Factory intake and settlement remain
// hand-written because they use a two-job approval/artifact boundary the
// current renderer cannot express.
const github = S.Github.CiGen({
	workflows: [ci, release, prerelease, prereleaseExit, snapshot, jsrPublish, wasmSize, paritySuites, review],
	preserve: [
		'workflows/claude.yml',
		'workflows/claude-auto-update.yml',
		'workflows/claude-code-review.yml',
		'workflows/factory-configure.yml',
		'workflows/factory-intake.yml',
		'workflows/factory-issue.yml',
	],
	changes: ['workflows/**', 'actions/setup/**'],
})

// Opening a PR is outward. The gate is the same pre-push suite the git hook
// runs.
const pr = S.Github.Pr({
	gates: [root.prePush],
	secrets: [S.Secret('GITHUB_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
})

export const Package = S.Package({
	targets: {
		ci,
		github,
		jsrPublish,
		paritySuites,
		pr,
		prerelease,
		prereleaseExit,
		release,
		review,
		snapshot,
		wasmSize,
	},
})
