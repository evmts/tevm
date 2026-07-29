export type DocsSiteId = 'core' | 'test' | 'bundlers' | 'lsp' | 'zevm' | 'ethers' | 'voltaire'

export type DocsSite = {
	id: DocsSiteId
	name: string
	label: string
	description: string
	url: string
	repoPath: string
	status: 'live' | 'planned'
}

export const docsSites = [
	{
		id: 'core',
		name: 'tevm core',
		label: 'Core',
		description: 'The EVM, memory client, actions, state manager, and forking.',
		url: 'https://node.tevm.sh',
		repoPath: 'sites/core',
		status: 'live',
	},
	{
		id: 'test',
		name: 'tevm test',
		label: 'Test',
		description: 'Vitest integration, fixtures, and the Anvil-compatible surface.',
		url: 'https://test.tevm.sh',
		repoPath: 'sites/test',
		status: 'planned',
	},
	{
		id: 'bundlers',
		name: 'bundler plugins',
		label: 'Bundlers',
		description: 'Import Solidity with Rollup, Webpack, Vite, esbuild, Bun, or unplugin.',
		url: 'https://bundlers.tevm.sh',
		repoPath: 'sites/bundlers',
		status: 'planned',
	},
	{
		id: 'lsp',
		name: 'LSP / ts-plugin',
		label: 'LSP',
		description: 'Editor integration and typechecking for Solidity imports.',
		url: 'https://lsp.tevm.sh',
		repoPath: 'sites/lsp',
		status: 'planned',
	},
	{
		id: 'zevm',
		name: 'zevm',
		label: 'zevm',
		description: 'The Zig EVM, its build, C ABI, and embeddable execution library.',
		url: 'https://docs.zevm.sh',
		repoPath: 'sites/zevm',
		status: 'planned',
	},
	{
		id: 'ethers',
		name: 'ethers client',
		label: 'Ethers',
		description: 'The ethers-flavoured tevm client and provider integration.',
		url: 'https://ethers.tevm.sh',
		repoPath: 'sites/ethers',
		status: 'planned',
	},
	{
		id: 'voltaire',
		name: 'voltaire',
		label: 'Voltaire',
		description: 'Voltaire primitives, APIs, and integration guidance.',
		url: 'https://voltaire.tevm.sh',
		repoPath: 'sites/voltaire',
		status: 'planned',
	},
] as const satisfies readonly DocsSite[]

export const getDocsSite = (siteId: DocsSiteId): DocsSite => {
	const site = docsSites.find(({ id }) => id === siteId)
	if (!site) throw new Error(`Unknown documentation site: ${siteId}`)
	return site
}

type NavItem = {
	text: string
	link?: string
	match?: string
	items?: Array<{ text: string; link: string }>
}

type CreateDocsConfigOptions = {
	siteId: DocsSiteId
	description: string
	sidebar: unknown[]
	topNav: NavItem[]
}

export const createDocsConfig = ({ siteId, description, sidebar, topNav }: CreateDocsConfigOptions) => {
	const site = getDocsSite(siteId)
	const previewUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

	return {
		title: site.name,
		titleTemplate: `%s · ${site.name}`,
		description,
		baseUrl: process.env.VERCEL_ENV === 'production' ? site.url : previewUrl,
		rootDir: '.',
		checkDeadlinks: true,
		theme: {
			accentColor: '#5b5bd6',
			colorScheme: 'system',
		},
		font: {
			google: 'Inter',
		},
		iconUrl:
			'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%235b5bd6%22/%3E%3Cpath d=%22M15 20h34v8H36v22h-8V28H15z%22 fill=%22white%22/%3E%3C/svg%3E',
		banner: {
			content: 'Versioned for `tevm@1.0.0-rc.151`.',
			dismissable: true,
			backgroundColor: '#ececff',
		},
		topNav: [
			...topNav,
			{
				text: 'All docs',
				items: docsSites.map(({ label, url }) => ({ text: label, link: url })),
			},
		],
		sidebar,
		editLink: {
			pattern: `https://github.com/evmts/tevm/edit/main/${site.repoPath}/pages/:path`,
			text: 'Edit this page on GitHub',
		},
		search: {
			boostDocument(documentId: string) {
				if (documentId.includes('getting-started') || documentId === 'index') return 2
				return 1
			},
		},
		socials: [
			{
				icon: 'github',
				link: 'https://github.com/evmts/tevm',
				label: 'GitHub',
			},
			{
				icon: 'x',
				link: 'https://x.com/tevmtools',
				label: 'X',
			},
		],
		markdown: {
			code: {
				themes: {
					light: 'github-light',
					dark: 'github-dark',
				},
			},
		},
		llms: {
			generateMarkdown: true,
		},
	}
}
