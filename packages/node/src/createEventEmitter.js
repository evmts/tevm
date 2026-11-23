/**
 * Create a zero-dependency event emitter that runs unchanged in Node, browsers and WASM hosts.
 * A throwing listener never stops later listeners and never throws out of `emit`: its error
 * goes to `onListenerError`. `onChange` runs after a listener is added or removed.
 * @param {{onChange?: (event: string) => void; onListenerError?: (error: unknown, event: string) => void}} [hooks]
 * @returns {import('./EngineEventEmitter.js').EngineEventEmitter<any>}
 * @example
 * import { createEventEmitter } from './createEventEmitter.js'
 * const events = createEventEmitter()
 * events.once('block', (block) => console.log(block))
 * events.emit('block', { number: '0x1' })
 */
export function createEventEmitter({ onChange, onListenerError } = {}) {
	/** @type {Map<string, Array<{listener: Function; once: boolean}>>} */
	const registry = new Map()
	/** @param {string} event @param {Function} listener @param {boolean} once */
	const add = (event, listener, once) => {
		if (typeof listener !== 'function') throw new TypeError('listener must be a function')
		registry.set(event, [...(registry.get(event) ?? []), { listener, once }])
		onChange?.(event)
		return emitter
	}
	/** @param {string} event @param {{listener: Function; once: boolean} | undefined} entry */
	const remove = (event, entry) => {
		const entries = registry.get(event) ?? []
		if (!entry || !entries.includes(entry)) return emitter
		if (entries.length === 1) registry.delete(event)
		else
			registry.set(
				event,
				entries.filter((other) => other !== entry),
			)
		onChange?.(event)
		return emitter
	}
	/** Remove the most recent registration, as Node does. @param {string} event @param {Function} listener */
	const off = (event, listener) =>
		remove(
			event,
			registry.get(event)?.findLast((entry) => entry.listener === listener),
		)
	const emitter = {
		/** @param {string} event @param {Function} listener */
		on: (event, listener) => add(event, listener, false),
		/** @param {string} event @param {Function} listener */
		once: (event, listener) => add(event, listener, true),
		off,
		removeListener: off,
		/** @param {string} [event] */
		removeAllListeners: (event) => {
			const events = event === undefined ? [...registry.keys()] : registry.has(event) ? [event] : []
			for (const name of events) {
				registry.delete(name)
				onChange?.(name)
			}
			return emitter
		},
		/** @param {string} event @param {unknown[]} args */
		emit: (event, ...args) => {
			// Iterate a snapshot: registrations are copy-on-write, so listeners may add or remove freely.
			const entries = registry.get(event) ?? []
			for (const entry of entries) {
				if (entry.once) remove(event, entry)
				try {
					entry.listener(...args)
				} catch (error) {
					try {
						onListenerError?.(error, event)
					} catch {
						// An error reporter must not break delivery to the remaining listeners.
					}
				}
			}
			return entries.length > 0
		},
		/** @param {string} event */
		listenerCount: (event) => registry.get(event)?.length ?? 0,
	}
	return /** @type {import('./EngineEventEmitter.js').EngineEventEmitter<any>} */ (emitter)
}
