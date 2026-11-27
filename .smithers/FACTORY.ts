/**
 * The coding factory declaration for evmts/tevm (https://smithers.sh/evmts/tevm).
 *
 * Single source of truth for:
 * - Smithers Cloud triggers (Plugin.Manifest apiVersion: 1 contributes.triggers)
 * - Featured and background flows (CI, Uphill Lighthouse audit, Release, Docs publish,
 *   Parity, Benchmarks, Wiki refresh, Live EVM Playground, Review, Repro, PoC, PR triage)
 * - Shared Smithers Cloud object store cache and strict trusted vs untrusted execution policy
 * - Public authenticated MCP endpoint and one-time sandbox auth posture
 * - Personalized Maintainer, Contributor, and Viewer home page (.smithers/home.json)
 *
 * Projected deterministically into .smithers/factory.json and .smithers/home.json by
 * `node scripts/factory/project-factory.mjs --write` and drift-checked by `//factory:projectionLint`.
 */

export const factoryDeclaration = {
	apiVersion: 1,
	name: 'evmts/tevm',
	summary:
		'TEVM: in-memory Ethereum node on native ZEVM, shared Smithers Cloud object store, Lighthouse Uphill backpressure, public MCP, wiki, and automated releases.',
	contributes: {
		triggers: [
			{ on: 'github.push', flow: 'ci', branches: ['main'], title: 'TEVM + ZEVM CI' },
			{ on: 'github.pull_request', flow: 'ci', branches: ['main'], title: 'PR CI' },
			{ on: 'github.push', flow: 'uphill', branches: ['main'], title: 'Lighthouse Uphill Audit' },
			{ on: 'github.pull_request', flow: 'uphill', branches: ['main'], title: 'PR Lighthouse Uphill Audit' },
			{ on: 'github.push', flow: 'release', branches: ['main', 'v1'], title: 'Automated Release Train' },
			{ on: 'github.push', flow: 'docs-publish', branches: ['main'], title: 'Automated Docs & Factory Portal Publish' },
			{ on: 'github.push', flow: 'wiki-refresh', branches: ['main'], title: 'Wiki & Mythical History Refresh' },
			{ on: 'github.pull_request', flow: 'parity', branches: ['main'], title: 'Ethereum Spec Parity' },
			{ on: 'github.push', flow: 'benchmarks', branches: ['main'], title: 'Incremental Benchmarks' },
			{ on: 'github.pull_request', flow: 'benchmarks', branches: ['main'], title: 'PR Benchmarks' },
			{ on: 'cron', flow: 'parity', cron: '0 3 * * *', title: 'Nightly Ethereum Conformance' },
			{ on: 'cron', flow: 'uphill', cron: '0 6 * * *', title: 'Daily Lighthouse Audit' },
			{ on: 'cron', flow: 'wiki-refresh', cron: '17 9 * * 1', title: 'Weekly Wiki & Mythical Refresh' },
			{ on: 'manual', flow: 'ci', title: 'Run TEVM + ZEVM CI' },
			{ on: 'manual', flow: 'uphill', title: 'Run Lighthouse Uphill Audit' },
			{ on: 'manual', flow: 'release', title: 'Run Release Rehearsal or Publish' },
			{ on: 'manual', flow: 'docs-publish', title: 'Build & Publish Docs + Portal' },
			{ on: 'manual', flow: 'parity', title: 'Run Ethereum Spec Parity' },
			{ on: 'manual', flow: 'benchmarks', title: 'Run Incremental Benchmarks' },
			{ on: 'manual', flow: 'wiki-refresh', title: 'Refresh Wiki & Mythical History' },
		],
	},
	flows: [
		{
			id: 'playground/exec',
			description: 'Deploy or call a contract and inspect Tevm opcodes and gas',
			summary: 'Deploy or call a contract and inspect opcodes and gas on native ZEVM.',
			featured: true,
			kind: 'mdx',
			path: '.smithers/flows/playground/exec/flow.mdx',
			capabilities: ['fs:read:**', 'proc:spawn:node .smithers/playground/run.mjs *'],
			model: null,
			modelInvocable: false,
			inputSchema: {
				dialect: 'draft-2020-12',
				schema: {
					type: 'object',
					properties: { args: { type: 'string' } },
					required: ['args'],
					additionalProperties: true,
				},
				definitions: {},
			},
			flows: ['playground/native'],
			budget: { milliseconds: 10000 },
		},
		{
			id: 'playground/native',
			description: 'Execute bounded local EVM requests and return their opcode trace',
			summary: null,
			featured: false,
			kind: 'ts',
			path: '.smithers/flows/playground/native/flow.ts',
			capabilities: ['fs:read:**', 'proc:spawn:node .smithers/playground/run.mjs *'],
			model: null,
			modelInvocable: false,
			flows: [],
		},
		{
			id: 'ci',
			description:
				'Full TEVM + ZEVM Smithers Cloud CI graph with shared object store cache, trust gates, and Lighthouse Uphill audit.',
			summary: 'Run ZEVM native build, factory checks, builds, typechecks, tests, docs, and Uphill.',
			featured: true,
			kind: 'ts',
			path: '.smithers/workflows/ci.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'uphill',
			description:
				'Run TEVM Lighthouse-style Backpressure Audit (Footprint, Quality, Architecture, and Factory Health) via Uphill.',
			summary: 'Score Footprint, Quality, Architecture, and Factory Health in a Lighthouse audit report.',
			featured: true,
			kind: 'ts',
			path: '.smithers/workflows/uphill.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'release',
			description:
				'Build ZEVM and @tevm/* packages, run publish smoke checks, and release to npm with provenance on trusted main merges.',
			summary: 'Verify publish smoke and execute the Changesets npm release train on trusted merges.',
			featured: true,
			kind: 'ts',
			path: '.smithers/workflows/release.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'docs-publish',
			description:
				'Build and publish TEVM Node docs (with llms.txt), Core docs, and the personalized Factory & Lighthouse Audit portal on main merges.',
			summary: 'Build and publish TEVM docs, llms.txt, and the personalized Factory UI on main merges.',
			featured: true,
			kind: 'ts',
			path: '.smithers/workflows/docs-publish.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'parity',
			description: 'Run Ethereum Execution Spec Tests, GeneralStateTests, and RPC parity suites against native ZEVM.',
			summary: 'Verify Ethereum Execution Spec, GeneralStateTests, and RPC parity on ZEVM.',
			featured: true,
			kind: 'ts',
			path: '.smithers/workflows/parity.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'benchmarks',
			description:
				'Run incremental Smithers benchmarks across all TEVM packages via the shared Smithers Cloud object store cache.',
			summary: 'Run incremental package benchmarks keyed against the shared Smithers Cloud cache.',
			featured: false,
			kind: 'ts',
			path: '.smithers/workflows/benchmarks.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'wiki-refresh',
			description:
				'Validate TEVM Obsidian wiki citations, wikilinks, mythical history epics, and Smithers Cloud factory projections after main merges.',
			summary: 'Keep the Obsidian wiki, mythical history, and factory projections verified on main.',
			featured: false,
			kind: 'ts',
			path: '.smithers/workflows/wiki-refresh.ts',
			capabilities: ['sandbox:job'],
			model: null,
			modelInvocable: true,
			flows: [],
		},
		{
			id: 'checks/review',
			description:
				'Multi-lens TEVM review covering JSON-RPC wire contracts, ZEVM native ABI, state isolation, regression proof, Uphill Lighthouse metrics, and trust boundaries.',
			summary: 'Review JSON-RPC contracts, ZEVM ABI, regression proof, Uphill scores, and trust boundaries.',
			featured: true,
			kind: 'mdx',
			path: '.smithers/flows/checks/review/flow.mdx',
			capabilities: ['fs:read:**', 'proc:spawn:rg *', 'proc:spawn:jj --no-pager *'],
			model: 'gpt-6.2-astra',
			modelInvocable: true,
			flows: [],
			budget: { tokens: 64000, milliseconds: 600000 },
		},
		{
			id: 'issue/repro',
			description:
				'Reproduce and validate a TEVM, ZEVM, JSON-RPC, or bundler defect with real local fixtures before planning a fix.',
			summary: 'Reproduce a TEVM or ZEVM issue with minimal real fixtures before planning a fix.',
			featured: true,
			kind: 'mdx',
			path: '.smithers/flows/issue/repro/flow.mdx',
			capabilities: [
				'fs:read:**',
				'proc:spawn:rg *',
				'proc:spawn:jj --no-pager *',
				'proc:spawn:node *',
				'proc:spawn:pnpm *',
			],
			model: 'gpt-6.2-sol',
			modelInvocable: true,
			flows: [],
			budget: { tokens: 64000, milliseconds: 900000 },
		},
		{
			id: 'issue/poc',
			description:
				'Implement a bounded failing-first regression test and proof-of-concept Change for a maintainer-accepted TEVM TODO.',
			summary: 'Build a failing-first regression test and bounded PoC for a maintainer-accepted TODO.',
			featured: true,
			kind: 'mdx',
			path: '.smithers/flows/issue/poc/flow.mdx',
			capabilities: [
				'fs:read:**',
				'fs:write:**',
				'proc:spawn:rg *',
				'proc:spawn:jj --no-pager *',
				'proc:spawn:node *',
				'proc:spawn:pnpm *',
				'proc:spawn:uphill *',
			],
			model: 'gpt-6.2-sol',
			modelInvocable: true,
			flows: [],
			budget: { tokens: 100000, milliseconds: 1800000 },
		},
		{
			id: 'pr-triage',
			description:
				'Triage an external or internal TEVM pull request from its metadata and diff alone without executing untrusted PR code.',
			summary: 'Assess pull request scope, tests, and protected paths from its diff without running untrusted code.',
			featured: true,
			kind: 'mdx',
			path: '.smithers/flows/pr-triage/flow.mdx',
			capabilities: ['fs:read:**', 'proc:spawn:rg *'],
			model: 'gpt-6.2-astra',
			modelInvocable: true,
			flows: [],
			budget: { tokens: 48000, milliseconds: 600000 },
		},
		{
			id: 'conformance-review',
			description:
				'Audit TEVM Ethereum spec conformance, ZEVM/Voltaire/Guillotine pin drift, Uphill Lighthouse scores, and incremental benchmark deltas.',
			summary: 'Audit Ethereum spec conformance, native pin drift, Uphill scores, and benchmark deltas.',
			featured: false,
			kind: 'mdx',
			path: '.smithers/flows/conformance-review/flow.mdx',
			capabilities: [
				'fs:read:**',
				'proc:spawn:rg *',
				'proc:spawn:jj --no-pager *',
				'proc:spawn:node *',
				'proc:spawn:pnpm *',
				'proc:spawn:uphill *',
			],
			model: 'gpt-6.2-sol',
			modelInvocable: true,
			flows: [],
			budget: { tokens: 80000, milliseconds: 2400000 },
		},
	],
	on: [
		{
			event: 'issue.labeled:todo',
			flow: 'issue/poc',
			description: 'Implement every maintainer-accepted TEVM TODO as a failing-first Change',
		},
		{
			event: 'change.opened',
			flow: 'checks/review',
			description: 'Review every Change across RPC contract, ZEVM ABI, regression proof, and Uphill metrics',
		},
		{
			event: 'change.updated',
			flow: 'checks/review',
			description: 'Re-review every updated Change',
		},
		{
			event: 'change.landed',
			flow: 'wiki-refresh',
			description: 'Refresh wiki citations, mythical history, and factory projections after landing',
		},
		{
			event: 'github.push:main',
			flow: 'docs-publish',
			description: 'Publish Node docs, llms.txt, and Factory Portal after every merge to main',
		},
		{
			event: 'github.push:main',
			flow: 'release',
			description: 'Run the Changesets release train after every merge to main',
		},
		{
			event: 'schedule:0 3 * * *',
			flow: 'parity',
			description: 'Nightly Ethereum Execution Spec and GeneralStateTests parity run',
		},
		{
			event: 'schedule:0 6 * * *',
			flow: 'uphill',
			description: 'Daily Lighthouse-style Uphill backpressure audit',
		},
		{
			event: 'schedule:17 9 * * 1',
			flow: 'conformance-review',
			description: 'Weekly Monday conformance, native pin hygiene, and benchmark audit',
		},
	],
	github: {
		mirror: 'pull',
		issues: 'two-way',
		changes: 'send-upstream',
		maintainers: ['roninjin10'],
		protectedPaths: [
			'WORKSPACE.ts',
			'PACKAGE.ts',
			'mise.toml',
			'.nvmrc',
			'factory/policy.json',
			'factory/native-dependencies.json',
			'.smithers/FACTORY.ts',
			'.smithers/factory.json',
			'.smithers/workflows',
			'.github/PACKAGE.ts',
			'.github/workflows',
		],
	},
	cache: {
		provider: 'smithers-cloud-object-store',
		endpoint: 'https://build.smithers.sh',
		readSecret: 'SMITHERS_CACHE_READ_TOKEN',
		writeSecret: 'SMITHERS_CACHE_WRITE_TOKEN',
	},
	mcp: {
		url: 'https://smithers.sh/evmts/tevm/mcp',
		oauthProtectedResource: 'https://smithers.sh/.well-known/oauth-protected-resource/evmts/tevm/mcp',
		publicReads: true,
		publicTodos: true,
		oneTimeSandboxAuth: true,
	},
	trust: {
		acceptExecutionFrom: ['smithers-sandbox', 'maintainer'],
		maintainers: ['roninjin10'],
		allowUntrustedExecution: true,
		untrustedCacheRead: true,
		untrustedCacheWrite: false,
		untrustedSkipGates: false,
	},
	wiki: {
		catalog: '.smithers/coding-project.json',
		root: '.smithers/wiki',
		mythicalHistory: '.smithers/history/mythical.json',
	},
} as const

export const homeDeclaration = {
	docs: 'https://node.tevm.sh/llms.txt',
	contributors: 'role',
	sections: [
		{
			title: 'Maintainer Control Plane',
			audience: 'maintainer',
			blocks: [
				{
					type: 'action',
					flow: 'branch.new',
					title: 'New branch',
					key: 'b',
				},
				{
					type: 'issues',
					title: 'Triage and incoming issues',
				},
				{
					type: 'stack',
					title: 'Active TODO and Change stack',
				},
				{
					type: 'runs',
					title: 'CI, Lighthouse audit, release, and docs runs',
				},
				{
					type: 'links',
					title: 'Maintainer operations',
					links: [
						{ label: 'Factory policy', url: 'https://smithers.sh/evmts/tevm/blob/main/factory/policy.json' },
						{
							label: 'Trust boundary & cache',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.smithers/wiki/pages/coding-factory.md',
						},
						{
							label: 'Release & docs pipeline',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.smithers/wiki/pages/release-and-docs-pipeline.md',
						},
						{
							label: 'Uphill Lighthouse config',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.agents/uphill/uphill.yaml',
						},
						{ label: 'GitHub Actions mirror', url: 'https://github.com/evmts/tevm/actions' },
					],
				},
			],
		},
		{
			title: 'Contributor Workbench',
			audience: 'contributor',
			blocks: [
				{
					type: 'code',
					title: 'Fast local setup with shared read-only Smithers Cloud cache',
					language: 'sh',
					code: 'pnpm install\npnpm exec smthrs target //:zevm\npnpm exec smthrs target //factory:check\npnpm exec smthrs target //:mechanicalPrePush\nuphill --compare HEAD --compact',
				},
				{
					type: 'code',
					title: 'Connect your own agent via Smithers Cloud MCP (OAuth 2.1 + PKCE)',
					language: 'sh',
					code: '# Claude Code\nclaude mcp add tevm --transport http https://smithers.sh/evmts/tevm/mcp\n\n# Codex CLI\ncodex mcp add tevm --url https://smithers.sh/evmts/tevm/mcp\n\n# Antigravity CLI\nagy mcp add tevm --transport http https://smithers.sh/evmts/tevm/mcp',
				},
				{
					type: 'cards',
					title: 'How a change lands on TEVM',
					cards: [
						{
							title: '1. File a repro or pick a public TODO',
							text: 'Create issues, TODOs, and artifacts through the Smithers Cloud MCP server with minimal failing reproduction steps.',
						},
						{
							title: '2. Run untrusted checks freely',
							text: 'Non-maintainers are encouraged to run tests locally or in untrusted sandboxes with read-only shared cache access. Untrusted runs never write the cache or skip gates.',
						},
						{
							title: '3. Pass Lighthouse backpressure',
							text: 'Every PR is audited by Uphill across Footprint, Quality, Architecture, and Factory Health plus regression proof and RPC wire contract checks.',
						},
						{
							title: '4. Maintainer merge ships automatically',
							text: 'Only a maintainer approves and merges. Merging to main on Smithers Cloud mirrors to GitHub and triggers releases, docs publishing, and wiki refresh.',
						},
					],
				},
				{
					type: 'flows',
					title: 'Contributor, review, and audit flows',
				},
				{
					type: 'links',
					title: 'Public engineering surfaces',
					links: [
						{ label: 'Public issues', url: 'https://smithers.sh/evmts/tevm/issues' },
						{ label: 'Pull requests', url: 'https://smithers.sh/evmts/tevm/pulls' },
						{ label: 'Engineering wiki', url: 'https://smithers.sh/evmts/tevm/blob/main/.smithers/wiki/README.md' },
						{
							label: 'Mythical history',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.smithers/history/MYTHICAL.md',
						},
						{ label: 'Uphill rules', url: 'https://smithers.sh/evmts/tevm/blob/main/.agents/uphill/rules.md' },
					],
				},
				{
					type: 'prompt',
					title: 'Ask the TEVM codebase',
					placeholder: 'Ask about TEVM packages, ZEVM native engine, JSON-RPC methods, or Uphill metrics...',
				},
			],
		},
		{
			audience: 'everyone',
			blocks: [
				{
					type: 'hero',
					title: 'TEVM',
					tagline:
						'In-memory Ethereum Virtual Machine and full node for TypeScript, powered by Zig (ZEVM) and native Viem.',
					text: 'Deploy contracts, fork mainnet, inspect opcodes, and run Ethereum specs at native speed in Node, Bun, and browsers. Built publicly on Smithers Cloud.',
					install: 'npm install tevm',
					actions: [
						{ label: 'Get started', url: 'https://node.tevm.sh/getting-started/overview' },
						{ label: 'Docs', url: 'https://node.tevm.sh' },
						{ label: 'Browse code', url: 'https://smithers.sh/evmts/tevm/tree/main' },
					],
					announcement: {
						label: 'Public Smithers Cloud coding factory with live MCP, open TODOs, and Lighthouse backpressure',
						url: 'https://smithers.sh/evmts/tevm',
					},
				},
				{
					type: 'view',
					flow: 'playground/exec',
				},
				{
					type: 'code',
					file: 'in-memory-evm.ts',
					language: 'ts',
					code: 'import { createMemoryClient } from "tevm"\nimport { parseEther } from "viem"\n\nconst client = createMemoryClient()\n\nawait client.tevmSetAccount({\n  address: "0x0000000000000000000000000000000000000123",\n  balance: parseEther("10"),\n  deployedBytecode: "0x602a60005260206000f3",\n})\n\nconst { rawData } = await client.tevmCall({\n  to: "0x0000000000000000000000000000000000000123",\n  data: "0x",\n})\n\nconsole.log(BigInt(rawData)) // 42n\nawait client.tevmClose()',
				},
				{
					type: 'stats',
					stats: [
						{ value: 'MIT', label: 'Open source license' },
						{ value: 'ZEVM + Voltaire', label: 'Native Zig EVM core' },
						{ value: 'Viem-native', label: 'EIP-1193 and JSON-RPC' },
						{ value: 'Public Factory', label: 'Open MCP, TODOs, Lighthouse audits' },
					],
				},
				{
					type: 'cards',
					title: 'Core packages',
					cards: [
						{
							label: 'tevm',
							title: 'Unified Facade',
							text: 'Single entrypoint exporting the memory client, node, actions, contracts, errors, and utils.',
							url: 'https://www.npmjs.com/package/tevm',
						},
						{
							label: '@tevm/memory-client',
							title: 'Viem Memory Client',
							text: 'Drop-in Viem client backed by an in-memory Ethereum node with forking and instant mining.',
							url: 'https://www.npmjs.com/package/@tevm/memory-client',
						},
						{
							label: '@tevm/node',
							title: 'Native ZEVM Node',
							text: 'Full Ethereum execution node powered by ZEVM, Guillotine Mini, and Voltaire cryptography.',
							url: 'https://www.npmjs.com/package/@tevm/node',
						},
						{
							label: '@tevm/actions',
							title: 'JSON-RPC Actions',
							text: 'Typed handlers for eth_*, tevm_*, anvil_*, and debug_* JSON-RPC methods.',
							url: 'https://www.npmjs.com/package/@tevm/actions',
						},
						{
							label: '@tevm/contract',
							title: 'Typed Contracts',
							text: 'Create type-safe contract scripts and bytecode wrappers directly from Solidity ABIs.',
							url: 'https://www.npmjs.com/package/@tevm/contract',
						},
						{
							label: '@tevm/mcp',
							title: 'TEVM MCP Server',
							text: 'Give AI coding agents an isolated in-memory Ethereum node for testing and simulation.',
							url: 'https://www.npmjs.com/package/@tevm/mcp',
						},
						{
							label: '@tevm/cli',
							title: 'TEVM CLI',
							text: 'Interactive terminal workflow for local nodes, contract calls, and JSON-RPC inspection.',
							url: 'https://www.npmjs.com/package/@tevm/cli',
						},
						{
							label: '@tevm/server',
							title: 'HTTP & JSON-RPC Server',
							text: 'Expose any Tevm node over standard HTTP and WebSocket JSON-RPC endpoints.',
							url: 'https://www.npmjs.com/package/@tevm/server',
						},
					],
					more: {
						label: 'Browse all packages',
						url: 'https://smithers.sh/evmts/tevm/tree/main/packages',
					},
				},
				{
					type: 'cards',
					title: 'TEVM universe and public factory',
					cards: [
						{
							label: 'evmts/zevm',
							title: 'ZEVM Native Engine',
							text: 'Embeddable Zig Ethereum node with C and Node-API bindings dogfooded via Smithers.',
							url: 'https://smithers.sh/evmts/zevm',
						},
						{
							label: 'evmts/voltaire',
							title: 'Voltaire Primitives',
							text: 'High-performance Ethereum cryptography and primitives in Zig and TypeScript.',
							url: 'https://smithers.sh/evmts/voltaire',
						},
						{
							label: 'evmts/guillotine',
							title: 'Guillotine EVM',
							text: 'Next-generation high-speed Ethereum Virtual Machine execution engine.',
							url: 'https://github.com/evmts/guillotine',
						},
						{
							label: 'Wiki + History',
							title: 'Engineering Wiki & Mythical History',
							text: 'Obsidian-compatible architecture wiki and clean from-scratch epic timeline.',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.smithers/wiki/README.md',
						},
						{
							label: 'Backpressure',
							title: 'Lighthouse Audit Report',
							text: 'Continuous Uphill scoring across Footprint, Quality, Architecture, and Factory Health.',
							url: 'https://smithers.sh/evmts/tevm/blob/main/.agents/uphill/rules.md',
						},
						{
							label: 'BYOA MCP',
							title: 'Public Authenticated MCP Server',
							text: 'Attach Claude Code, Codex, or Antigravity via OAuth 2.1 to create issues, TODOs, and PRs.',
							url: 'https://smithers.sh/evmts/tevm/mcp',
						},
					],
				},
				{
					type: 'releases',
					title: 'Releases',
					releases: [
						{
							name: 'tevm@2.0.0-next.107',
							url: 'https://github.com/evmts/tevm/releases',
							date: '2026-11-26',
							summary: 'Native ZEVM engine, incremental Smithers benchmarks, fuzzing suite, and Uphill backpressure.',
						},
						{
							name: 'tevm@1.0.0-rc.151',
							url: 'https://github.com/evmts/tevm/releases/tag/v1.0.0-rc.151',
							date: '2026-08-29',
							summary: 'Full Viem-native memory client, bundler plugins, and Ethereum spec conformance updates.',
						},
					],
					more: {
						label: 'All releases',
						url: 'https://github.com/evmts/tevm/releases',
					},
				},
				{
					type: 'links',
					title: 'Community and infrastructure',
					links: [
						{ label: 'Smithers Cloud', url: 'https://smithers.sh/evmts/tevm' },
						{ label: 'GitHub mirror', url: 'https://github.com/evmts/tevm' },
						{ label: 'Node documentation', url: 'https://node.tevm.sh' },
						{ label: 'MCP endpoint', url: 'https://smithers.sh/evmts/tevm/mcp' },
						{ label: 'Telegram', url: 'https://t.me/+ANThR9bHDLAwMjUx' },
						{ label: 'X / Twitter', url: 'https://x.com/tevmtools' },
					],
				},
				{
					type: 'prompt',
					title: 'Questions about TEVM?',
					placeholder: 'Ask how to fork mainnet, trace bytecode in ZEVM, or contribute through MCP...',
				},
			],
		},
	],
} as const
