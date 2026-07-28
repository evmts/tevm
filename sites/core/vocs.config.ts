import { createDocsConfig } from '@tevm/docs-shared'
import { defineConfig } from 'vocs'

export default defineConfig(
	createDocsConfig({
		siteId: 'core',
		description: 'Run an EVM in JavaScript with an in-memory or forked client.',
		topNav: [
			{ text: 'Start', link: '/getting-started', match: '/getting-started' },
			{ text: 'Concepts', link: '/concepts/evm', match: '/concepts' },
			{ text: 'Guides', link: '/guides/memory-client', match: '/guides' },
			{ text: 'Reference', link: '/reference/core-api', match: '/reference' },
		],
		sidebar: [
			{
				text: 'Start',
				items: [
					{ text: 'What is tevm?', link: '/' },
					{ text: 'Getting started', link: '/getting-started' },
				],
			},
			{
				text: 'Concepts',
				items: [{ text: 'The EVM in tevm', link: '/concepts/evm' }],
			},
			{
				text: 'Guides',
				items: [
					{ text: 'Memory client', link: '/guides/memory-client' },
					{ text: 'Actions', link: '/guides/actions' },
					{ text: 'State manager', link: '/guides/state-manager' },
					{ text: 'Forking', link: '/guides/forking' },
				],
			},
			{
				text: 'Reference',
				items: [{ text: 'Core API map', link: '/reference/core-api' }],
			},
		],
	}),
)
