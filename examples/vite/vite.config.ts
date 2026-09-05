import { vitePluginTevm } from '@tevm/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		global: 'globalThis',
	},
	build: { target: 'es2022' },
	plugins: [
		nodePolyfills({
			include: ['stream'],
			globals: {
				process: true,
				Buffer: true,
				global: true,
			},
		}),
		react(),
		vitePluginTevm({}) as any,
	],
})
