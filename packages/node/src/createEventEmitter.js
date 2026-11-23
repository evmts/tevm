/**
 * Create a zero-dependency event emitter that runs unchanged in Node, browsers and WASM hosts.
 * A throwing listener never stops later listeners and never throws out of `emit`: its error
 * goes to `onListenerError`. A listener that returns a promise or thenable is observed too:
 * its rejection goes to `onListenerError` and never becomes an unhandled rejection.
 * `onChange` runs after a listener is added or removed.
 * @param {{onChange?: (event: string) => void; onListenerError?: (error: unknown, event: string) => void}} [hooks]
 * @returns {import('./EngineEventEmitter.js').EngineEventEmitter<any>}
 * @example
 * import { createEventEmitter } from './createEventEmitter.js'
 * const events = createEventEmitter()
 * events.once('block', (block) => console.log(block))
 * events.emit('block', { number: '0x1' })
 */
export function createEventEmitter({ onChange, onListenerError } = {}) {
	/** @typedef {{listener: Function; once: boolean; fired: boolean}} Entry */
	/** @type {Map<string, Array<Entry>>} */
	const registry = new Map()
	/** @param {string} event @param {Function} listener @param {boolean} once */
	const add = (event, listener, once) => {
		if (typeof listener !== 'function') throw new TypeError('listener must be a function')
		registry.set(event, [...(registry.get(event) ?? []), { listener, once, fired: false }])
		onChange?.(event)
		return emitter
	}
	/** @param {string} event @param {Entry | undefined} entry */
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
	const off = (event, listener) => {
		// A reverse loop instead of Array.prototype.findLast, which Chrome 91 and Firefox 90 lack.
		const entries = registry.get(event) ?? []
		for (let index = entries.length - 1; index >= 0; index--) {
			const entry = /** @type {Entry} */ (entries[index])
			if (entry.listener === listener) return remove(event, entry)
		}
		return emitter
	}
	/** Deliver a listener failure to the reporter, which must not break delivery. @param {unknown} error @param {string} event */
	const report = (error, event) => {
		try {
			onListenerError?.(error, event)
		} catch {
			// An error reporter must not break delivery to the remaining listeners.
		}
	}
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
				if (entry.once) {
					// A reentrant emit holds an older snapshot that still contains this entry.
					if (entry.fired) continue
					entry.fired = true
					remove(event, entry)
				}
				try {
					const returned = entry.listener(...args)
					// An async listener's rejection is reported instead of becoming an unhandled rejection.
					if (returned !== null && (typeof returned === 'object' || typeof returned === 'function')) {
						const then = returned.then
						if (typeof then === 'function')
							then.call(returned, undefined, (/** @type {unknown} */ error) => report(error, event))
					}
				} catch (error) {
					report(error, event)
				}
			}
			return entries.length > 0
		},
		/** @param {string} event */
		listenerCount: (event) => registry.get(event)?.length ?? 0,
	}
	return /** @type {import('./EngineEventEmitter.js').EngineEventEmitter<any>} */ (emitter)
}
