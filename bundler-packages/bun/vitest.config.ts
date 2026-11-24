import { defineConfig } from 'vitest/config'

// https://vitest.dev/config/ - for docs
export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		coverage: {
			// Measure this package only. Without include, coverage also counts the sibling
			// workspace sources the tests load, so the gate moved whenever those packages changed.
			include: ['src/**'],
			reporter: ['text', 'json-summary', 'json'],
			// bunFile.js is `require('bun').file`, which only runs under Bun, so lines and
			// statements stop short of 100.
			thresholds: {
				autoUpdate: false,
				lines: 96,
				functions: 100,
				branches: 100,
				statements: 96,
			},
		},
	},
})
