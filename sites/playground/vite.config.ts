import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const shim = (name: string) => fileURLToPath(new URL(`./src/shims/${name}.ts`, import.meta.url))

export default defineConfig({
	resolve: {
		// CJS packages imported from inside the excluded tevm ESM graph resolve
		// through pnpm's isolated node_modules, where vite cannot apply interop.
		alias: {
			fs: shim('fs'),
			'node:fs': shim('fs'),
			'readable-stream': shim('readable-stream'),
			debug: shim('debug'),
			eventemitter3: shim('eventemitter3'),
			pino: shim('pino'),
		},
	},
	plugins: [
		// tevm's deps reach for node builtins (fs for optional persistence,
		// events/stream/buffer transitively). Polyfill them for the browser.
		nodePolyfills({ exclude: ['fs'] }),
	],
	build: {
		target: 'es2022',
	},
	// Prebundling tevm breaks its zod-based param validation (module init order
	// leaves schema members undefined: 'Invalid element at key "abi"').
	// Serve it as native ESM instead; the polyfills above cover its CJS builtins.
	optimizeDeps: {
		exclude: ['tevm'],
		include: ['zod'],
	},
})
