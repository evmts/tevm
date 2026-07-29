import { createAddress } from '@tevm/address'
import { createTevmNode } from '@tevm/node'
import { parseEther } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { getAccountHandler } from '../GetAccount/getAccountHandler.js'
import { mineHandler } from '../Mine/mineHandler.js'
import { setAccountHandler } from '../SetAccount/setAccountHandler.js'
import { ethGetTransactionReceiptHandler } from './ethGetTransactionReceipt.js'
import { ethSendUnsignedTransactionHandler } from './ethSendUnsignedTransactionHandler.js'

const fromAddress = '0x0000000000000000000000000000000000001234'
const unfundedAddress = '0x0000000000000000000000000000000000009999'
const toAddress = '0x0000000000000000000000000000000000005678'

describe('ethSendUnsignedTransactionHandler', () => {
	it('should send a transaction from a funded account with no signature', async () => {
		const client = createTevmNode({ miningConfig: { type: 'manual' } })
		await setAccountHandler(client)({ address: fromAddress, balance: parseEther('10') })

		const txHash = await ethSendUnsignedTransactionHandler(client)({
			from: fromAddress,
			to: toAddress,
			value: parseEther('1'),
		})
		expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

		// the transaction is in the txpool before it is mined
		const txPool = await client.getTxPool()
		expect(txPool.getBySenderAddress(createAddress(fromAddress))).resolves.toHaveLength(1)

		await mineHandler(client)()

		const receipt = await ethGetTransactionReceiptHandler(client)({ hash: txHash })
		expect(receipt?.transactionHash).toBe(txHash)
		expect(receipt?.status).toBe('0x1')
		expect(receipt?.from).toBe(fromAddress)
		expect(receipt?.to).toBe(toAddress)

		const to = await getAccountHandler(client)({ address: toAddress })
		expect(to.balance).toBe(parseEther('1'))
	})

	it('should send a transaction from an unfunded arbitrary account', async () => {
		const client = createTevmNode({ miningConfig: { type: 'manual' } })
		const before = await getAccountHandler(client, { throwOnFail: false })({ address: unfundedAddress })
		expect(before.balance ?? 0n).toBe(0n)

		const txHash = await ethSendUnsignedTransactionHandler(client)({
			from: unfundedAddress,
			to: toAddress,
			value: 0n,
		})
		await mineHandler(client)()

		const receipt = await ethGetTransactionReceiptHandler(client)({ hash: txHash })
		expect(receipt?.status).toBe('0x1')
		expect(receipt?.from).toBe(unfundedAddress)
	})

	it('should use `from` as the sender even when a different account is impersonated', async () => {
		const client = createTevmNode({ miningConfig: { type: 'manual' } })
		client.setImpersonatedAccount('0x000000000000000000000000000000000000abcd')

		const txHash = await ethSendUnsignedTransactionHandler(client)({
			from: unfundedAddress,
			to: toAddress,
			value: 0n,
		})
		await mineHandler(client)()

		const receipt = await ethGetTransactionReceiptHandler(client)({ hash: txHash })
		expect(receipt?.from).toBe(unfundedAddress)
	})

	it('should throw when from is missing', async () => {
		const client = createTevmNode()
		await expect(ethSendUnsignedTransactionHandler(client)({ to: toAddress } as any)).rejects.toThrow(
			'eth_sendUnsignedTransaction requires a `from` address',
		)
	})
})
