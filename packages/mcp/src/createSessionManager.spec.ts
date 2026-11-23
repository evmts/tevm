import { expect, it } from 'vitest'
import { createSessionManager } from './createSessionManager.js'

it('releases the native engine when a session closes', async () => {
	const sessions = createSessionManager()
	const { handle } = await sessions.createLocal()
	const client = sessions.get(handle)
	expect(await sessions.close(handle)).toBe(true)
	expect(await sessions.close(handle)).toBe(false)
	expect(sessions.size()).toBe(0)
	await expect(client.transport.tevm.request({ method: 'eth_blockNumber' })).rejects.toThrow(/closed/i)
})

it('expires idle engines and makes capacity available again', async () => {
	let now = 0
	const sessions = createSessionManager({ now: () => now, idleTtlMs: 10, maximumSessions: 1 })
	const { handle } = await sessions.createLocal()
	const client = sessions.get(handle)
	await expect(sessions.createLocal()).rejects.toThrow('Session limit reached')
	now = 11
	expect(sessions.size()).toBe(0)
	expect(() => sessions.get(handle)).toThrow('Unknown or expired')
	await expect(client.transport.tevm.request({ method: 'eth_blockNumber' })).rejects.toThrow(/closed/i)
	const replacement = await sessions.createLocal()
	await sessions.close(replacement.handle)
})

it('reserves capacity before starting local or fork setup', async () => {
	const sessions = createSessionManager({ maximumSessions: 1 })
	try {
		const first = sessions.createLocal()
		await expect(sessions.createFork({ url: 'http://127.0.0.1:1' })).rejects.toThrow('Session limit reached')
		await first
		expect(sessions.size()).toBe(1)
	} finally {
		await sessions.closeAll()
	}
})

it('closes established and in-flight sessions at shutdown', async () => {
	const sessions = createSessionManager()
	const { handle } = await sessions.createLocal()
	const engine = sessions.get(handle).transport.tevm
	const starting = sessions.createLocal()
	const result = Promise.allSettled([starting])
	await sessions.closeAll()
	expect((await result)[0].status).toBe('rejected')
	expect(sessions.size()).toBe(0)
	await expect(engine.request({ method: 'eth_chainId' })).rejects.toThrow(/closed/i)
	const next = await sessions.createLocal()
	await sessions.close(next.handle)
})
