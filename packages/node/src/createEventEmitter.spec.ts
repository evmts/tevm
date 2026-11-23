import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEventEmitter } from './createEventEmitter.js'

describe('createEventEmitter', () => {
	it('delivers arguments in registration order and reports whether a listener existed', () => {
		const events = createEventEmitter()
		const seen: unknown[] = []
		expect(events.emit('block', 1)).toBe(false)
		expect(events.on('block', (...args: unknown[]) => seen.push(['a', ...args]))).toBe(events)
		events.on('block', (...args: unknown[]) => seen.push(['b', ...args]))
		expect(events.emit('block', 1, 2)).toBe(true)
		expect(seen).toEqual([
			['a', 1, 2],
			['b', 1, 2],
		])
		expect(events.listenerCount('block')).toBe(2)
		expect(events.listenerCount('close')).toBe(0)
	})

	it('runs a once listener a single time, even when it emits recursively', () => {
		const events = createEventEmitter()
		let calls = 0
		events.once('close', () => {
			calls++
			events.emit('close')
		})
		events.emit('close')
		events.emit('close')
		expect(calls).toBe(1)
		expect(events.listenerCount('close')).toBe(0)
	})

	it('removes the most recent registration with off and removeListener', () => {
		const events = createEventEmitter()
		const seen: string[] = []
		const listener = () => seen.push('x')
		events.on('block', listener)
		events.once('block', listener)
		events.off('block', listener)
		events.emit('block')
		events.emit('block')
		expect(seen).toEqual(['x', 'x'])
		events.removeListener('block', listener)
		events.removeListener('block', listener)
		events.off('missing', listener)
		expect(events.emit('block')).toBe(false)
	})

	it('removes the once registration itself when the same function is also registered with on', () => {
		const events = createEventEmitter()
		let calls = 0
		const listener = () => calls++
		events.once('block', listener)
		events.on('block', listener)
		events.emit('block')
		events.emit('block')
		expect(calls).toBe(3)
		expect(events.listenerCount('block')).toBe(1)
	})

	it('removes all listeners of one event or of every event', () => {
		const events = createEventEmitter()
		events.on('block', () => {})
		events.on('block', () => {})
		events.on('close', () => {})
		expect(events.removeAllListeners('block')).toBe(events)
		expect([events.listenerCount('block'), events.listenerCount('close')]).toEqual([0, 1])
		events.on('block', () => {})
		events.removeAllListeners()
		expect([events.listenerCount('block'), events.listenerCount('close')]).toEqual([0, 0])
	})

	it('keeps delivering after a listener throws and routes the error to onListenerError', () => {
		const errors: unknown[] = []
		const events = createEventEmitter({
			onListenerError: (error, event) => {
				errors.push([event, (error as Error).message])
				throw new Error('a throwing reporter is contained')
			},
		})
		const seen: string[] = []
		events.on('block', () => {
			throw new Error('first')
		})
		events.on('block', () => seen.push('second'))
		expect(() => events.emit('block')).not.toThrow()
		expect(seen).toEqual(['second'])
		expect(errors).toEqual([['block', 'first']])
	})

	it('lets listeners add and remove listeners during an emit without changing that emit', () => {
		const events = createEventEmitter()
		const seen: string[] = []
		const late = () => seen.push('late')
		const removed = () => seen.push('removed')
		events.on('block', () => {
			seen.push('first')
			events.on('block', late)
			events.off('block', removed)
		})
		events.on('block', removed)
		events.emit('block')
		expect(seen).toEqual(['first', 'removed'])
		events.emit('block')
		expect(seen).toEqual(['first', 'removed', 'first', 'late'])
	})

	it('notifies onChange after each addition and removal and rejects non-function listeners', () => {
		const changes: [string, number][] = []
		const events = createEventEmitter({ onChange: (event) => changes.push([event, events.listenerCount(event)]) })
		const listener = () => {}
		events.on('block', listener)
		events.once('block', listener)
		events.emit('block')
		events.off('block', listener)
		events.off('block', listener)
		events.on('close', listener)
		events.removeAllListeners()
		expect(changes).toEqual([
			['block', 1],
			['block', 2],
			['block', 1],
			['block', 0],
			['close', 1],
			['close', 0],
		])
		expect(() => events.on('block', 'nope' as never)).toThrow(new TypeError('listener must be a function'))
	})

	it('runs a once listener a single time when an earlier listener emits the same event reentrantly', () => {
		const events = createEventEmitter()
		let depth = 0
		let calls = 0
		// The outer emit holds a snapshot that still contains the once entry the inner emit fired.
		events.on('block', () => {
			if (depth++ === 0) events.emit('block')
		})
		events.once('block', () => calls++)
		events.emit('block')
		expect(calls).toBe(1)
		expect(events.listenerCount('block')).toBe(1)
		events.emit('block')
		expect(calls).toBe(1)
	})

	it('removes the most recent registration without Array.prototype.findLast (Chrome 91, Firefox 90)', () => {
		vi.spyOn(Array.prototype, 'findLast').mockImplementation(() => {
			throw new TypeError('findLast is not a function')
		})
		const events = createEventEmitter()
		const seen: string[] = []
		const listener = () => seen.push('x')
		const other = () => seen.push('other')
		events.once('block', listener)
		events.on('block', other)
		events.on('block', listener)
		// The most recent registration is the `on` one: the `once` registration survives.
		expect(events.off('block', listener)).toBe(events)
		expect(events.listenerCount('block')).toBe(2)
		events.emit('block')
		events.emit('block')
		expect(seen).toEqual(['x', 'other', 'other'])
	})

	it('reports an async listener rejection to onListenerError instead of leaving it unhandled', async () => {
		const unhandled: unknown[] = []
		const onUnhandled = (reason: unknown) => unhandled.push(reason)
		process.on('unhandledRejection', onUnhandled)
		try {
			const errors: unknown[] = []
			const events = createEventEmitter({
				onListenerError: (error, event) => {
					errors.push([event, (error as Error).message])
					throw new Error('a throwing reporter is contained')
				},
			})
			const seen: string[] = []
			events.on('block', async () => {
				throw new Error('async rejection')
			})
			events.on('block', () => ({
				// biome-ignore lint/suspicious/noThenProperty: a hand-written thenable is the case under test
				then: (_resolve: unknown, reject: (error: Error) => void) => reject(new Error('thenable rejection')),
			}))
			events.on('block', () => ({
				// biome-ignore lint/suspicious/noThenProperty: a throwing `then` getter is the case under test
				get then() {
					throw new Error('then getter')
				},
			}))
			events.on('block', async () => void seen.push('resolved'))
			events.on('block', () => seen.push('sync'))
			expect(events.emit('block')).toBe(true)
			// Two macrotask turns let Node raise unhandledRejection if a rejection had no handler.
			await new Promise((resolve) => setTimeout(resolve, 0))
			await new Promise((resolve) => setTimeout(resolve, 0))
			expect(seen).toEqual(['resolved', 'sync'])
			expect(errors).toEqual([
				['block', 'thenable rejection'],
				['block', 'then getter'],
				['block', 'async rejection'],
			])
			expect(unhandled).toEqual([])
		} finally {
			process.off('unhandledRejection', onUnhandled)
		}
	})
})

afterEach(() => {
	vi.restoreAllMocks()
})
