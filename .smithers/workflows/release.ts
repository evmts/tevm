import { Flow } from '@smthrs/flow'
import { Node } from '@smthrs/plan'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const buildAndSmoke = CiJob.make('build-and-verify-packages', {
	steps: [
		{
			name: 'checkout-pinned-native-sources',
			run: 'node scripts/factory/checkout-native.mjs',
		},
		{
			name: 'install-and-build-zevm',
			run: 'pnpm install --frozen-lockfile && SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:zevm',
		},
		{
			name: 'verify-publish-smoke',
			run: 'pnpm release:verify',
		},
	],
})

const publishRelease = (channel: string, dryRun: boolean) =>
	CiJob.make('publish-npm-release', {
		needs: ['build-and-verify-packages'],
		steps: [
			{
				name: 'enforce-trusted-release-boundary',
				run: 'node scripts/factory/trust-boundary.mjs',
			},
			{
				name: 'execute-release-train',
				run: dryRun
					? `echo "Dry-run release check complete (channel=${channel})"`
					: `if [ -n "$NPM_TOKEN" ]; then NPM_CONFIG_PROVENANCE=true pnpm release:publish; else echo "NPM_TOKEN absent (untrusted or unconfigured); skipping publish"; fi`,
			},
		],
	})

export default Flow.make('release', {
	description:
		'Build ZEVM and @tevm/* packages, run publish smoke checks, and release to npm with provenance on trusted main merges.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		channel: Schema.optional(
			Schema.Literals(['auto', 'stable', 'prerelease']).annotate({
				title: 'Release channel',
				description: 'Auto detects .changeset/pre.json; stable or prerelease forces mode',
				default: 'auto',
			}),
		),
		dryRun: Schema.optional(
			Schema.Boolean.annotate({
				title: 'Dry run',
				description: 'Run verification and rehearsal without publishing to npm',
				default: false,
			}),
		),
	},
	body: (input: { readonly channel?: 'auto' | 'stable' | 'prerelease'; readonly dryRun?: boolean }) =>
		Node.all({
			buildAndSmoke: buildAndSmoke.call(),
			publish: publishRelease(input.channel ?? 'auto', input.dryRun === true).call(),
		}),
})
