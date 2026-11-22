import { defineConfig } from 'vitest/config'

/**
 * Shared Vitest benchmark configuration used by every JS/TS package's
 * Smithers `bench` target so benchmarks execute deterministically without
 * interfering with package unit-test or coverage configs.
 */
export default defineConfig({
	test: {
		environment: 'node',
		fileParallelism: false,
		testTimeout: 120_000,
		benchmark: {
			include: ['bench/**/*.bench.{js,mjs,cjs,ts,mts,cts}'],
			reporters: ['default'],
		},
	},
})
