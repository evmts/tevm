// Minimal ESM EventEmitter for the browser. The `events` npm package is CJS,
// which vite cannot serve to an excluded-from-prebundle ESM dependency (tevm),
// so we alias it to this implementation in both dev and prod.
type Listener = (...args: unknown[]) => void

export class EventEmitter {
	private listenerMap = new Map<string | symbol, Listener[]>()

	on(event: string | symbol, fn: Listener) {
		const arr = this.listenerMap.get(event) ?? []
		arr.push(fn)
		this.listenerMap.set(event, arr)
		return this
	}
	addListener(event: string | symbol, fn: Listener) {
		return this.on(event, fn)
	}
	once(event: string | symbol, fn: Listener) {
		const wrap: Listener = (...args) => {
			this.off(event, wrap)
			fn(...args)
		}
		return this.on(event, wrap)
	}
	off(event: string | symbol, fn: Listener) {
		const arr = this.listenerMap.get(event)
		if (arr) this.listenerMap.set(event, arr.filter((l) => l !== fn))
		return this
	}
	removeListener(event: string | symbol, fn: Listener) {
		return this.off(event, fn)
	}
	removeAllListeners(event?: string | symbol) {
		if (event === undefined) this.listenerMap.clear()
		else this.listenerMap.delete(event)
		return this
	}
	emit(event: string | symbol, ...args: unknown[]) {
		const arr = this.listenerMap.get(event)
		if (!arr?.length) return false
		for (const fn of [...arr]) fn(...args)
		return true
	}
	listeners(event: string | symbol) {
		return [...(this.listenerMap.get(event) ?? [])]
	}
	rawListeners(event: string | symbol) {
		return this.listeners(event)
	}
	listenerCount(event: string | symbol) {
		return this.listenerMap.get(event)?.length ?? 0
	}
	eventNames() {
		return [...this.listenerMap.keys()]
	}
	setMaxListeners() {
		return this
	}
	getMaxListeners() {
		return Infinity
	}
}

export default { EventEmitter }
