import { Flow } from '@smthrs/flow'
import { CiJob } from '@smthrs/sandbox'

const wikiRefreshJob = CiJob.make('wiki-and-mythical-refresh', {
	steps: [
		{
			name: 'verify-wiki-catalog-and-links',
			run: 'node scripts/factory/verify-wiki.mjs',
		},
		{
			name: 'verify-mythical-history',
			run: 'node scripts/factory/mythical-history.mjs --check',
		},
		{
			name: 'verify-factory-projection',
			run: 'node scripts/factory/project-factory.mjs',
		},
	],
})

export default Flow.make('wiki-refresh', {
	description:
		'Validate TEVM Obsidian wiki citations, wikilinks, mythical history epics, and Smithers Cloud factory projections after main merges.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {},
	body: () => wikiRefreshJob.call(),
})
