import { fork } from 'node:child_process'
import { once } from 'node:events'
import { expect, it } from 'vitest'
import { createSessionManager } from './createSessionManager.js'
import { executeTool } from './executeTool.js'

it('forks a real local native upstream through the MCP tool', async () => {
	const upstream = fork(new URL('../../node/fixtures/fork-server.cjs', import.meta.url), {
		stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	})
	const sessions = createSessionManager()
	let handle: string | undefined
	try {
		const [{ url }] = await once(upstream, 'message')
		const inferred = await sessions.createFork({ url, blockNumber: '1', chain: 'auto' })
		expect(inferred.chainId).toBe(31337)
		await sessions.close(inferred.handle)
		const forked: any = await executeTool('evm_fork_chain', { url, chain: 'mainnet', blockNumber: '1' }, sessions)
		handle = forked.handle
		expect(forked.chainId).toBe(1)
		// ZEVM forks upstream state into a local chain, whose genesis is block zero.
		expect(forked.blockNumber).toBe('0')
		const account: any = await executeTool(
			'evm_get_account',
			{ session: handle, address: '0x0000000000000000000000000000000000000123', storageSlot: '0x00' },
			sessions,
		)
		expect(account.balance).toBe('42')
		expect(account.isContract).toBe(true)
		expect(account.code).toBe('0x602a60005260206000f3')
		expect(account.storageValue).toBe(`0x${'0'.repeat(62)}2a`)
		expect(JSON.parse(JSON.stringify(account))).toEqual(account)
	} finally {
		if (handle) await sessions.close(handle)
		const exited = once(upstream, 'exit')
		upstream.kill('SIGTERM')
		await exited
	}
})
