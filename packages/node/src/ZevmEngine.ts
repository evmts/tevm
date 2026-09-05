import type { EventEmitter } from 'node:events'

/** JSON values accepted by the native wire protocol. BigInts must be quantities. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

/** An EIP-1193 request sent to the native node. */
export type EngineRequest = { method: string; params?: JsonValue[] }

/** Native engine configuration. Each engine owns independent state. */
export type ZevmEngineOptions = {
	/** Unsigned safe integer chain ID. Defaults to 31337. */
	chainId?: number
	/** Automine defaults to true. Interval is whole seconds; zero disables the timer. */
	mining?: { auto?: boolean; interval?: number }
	/** Fork upstream state into a local chain at height zero. Pin blockNumber for stable reads. */
	fork?: { url: string; blockNumber?: number }
}

/**
 * Serialized access to ZEVM's native JSON-RPC dispatcher.
 * `request` returns an RPC result or throws a structured error. `rpc` accepts
 * raw JSON, including batches and notifications, and returns the wire response.
 * Events: `request`, `response`, `block`, `close`. Close releases native state.
 */
export type ZevmEngine = {
	events: EventEmitter
	ready: () => Promise<void>
	request: (request: EngineRequest) => Promise<JsonValue>
	rpc: (json: string) => Promise<string | null>
	close: () => Promise<void>
}
