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
