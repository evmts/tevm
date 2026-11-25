import { defineConfig } from 'vocs/config'

const previewUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

export default defineConfig({
	title: 'Tevm',
	titleTemplate: '%s · Tevm',
	baseUrl: process.env.VERCEL_ENV === 'production' ? 'https://node.tevm.sh' : previewUrl,
	srcDir: '.',
	renderStrategy: 'full-static',
	description:
		'Native Ethereum execution embedded in Node.js — viem-compatible memory client, HTTP/WS/IPC JSON-RPC server, and Solidity bundler plugins.',
	logoUrl: {
		light: '/tevm-logo-light.png',
		dark: '/tevm-logo-dark.png',
	},
	iconUrl: '/tevm-logo.webp',
	ogImageUrl: 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
	accentColor: '#0085FF',
	colorScheme: 'light dark',
	topNav: [
		{
			text: 'Start',
			link: '/getting-started/overview',
			match: '/getting-started',
		},
		{
			text: 'Guides',
			link: '/core/create-tevm-node',
			match: '/core',
		},
		{
			text: 'API & Server',
			link: '/api/tevm-call',
			match: '/api',
		},
		{
			text: 'Cookbooks',
			link: '/examples/local-testing',
			match: '/examples',
		},
		{
			text: 'CLI',
			link: '/reference/cli',
			match: '/reference/cli',
		},
		{
			text: 'Ecosystem',
			items: [
				{ text: 'Viem', link: 'https://viem.sh/' },
				{ text: 'ZEVM Docs', link: 'https://zevm.sh/docs' },
				{ text: 'ZEVM GitHub', link: 'https://github.com/evmts/zevm' },
				{ text: 'Tevm GitHub', link: 'https://github.com/evmts/tevm' },
			],
		},
	],
	sidebar: [
		{
			text: 'Start here',
			collapsed: false,
			items: [
				{ text: 'Quickstart', link: '/getting-started/overview' },
				{ text: 'What is Tevm?', link: '/introduction/what-is-tevm-node' },
				{ text: 'Why embed an EVM?', link: '/introduction/why-run-ethereum-in-js' },
				{ text: 'Architecture', link: '/introduction/architecture-overview' },
				{ text: 'Tutorial: Viem', link: '/getting-started/viem' },
				{ text: 'Tutorial: Ethers v6', link: '/getting-started/ethers' },
				{ text: 'Tutorial: Solidity bundler', link: '/getting-started/bundler' },
				{ text: 'Community', link: '/getting-started/testimonials' },
			],
		},
		{
			text: 'Core guides',
			collapsed: false,
			items: [
				{ text: 'Client & engine options', link: '/core/create-tevm-node' },
				{ text: 'Mining & block production', link: '/core/mining-modes' },
				{ text: 'Forking upstream chains', link: '/core/forking' },
				{ text: 'Accounts, storage & snapshots', link: '/core/managing-state' },
				{ text: 'Runtime model & ZEVM', link: '/core/runtime-model' },
				{ text: 'Engine API (ZevmEngine)', link: '/core/tevm-node-interface' },
				{ text: 'Migrating from JS engine', link: '/core/migration-from-js-engine' },
			],
		},
		{
			text: 'API, servers & tooling',
			collapsed: false,
			items: [
				{ text: 'Call, contract & deploy', link: '/api/tevm-call' },
				{ text: 'Account management', link: '/api/account-management' },
				{ text: 'HTTP, WebSocket & IPC server', link: '/api/server' },
				{ text: 'Tracing & engine events', link: '/api/evm-events' },
				{ text: 'JSON-RPC reference', link: '/api/json-rpc' },
				{ text: 'Client methods map', link: '/api/methods' },
				{ text: 'MCP server for AI agents', link: '/api/mcp-server' },
				{ text: 'Package overview', link: '/api/packages' },
			],
		},
		{
			text: 'Cookbooks',
			collapsed: false,
			items: [
				{ text: 'Testing with Vitest', link: '/examples/local-testing' },
				{ text: 'Viem cookbook', link: '/examples/viem' },
				{ text: 'Ethers v6 cookbook', link: '/examples/ethers' },
				{ text: 'Forking mainnet', link: '/examples/forking-mainnet' },
				{ text: 'Browser trace viewer', link: '/examples/debugger-ui' },
			],
		},
		{
			text: 'Package reference',
			collapsed: true,
			items: [
				{ text: 'All packages', link: '/reference' },
				{ text: 'Memory client (@tevm/memory-client)', link: '/reference/memory-client' },
				{ text: 'Native engine (@tevm/node)', link: '/reference/node' },
				{ text: 'Actions (@tevm/actions)', link: '/reference/actions' },
				{ text: 'Server (@tevm/server)', link: '/reference/server' },
				{ text: 'Contract (@tevm/contract)', link: '/reference/contract' },
				{ text: 'Common (@tevm/common)', link: '/reference/common' },
				{ text: 'Utils (@tevm/utils)', link: '/reference/utils' },
				{
					text: 'Bundler plugins',
					link: '/reference/bundler',
					items: [
						{ text: 'Overview', link: '/reference/bundler/overview' },
						{ text: 'Plugins reference', link: '/reference/bundler-plugins' },
						{ text: 'Internals', link: '/reference/bundler/internals' },
						{ text: 'Methods & exports', link: '/reference/bundler/methods' },
						{ text: 'Troubleshooting', link: '/reference/bundler/troubleshooting' },
					],
				},
			],
		},
		{
			text: 'CLI reference',
			collapsed: true,
			items: [
				{ text: 'Overview', link: '/reference/cli' },
				{ text: 'call', link: '/reference/cli/call' },
				{ text: 'compile', link: '/reference/cli/compile' },
				{ text: 'contract', link: '/reference/cli/contract' },
				{ text: 'create-access-list', link: '/reference/cli/create-access-list' },
				{ text: 'create-block-filter', link: '/reference/cli/create-block-filter' },
				{ text: 'create-contract-event-filter', link: '/reference/cli/create-contract-event-filter' },
				{ text: 'create-event-filter', link: '/reference/cli/create-event-filter' },
				{ text: 'deploy', link: '/reference/cli/deploy' },
				{ text: 'dump-state', link: '/reference/cli/dump-state' },
				{ text: 'estimate-fees-per-gas', link: '/reference/cli/estimate-fees-per-gas' },
				{ text: 'estimate-gas', link: '/reference/cli/estimate-gas' },
				{ text: 'get-account', link: '/reference/cli/get-account' },
				{ text: 'get-balance', link: '/reference/cli/get-balance' },
				{ text: 'get-block', link: '/reference/cli/get-block' },
				{ text: 'get-block-number', link: '/reference/cli/get-block-number' },
				{ text: 'get-bytecode', link: '/reference/cli/get-bytecode' },
				{ text: 'get-chain-id', link: '/reference/cli/get-chain-id' },
				{ text: 'get-ens-address', link: '/reference/cli/get-ens-address' },
				{ text: 'get-ens-name', link: '/reference/cli/get-ens-name' },
				{ text: 'get-ens-text', link: '/reference/cli/get-ens-text' },
				{ text: 'get-gas-price', link: '/reference/cli/get-gas-price' },
				{ text: 'get-storage-at', link: '/reference/cli/get-storage-at' },
				{ text: 'get-transaction', link: '/reference/cli/get-transaction' },
				{ text: 'load-state', link: '/reference/cli/load-state' },
				{ text: 'mine', link: '/reference/cli/mine' },
				{ text: 'multicall', link: '/reference/cli/multicall' },
				{ text: 'read-contract', link: '/reference/cli/read-contract' },
				{ text: 'send-raw-transaction', link: '/reference/cli/send-raw-transaction' },
				{ text: 'serve', link: '/reference/cli/serve' },
				{ text: 'set-account', link: '/reference/cli/set-account' },
				{ text: 'set-code', link: '/reference/cli/set-code' },
				{ text: 'set-nonce', link: '/reference/cli/set-nonce' },
				{ text: 'set-storage-at', link: '/reference/cli/set-storage-at' },
				{ text: 'simulate-calls', link: '/reference/cli/simulate-calls' },
			],
		},
	],
	editLink: {
		link: 'https://github.com/evmts/tevm/edit/main/docs/node/pages/:path',
		text: 'Edit this page on GitHub',
	},
	search: {
		boostDocument(documentId) {
			if (documentId.includes('getting-started') || documentId.includes('core/')) {
				return 2
			}
			return 1
		},
	},
	socials: [
		{
			icon: 'github',
			link: 'https://github.com/evmts/tevm',
		},
		{
			icon: 'telegram',
			link: 'https://t.me/+ANThR9bHDLAwMjUx',
		},
		{
			icon: 'x',
			link: 'https://x.com/tevmtools',
		},
	],
	codeHighlight: {
		themes: {
			light: 'github-light',
			dark: 'github-dark',
		},
	},
})
