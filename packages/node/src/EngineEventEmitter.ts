/**
 * Typed, zero-dependency event emitter. It has no `node:events` dependency, so the engine
 * bundles for browsers and WASM hosts. `Events` maps each event name to its listener arguments.
 * A throwing listener never stops later listeners and never throws out of `emit`.
 */
export type EngineEventEmitter<Events extends { [event: string]: unknown[] }> = {
	/** Add a listener. Adding the same function twice registers it twice. */
	on: <E extends keyof Events & string>(event: E, listener: (...args: Events[E]) => void) => EngineEventEmitter<Events>
	/** Add a listener that is removed before its first invocation. */
	once: <E extends keyof Events & string>(
		event: E,
		listener: (...args: Events[E]) => void,
	) => EngineEventEmitter<Events>
	/** Remove the most recently added registration of `listener`. */
	off: <E extends keyof Events & string>(event: E, listener: (...args: Events[E]) => void) => EngineEventEmitter<Events>
	/** Alias of `off`. */
	removeListener: <E extends keyof Events & string>(
		event: E,
		listener: (...args: Events[E]) => void,
	) => EngineEventEmitter<Events>
	/** Remove every listener of `event`, or of all events when omitted. */
	removeAllListeners: (event?: keyof Events & string) => EngineEventEmitter<Events>
	/** Invoke the listeners of `event` in registration order. Returns whether any listener existed. */
	emit: <E extends keyof Events & string>(event: E, ...args: Events[E]) => boolean
	/** Number of listeners registered for `event`. */
	listenerCount: (event: keyof Events & string) => number
}
