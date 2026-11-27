/**
 * Binary or compiled WebAssembly input accepted by `@evmts/zevm/browser`.
 */
export type ZevmWasmSource = ArrayBuffer | ArrayBufferView | WebAssembly.Module

/**
 * Options for instantiating `@evmts/zevm`'s compiled WebAssembly backend.
 */
export type ZevmWasmOptions = {
	/**
	 * Positive unsigned safe integer chain ID. Defaults to `31337`.
	 */
	chainId?: number
	/**
	 * Optional pre-loaded `zevm.wasm` binary (`ArrayBuffer`, `TypedArray`, or compiled `WebAssembly.Module`).
	 * When omitted in a browser or worker, `@evmts/zevm/browser` fetches `./zevm.wasm` relative to its module URL.
	 */
	wasm?: ZevmWasmSource
}
