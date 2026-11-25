/// <reference path="../smithers.d.ts" />
/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: GitHub Actions expressions are literal `${{ }}` text. */
const S = Smithers

import { Package as root } from '../PACKAGE.js'
import '../test/PACKAGE.js'
import '../tevm/PACKAGE.js'

// Sibling workspaces must exist before pnpm resolves workspace dependencies.
// Raw steps keep that ordering explicit while the pinned Flows renderer still
// owns every workflow file and the shared toolchain setup action.
type Steps = NonNullable<Parameters<typeof S.Github.Workflow>[0]['steps']>
const nativeSetup = (ref?: string): Steps => [
	{ uses: 'actions/checkout@v5', with: { 'fetch-depth': '0', ...(ref ? { ref } : {}) } },
	{ name: 'Checkout pinned native sources', run: 'node scripts/factory/checkout-native.mjs' },
	{ uses: './.github/actions/setup' },
]
const nativeSteps = (command: string): Steps => [...nativeSetup(), { run: command }]
const releaseSteps = (prerelease: boolean): Steps => [
	...nativeSetup(),
	...(prerelease ? [] : [{ name: 'Require stable mode', run: 'test ! -f .changeset/pre.json' }]),
	{
		name: 'Create version PR or publish approved packages',
		...(prerelease ? { if: "hashFiles('.changeset/pre.json') != ''" } : {}),
		uses: 'changesets/action@v1',
		with: { version: 'pnpm release:version', publish: 'pnpm release:publish' },
		env: {
			GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
			NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
			NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}',
			NPM_CONFIG_PROVENANCE: 'true',
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
	steps: [
		...nativeSteps('pnpm exec smthrs target //:ci'),
		{ name: 'Build Node documentation', run: 'pnpm --filter @tevm/node-docs build:app' },
	],
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
	environment: 'npm-release',
	permissions: { contents: 'write', pullRequests: 'write', idToken: 'write' },
	setup,
	env: rpcEnvironment,
	steps: releaseSteps(false),
})

// Main uses the same approval environment as the stable release train.
const prerelease = S.Github.Workflow({
	name: 'prerelease',
	on: { push: { branches: ['main'] } },
	concurrency: { group: 'prerelease-${{ github.ref }}', cancelInProgress: false },
	environment: 'npm-release',
	permissions: { contents: 'write', pullRequests: 'write', idToken: 'write' },
	setup,
	env: rpcEnvironment,
	steps: releaseSteps(true),
})

// Request a reviewed prerelease exit against the selected release branch.
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
	permissions: { contents: 'write', pullRequests: 'write' },
	setup,
	steps: [
		...nativeSetup('${{ inputs.branch }}'),
		{ name: 'Verify native dependency on npm', run: 'pnpm release:verify --skip-dist-check --check-registry' },
		{ name: 'Test the published native RPC interface', run: 'node scripts/verify-published-zevm.mjs' },
		{ run: 'pnpm exec smthrs target //:prereleaseExit --write' },
		{
			name: 'Open prerelease exit for review',
			uses: 'peter-evans/create-pull-request@v7',
			with: {
				base: '${{ inputs.branch }}',
				branch: 'automation/prerelease-exit-${{ github.run_id }}',
				'add-paths': '.changeset/pre.json',
				title: 'Exit Changesets prerelease mode',
				'commit-message': 'chore: exit prerelease mode',
			},
		},
	],
})

// snapshot.yml: dispatch-only snapshot publish.
const snapshot = S.Github.Workflow({
	name: 'snapshot',
	on: { workflowDispatch: true },
	concurrency: { group: 'snapshot-${{ github.ref }}', cancelInProgress: false },
	environment: 'npm-release',
	setup,
	permissions: { contents: 'read', idToken: 'write' },
	env: rpcEnvironment,
	steps: [
		...nativeSetup(),
		{
			uses: 'actions/setup-node@v4',
			with: { 'node-version-file': '.nvmrc', 'registry-url': 'https://registry.npmjs.org' },
		},
		{
			run: 'pnpm exec smthrs target //:snapshot',
			env: {
				NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
				NODE_AUTH_TOKEN: '${{ secrets.NPM_TOKEN }}',
				GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
				NPM_CONFIG_PROVENANCE: 'true',
			},
		},
	],
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
	steps: [
		...nativeSetup(),
		{ if: '${{ inputs.dry_run }}', run: 'pnpm exec smthrs target //tevm:publishJsrDryRun' },
		{ if: '${{ !inputs.dry_run }}', run: 'pnpm exec smthrs target //tevm:publishJsr' },
	],
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
	steps: nativeSteps(
		'pnpm exec smthrs target //test:parityFast && pnpm exec smthrs target //test:conformanceFast && pnpm exec smthrs target //test:hiveSmoke',
	),
})

// Native sibling sources must exist before the shared pnpm installation.
const nightlyConformance = S.Github.Workflow({
	name: 'cron-nightlyConformance',
	on: { schedule: ['0 3 * * *'], workflowDispatch: true },
	permissions: { contents: 'read' },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //test:nightlyConformance'),
})

// claude-code-review.yml's checklist runs as //:prReview on every PR.
const review = S.Github.Workflow({
	name: 'review',
	on: { pullRequest: true },
	permissions: { contents: 'read' },
	concurrency: { group: 'review-${{ github.ref }}', cancelInProgress: true },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //:prReview'),
})

// benchmarks.yml: incremental Smithers performance benchmarks on every PR and
// push to main. Unchanged packages hit the remote cache in milliseconds so only
// packages affected by a change re-execute, and the summary appends to the job
// step summary.
const benchmarks = S.Github.Workflow({
	name: 'benchmarks',
	on: {
		push: { branches: ['main'] },
		pullRequest: true,
		workflowDispatch: true,
	},
	concurrency: { group: 'benchmarks-${{ github.ref }}', cancelInProgress: 'pull_request' },
	setup,
	steps: nativeSteps('pnpm exec smthrs target //:bench'),
})

// The drift-checked renderer. Hand-written workflows without target
// equivalents are preserved: claude.yml (the @claude mention bot, driven by
// GitHub issue and review events, not tree checks), claude-auto-update.yml
// (the daily Claude Code maintenance job; its work is the agent lanes under
// workflows/ once those run on a schedule), and claude-code-review.yml, which
// //:prReview reads as its prompt. Factory intake and settlement remain
// hand-written because they use an approval and artifact boundary the
// current renderer cannot express.
// The pinned renderer interpolates cache inputs directly into a shell program.
// Use its graph renderer with a local composite-action adapter until upstream
// supports step env and a separate setup-node version file.
const github = S.Generate({
	bin: S.Runtime.bin,
	args: [
		'scripts/factory/render-github.mjs',
		'workflows/claude.yml',
		'workflows/claude-auto-update.yml',
		'workflows/claude-code-review.yml',
		'workflows/factory-configure.yml',
		'workflows/factory-intake.yml',
		'workflows/factory-issue.yml',
	],
	data: [
		S.file('//scripts/factory/render-github.mjs'),
		S.file('//WORKSPACE.ts'),
		S.Filegroup({ srcs: [S.glob('//**/PACKAGE.ts', { exclude: ['**/node_modules/**', '**/vendor/**'] })] }),
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
		benchmarks,
		ci,
		github,
		jsrPublish,
		paritySuites,
		nightlyConformance,
		pr,
		prerelease,
		prereleaseExit,
		release,
		review,
		snapshot,
	},
})
