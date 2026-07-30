import { NoSignerAvailableError } from '@tevm/errors'
import { createTevmNode, prefundedAccounts } from '@tevm/node'
import type { Address } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { anvilImpersonateAccountJsonRpcProcedure } from '../anvil/anvilImpersonateAccountProcedure.js'
import { anvilStopImpersonatingAccountJsonRpcProcedure } from '../anvil/anvilStopImpersonatingAccountProcedure.js'
import { ethSendTransactionHandler } from './ethSendTransactionHandler.js'

const vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const
const recipient = '0x0000000000000000000000000000000000000001' as const

const send = (node: ReturnType<typeof createTevmNode>, from: Address) =>
	ethSendTransactionHandler(node)({ from, to: recipient, value: 0n, data: '0x' })

describe('ethSendTransactionHandler strict impersonation', () => {
	it('sends from any account by default (tevm auto impersonates)', async () => {
		const node = createTevmNode()
		await node.ready()
		expect(await send(node, vitalik)).toMatch(/^0x[0-9a-f]{64}$/)
	})

	it('errors like anvil for a non impersonated account under strict mode', async () => {
		const node = createTevmNode({ strictImpersonation: true })
		await node.ready()
		await expect(send(node, vitalik)).rejects.toThrow(NoSignerAvailableError)
		await expect(send(node, vitalik)).rejects.toThrow(/No Signer available/)
	})

	it('still allows the prefunded dev accounts under strict mode', async () => {
		const node = createTevmNode({ strictImpersonation: true })
		await node.ready()
		expect(await send(node, prefundedAccounts[0] as Address)).toMatch(/^0x[0-9a-f]{64}$/)
	})

	it('anvil_impersonateAccount grants access and anvil_stopImpersonatingAccount revokes it', async () => {
		const node = createTevmNode({ strictImpersonation: true })
		await node.ready()

		await expect(send(node, vitalik)).rejects.toThrow(NoSignerAvailableError)

		await anvilImpersonateAccountJsonRpcProcedure(node)({
			jsonrpc: '2.0',
			id: 1,
			method: 'anvil_impersonateAccount',
			params: [vitalik],
		})
		expect(await send(node, vitalik)).toMatch(/^0x[0-9a-f]{64}$/)

		await anvilStopImpersonatingAccountJsonRpcProcedure(node)({
			jsonrpc: '2.0',
			id: 2,
			method: 'anvil_stopImpersonatingAccount',
			params: [vitalik],
		})
		await expect(send(node, vitalik)).rejects.toThrow(NoSignerAvailableError)
	})
})
