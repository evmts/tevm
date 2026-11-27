import { Flow } from '@smthrs/flow'
import { Node } from '@smthrs/plan'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const parityJob = (suite: 'fast' | 'nightly') =>
	CiJob.make('ethereum-parity', {
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
				name: 'run-parity-suite',
				run:
					suite === 'nightly'
						? 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //test:nightlyConformance'
						: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //test:parityFast && pnpm exec smthrs target //test:conformanceFast',
			},
		],
	})

export default Flow.make('parity', {
	description: 'Run Ethereum Execution Spec Tests, GeneralStateTests, and RPC parity suites against native ZEVM.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		suite: Schema.optional(
			Schema.Literals(['fast', 'nightly']).annotate({
				title: 'Suite tier',
				description: 'Fast bounded PR subset or full nightly corpus',
				default: 'fast',
			}),
		),
	},
	body: (input: { readonly suite?: 'fast' | 'nightly' }) => parityJob(input.suite ?? 'fast').call(),
})
