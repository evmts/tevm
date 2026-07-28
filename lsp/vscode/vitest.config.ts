import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/**/*.spec.ts'],
		environment: 'node',
		coverage: {
			reporter: ['text', 'json-summary'],
			thresholds: {
				lines: 0,
				functions: 0,
				branches: 0,
				statements: 0,
			},
		},
	},
})
