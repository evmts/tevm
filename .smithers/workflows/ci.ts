import { Flow } from '@smthrs/flow'
import { Node } from '@smthrs/plan'
import { CiJob } from '@smthrs/sandbox'
import { Schema } from 'effect'

const zevmNative = CiJob.make('zevm-native', {
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
			name: 'build-zevm-native',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:zevm',
		},
	],
})

const factoryGates = CiJob.make('factory-gates', {
	needs: ['zevm-native'],
	steps: [
		{
			name: 'factory-contract-and-trust-boundary',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //factory:check',
		},
		{
			name: 'github-workflow-parity',
			run: 'pnpm exec smthrs target //.github:github',
		},
		{
			name: 'playground-execution-tests',
			run: 'node --test .smithers/playground/run.test.mjs',
		},
	],
})

const buildAndTypecheck = CiJob.make('build-and-typecheck', {
	needs: ['zevm-native'],
	steps: [
		{
			name: 'build-packages-and-types',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:allTypes',
		},
		{
			name: 'typecheck-workspace',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:allTypechecks',
		},
	],
})

const unitTestsAndLint = CiJob.make('unit-tests-and-lint', {
	needs: ['build-and-typecheck'],
	steps: [
		{
			name: 'hermetic-tests',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:allHermeticTests',
		},
		{
			name: 'workspace-lint',
			run: 'SMITHERS_CACHE_URL="${SMITHERS_CACHE_URL:-https://build.smithers.sh}" pnpm exec smthrs target //:allLints',
		},
	],
})

const uphillAudit = CiJob.make('uphill-audit', {
	needs: ['factory-gates'],
	steps: [
		{
			name: 'install-uphill',
			run: 'command -v uphill >/dev/null 2>&1 || curl -fsSL https://wevm.sh/uphill | sh',
		},
		{
			name: 'uphill-lighthouse-report',
			run: 'PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill check && PATH="$HOME/.uphill/bin:$HOME/.bun/bin:$PATH" uphill --compact',
		},
	],
})

const docsVerify = CiJob.make('docs-verify', {
	needs: ['build-and-typecheck'],
	steps: [
		{
			name: 'verify-llms-index',
			run: 'node scripts/factory/generate-llms-txt.mjs --check',
		},
		{
			name: 'build-node-docs',
			run: 'pnpm --filter @tevm/node-docs build:app',
		},
		{
			name: 'build-contributor-portal',
			run: 'pnpm --filter @tevm/contributor-portal build',
		},
	],
})

export default Flow.make('ci', {
	description:
		'Full TEVM + ZEVM Smithers Cloud CI graph with shared object store cache, trust gates, and Lighthouse Uphill audit.',
	capabilities: ['sandbox:job'],
	modelInvocable: true,
	payload: {
		mode: Schema.optional(
			Schema.Literals(['full', 'fast']).annotate({
				title: 'CI mode',
				description: 'Run full CI or fast factory + uphill verification',
				default: 'full',
			}),
		),
	},
	body: (input: { readonly mode?: 'full' | 'fast' }) =>
		input.mode === 'fast'
			? Node.all({
					zevmNative: zevmNative.call(),
					factoryGates: factoryGates.call(),
					uphillAudit: uphillAudit.call(),
				})
			: Node.all({
					zevmNative: zevmNative.call(),
					factoryGates: factoryGates.call(),
					buildAndTypecheck: buildAndTypecheck.call(),
					unitTestsAndLint: unitTestsAndLint.call(),
					uphillAudit: uphillAudit.call(),
					docsVerify: docsVerify.call(),
				}),
})
