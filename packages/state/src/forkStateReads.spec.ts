import { createAddress } from '@tevm/address'
import { transports } from '@tevm/test-utils'
import { bytesToHex, hexToBytes, numberToHex, toBytes } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { createStateManager } from './createStateManager.js'

const hasOptimismRpc = Boolean(process.env['TEVM_RPC_URLS_OPTIMISM'])

describe.skipIf(!hasOptimismRpc)('fork state reads', () => {
	it('returns local account and storage writes while fetching every uncached fork slot', async () => {
		const stateManager = createStateManager({
			fork: {
				transport: transports.optimism,
			},
		})
		await stateManager.ready()

		const address = createAddress('0x4200000000000000000000000000000000000006')
		const firstSlot = toBytes(0, { size: 32 })
		const secondSlot = toBytes(1, { size: 32 })
		const account = await stateManager.getAccount(address)

		expect(account?.isContract()).toBe(true)
		const forkBlock = stateManager._baseState.options.fork?.blockTag
		expect(typeof forkBlock).toBe('bigint')

		for (const slot of [firstSlot, secondSlot]) {
			const upstreamValue = await transports.optimism.request({
				method: 'eth_getStorageAt',
				params: [address.toString(), bytesToHex(slot), numberToHex(forkBlock as bigint)],
			})
			expect(bytesToHex(await stateManager.getStorage(address, slot), { size: 32 })).toBe(
				bytesToHex(hexToBytes(upstreamValue), { size: 32 }),
			)
		}

		const localBalance = (account?.balance ?? 0n) + 123n
		const localStorage = hexToBytes('0x123456')
		await stateManager.modifyAccountFields(address, { balance: localBalance })
		await stateManager.putStorage(address, secondSlot, localStorage)

		expect((await stateManager.getAccount(address))?.balance).toBe(localBalance)
		expect(await stateManager.getStorage(address, secondSlot)).toEqual(localStorage)

		await stateManager.putStorage(address, firstSlot, new Uint8Array())
		expect(await stateManager.getStorage(address, firstSlot)).toEqual(new Uint8Array())
	}, 30_000)
})
