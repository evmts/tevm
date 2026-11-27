/**
 * Return whether `value` is a valid WebAssembly binary source or compiled module.
 * @param {unknown} value
 * @returns {value is import('./ZevmWasmOptions.js').ZevmWasmSource}
 */
export const isWasmSource = (value) =>
	value instanceof ArrayBuffer ||
	ArrayBuffer.isView(value) ||
	(typeof WebAssembly !== 'undefined' && value instanceof WebAssembly.Module)

/**
 * Create a {@link import('./ZevmEngine.js').ZevmBackend} backed by `@evmts/zevm`'s compiled WebAssembly reactor.
 * Requires no Node built-ins and runs in browsers, edge workers, Deno, Bun, and Node.js.
 *
 * When `wasm` is omitted in a browser or worker, `@evmts/zevm/browser` automatically fetches its bundled
 * `zevm.wasm` relative to the module URL. Pass `wasm` (raw bytes or a compiled `WebAssembly.Module`) when
 * running in Node.js, Cloudflare Workers, or custom asset setups.
 * @param {import('./ZevmWasmOptions.js').ZevmWasmOptions} [options]
 * @returns {Promise<import('./ZevmEngine.js').ZevmBackend>}
 * @throws {TypeError} When `chainId` is not a positive safe integer or `wasm` is not a valid binary/module.
 * @throws {Error} When `@evmts/zevm/browser` is unavailable or fails to instantiate the WASM reactor.
 * @example
 * import { createWasmBackend, createZevmEngine } from '@tevm/node'
 * const engine = createZevmEngine({ backend: await createWasmBackend({ chainId: 31337 }) })
 * console.log(await engine.request({ method: 'eth_chainId' }))
 * await engine.close()
 */
export async function createWasmBackend(options = {}) {
	if (options.chainId !== undefined && (!Number.isSafeInteger(options.chainId) || options.chainId < 1)) {
		throw new TypeError('chainId must be a positive safe integer')
	}
	if (options.wasm !== undefined && !isWasmSource(options.wasm)) {
		throw new TypeError('wasm must be an ArrayBuffer, ArrayBufferView, or WebAssembly.Module')
	}
	/** @type {{ createWasmBackend?: (opts?: import('./ZevmWasmOptions.js').ZevmWasmOptions) => Promise<import('./ZevmEngine.js').ZevmBackend> }} */
	let mod
	try {
		mod = await import('@evmts/zevm/browser')
	} catch (cause) {
		throw new Error(
			'@tevm/node could not load `@evmts/zevm/browser` for WASM execution. Install `@evmts/zevm` (>= 0.1.0), or pass a custom `backend` implementing `{ rpc(json), close() }`.',
			{ cause },
		)
	}
	if (typeof mod?.createWasmBackend !== 'function') {
		throw new Error(
			'`@evmts/zevm/browser` does not export `createWasmBackend`. Upgrade `@evmts/zevm` to >= 0.1.0 or pass a custom `backend`.',
		)
	}
	const inner = await mod.createWasmBackend({
		...(options.chainId === undefined ? {} : { chainId: options.chainId }),
		...(options.wasm === undefined ? {} : { wasm: options.wasm }),
	})
	return {
		// Reject raw NUL bytes up front for parity with the native C-string boundary (RFC 8259).
		rpc: (json) =>
			json.includes('\0')
				? '{"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"Parse error"}}'
				: inner.rpc(json),
		close: () => inner.close(),
	}
}
