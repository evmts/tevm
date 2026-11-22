import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.fuzz.spec.ts'],
		testTimeout: 120_000,
		hookTimeout: 30_000,
		pool: 'forks',
		fileParallelism: true,
	},
})
