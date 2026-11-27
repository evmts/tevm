import { createTsUpOptions } from '@tevm/tsupconfig'

export default {
	...createTsUpOptions({
		entry: ['src/index.ts'],
	}),
	// Keep optional @evmts/zevm external so `@evmts/zevm/browser`'s `new URL('./zevm.wasm', import.meta.url)`
	// resolves relative to `@evmts/zevm` instead of `@tevm/node/dist`.
	external: ['@evmts/zevm', '@evmts/zevm/browser', /^@evmts\/zevm(\/.*)?$/],
	esbuildOptions(options) {
		options.external = [...(options.external ?? []), '@evmts/zevm', '@evmts/zevm/browser']
	},
}
