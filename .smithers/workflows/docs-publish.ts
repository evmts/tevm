import { Flow } from '@smthrs/flow'
import { Node } from '@smthrs/plan'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const buildDocs = CiJob.make('build-docs-and-portal', {
	steps: [
		{
			name: 'install-workspace',
			run: 'pnpm install --frozen-lockfile',
		},
		{
			name: 'sync-llms-and-factory-projections',
			run: 'node scripts/factory/generate-llms-txt.mjs --check && node scripts/factory/project-factory.mjs && pnpm factory:contributor-data-check',
		},
		{
			name: 'build-node-docs',
			run: 'pnpm --filter @tevm/node-docs build:app',
		},
		{
			name: 'build-core-docs',
			run: 'pnpm --filter @tevm/core-docs build',
		},
		{
			name: 'build-contributor-factory-ui',
			run: 'pnpm --filter @tevm/contributor-portal build',
		},
	],
})

const publishDocs = (dryRun: boolean) =>
	CiJob.make('publish-docs-sites', {
		needs: ['build-docs-and-portal'],
		steps: [
			{
				name: 'verify-trust-boundary',
				run: 'node scripts/factory/trust-boundary.mjs',
			},
			{
				name: 'deploy-docs-bundle',
				run: dryRun
					? 'echo "Dry-run docs build verified; skipping live publish"'
					: 'node scripts/factory/publish-docs.mjs',
			},
		],
	})

export default Flow.make('docs-publish', {
	description:
		'Build and publish TEVM Node docs (with llms.txt), Core docs, and the personalized Factory & Lighthouse Audit portal on main merges.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		dryRun: Schema.optional(
			Schema.Boolean.annotate({
				title: 'Dry run',
				description: 'Build and verify docs + llms.txt without deploying',
				default: false,
			}),
		),
	},
	body: (input: { readonly dryRun?: boolean }) =>
		Node.all({
			buildDocs: buildDocs.call(),
			publishDocs: publishDocs(input.dryRun === true).call(),
		}),
})
