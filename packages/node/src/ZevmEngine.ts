import type { ConsoleLogHandler } from './ConsoleLogHandler.js'
import type { EngineEventEmitter } from './EngineEventEmitter.js'
import type { ZevmEngineEvents } from './ZevmEngineEvents.js'
import type { ZevmWasmSource } from './ZevmWasmOptions.js'

/** JSON values accepted by the native wire protocol. BigInts must be quantities. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

/** An EIP-1193 request sent to the native node. */
export type EngineRequest = { method: string; params?: JsonValue[] }

/**
 * Minimal pluggable JSON-RPC backend for a ZEVM engine.
 * Implement this to plug a WASM-based EVM, ZEVM WASM build, or custom JSON-RPC runtime
 * into TEVM without loading native `@evmts/zevm` Node-API bindings.
 */
export type ZevmBackend = {
	/** Process a raw JSON-RPC 2.0 string (single, batch, or notification) and return the JSON response or null. */
	rpc: (json: string) => string | null | Promise<string | null>
	/** Release backend resources (native handle, WASM instance, worker, etc.). */
	close: () => void | Promise<void>
}

/** Engine configuration. Each engine owns independent state. */
export type ZevmEngineOptions = {
	/**
	 * Unsigned safe integer chain ID. Defaults to `common.id`, then 31337.
	 * With an injected `backend`, initialization fails when the backend's `eth_chainId` differs.
	 */
	chainId?: number
	/** Chain definition whose `id` supplies the chain ID. A `chainId` that differs from `common.id` throws. */
	common?: { id: number }
	/** Automine defaults to true. Interval is whole seconds; zero disables the timer. */
	mining?: { auto?: boolean; interval?: number }
	/** Fork upstream state into a local chain at height zero. Pin blockNumber for stable reads. */
	fork?: { url: string; blockNumber?: number }
	/**
	 * Optional pluggable JSON-RPC backend (such as a custom WASM EVM or worker bridge).
	 * Mutually exclusive with `wasm`. When both `backend` and `wasm` are omitted, Node.js (>= 22.12)
	 * loads `@evmts/zevm`'s native Node-API addon and browsers/edge hosts automatically load
	 * `@evmts/zevm/browser`'s compiled WebAssembly reactor.
	 */
	backend?: ZevmBackend
	/**
	 * Control `@evmts/zevm`'s built-in WebAssembly backend.
	 * - `true`: force the `@evmts/zevm/browser` WASM reactor (auto-fetching `./zevm.wasm` in browsers/workers).
	 * - `ArrayBuffer | ArrayBufferView | WebAssembly.Module`: force the WASM reactor using the provided bytes or module
	 *   (works in browsers, workers, Deno, Bun, and Node.js).
	 * - `false`: disable automatic WASM fallback outside Node.js (requires native addon or explicit `backend`).
	 * Mutually exclusive with `backend`.
	 */
	wasm?: boolean | ZevmWasmSource
	/**
	 * Print Hardhat `console.log` output from Solidity. `true` writes each message with
	 * `console.log`; a function receives each message instead. Messages are drained after
	 * `eth_call`, `eth_estimateGas`, `eth_sendTransaction` and `eth_sendRawTransaction`,
	 * including failed calls, and also emitted as `consoleLog` events. Disabled by default.
	 * A backend without `tevm_drainConsoleLogs` produces no messages. A drain failure or a throwing
	 * handler is emitted as an `error` event and never changes the RPC result.
	 */
	consoleLog?: boolean | ConsoleLogHandler
}

/**
 * Serialized access to a ZEVM or pluggable WASM JSON-RPC dispatcher.
 * `request` returns an RPC result or throws a structured error. `rpc` accepts
 * raw JSON, including batches and notifications, and returns the wire response.
 * Events: `request`, `response`, `block`, `consoleLog` (when enabled), `error`, `close`. Close releases backend state.
 * `events` is a zero-dependency emitter, not a `node:events` `EventEmitter`.
 */
export type ZevmEngine = {
	events: EngineEventEmitter<ZevmEngineEvents>
	ready: () => Promise<void>
	/**
	 * Submit a request with the method and parameters it has at call time.
	 * @param request - The JSON-RPC method and parameters.
	 * @returns The backend's JSON-RPC result. A successful response event carries the captured request.
	 */
	request: (request: EngineRequest) => Promise<JsonValue>
	rpc: (json: string) => Promise<string | null>
	close: () => Promise<void>
}
