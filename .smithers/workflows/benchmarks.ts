import { Flow } from '@smthrs/flow'
import { CiJob } from '@smthrs/sandbox'

const benchmarksJob = CiJob.make('incremental-benchmarks', {
	steps: [
		{
			name: 'checkout-pinned-native-sources',
			run: 'node scripts/factory/checkout-native.mjs',
		},
		{
			name: 'install-workspace',
			run: 'pnpm install --frozen-lockfile',
		},
		{
			name: 'run-cached-benchmarks',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:bench',
		},
	],
})

export default Flow.make('benchmarks', {
	description:
		'Run incremental Smithers benchmarks across all TEVM packages via the shared Smithers Cloud object store cache.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {},
	body: () => benchmarksJob.call(),
})
