import type { EventEmitter } from 'node:events'
import type { ConsoleLogHandler } from './ConsoleLogHandler.js'

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
	/** Unsigned safe integer chain ID. Defaults to 31337. */
	chainId?: number
	/** Automine defaults to true. Interval is whole seconds; zero disables the timer. */
	mining?: { auto?: boolean; interval?: number }
	/** Fork upstream state into a local chain at height zero. Pin blockNumber for stable reads. */
	fork?: { url: string; blockNumber?: number }
	/**
	 * Optional pluggable JSON-RPC backend (such as a WASM EVM or ZEVM WASM adapter).
	 * Defaults to `@evmts/zevm`'s `NativeNode` when omitted.
	 */
	backend?: ZevmBackend
	/**
	 * Print Hardhat `console.log` output from Solidity. `true` writes each message with
	 * `console.log`; a function receives each message instead. Messages are drained after
	 * `eth_call`, `eth_estimateGas`, `eth_sendTransaction` and `eth_sendRawTransaction`,
	 * including failed calls, and also emitted as `consoleLog` events. Disabled by default.
	 * A backend without `tevm_drainConsoleLogs` produces no messages.
	 */
	consoleLog?: boolean | ConsoleLogHandler
}

/**
 * Serialized access to a ZEVM or pluggable WASM JSON-RPC dispatcher.
 * `request` returns an RPC result or throws a structured error. `rpc` accepts
 * raw JSON, including batches and notifications, and returns the wire response.
 * Events: `request`, `response`, `block`, `consoleLog` (when enabled), `close`. Close releases backend state.
 */
export type ZevmEngine = {
	events: EventEmitter
	ready: () => Promise<void>
	request: (request: EngineRequest) => Promise<JsonValue>
	rpc: (json: string) => Promise<string | null>
	close: () => Promise<void>
}
