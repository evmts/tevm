import type { ConsoleLogEvent } from './ConsoleLogEvent.js'
import type { EngineRequest, JsonValue } from './ZevmEngine.js'

/**
 * Events emitted on `ZevmEngine.events`, mapped to their listener arguments.
 * Listeners are observers: an error thrown by one is delivered to `error` listeners
 * and never changes the result of the RPC request that triggered it.
 */
export type ZevmEngineEvents = {
	/** A `request()` call is about to be dispatched. */
	request: [request: EngineRequest]
	/** A `request()` call succeeded. */
	response: [response: { request: EngineRequest; result: JsonValue }]
	/** A block was mined after the listener subscribed. The payload is the `eth_getBlockByNumber` result. */
	block: [block: JsonValue]
	/** A decoded Hardhat `console.log` call. Requires the `consoleLog` option. */
	consoleLog: [event: ConsoleLogEvent]
	/**
	 * Observer work failed after a request was dispatched: a listener or `consoleLog` handler threw,
	 * the console log drain failed, or a block fetch failed. Dropped when there is no `error` listener.
	 */
	error: [error: unknown]
	/** The engine closed. Listeners are removed after this event. */
	close: []
}
