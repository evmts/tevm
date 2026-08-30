import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	base: './',
	plugins: [react()],
	server: { port: 4310 },
	preview: { port: 4311 },
	build: { target: 'es2022' },
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/data.ts'],
			reporter: ['text', 'json-summary'],
		},
	},
})
