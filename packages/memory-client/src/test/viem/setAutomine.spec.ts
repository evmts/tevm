import { SimpleContract } from '@tevm/contract'
import { type Address, encodeFunctionData } from '@tevm/utils'
import { parseEther } from 'viem'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryClient } from '../../createMemoryClient.js'
import type { MemoryClient } from '../../MemoryClient.js'

/**
 * Tests for TEVM mining behavior and automine functionality.
 */

let mc: MemoryClient
let contractAddress: Address

beforeEach(async () => {
	mc = createMemoryClient()
	await mc.tevmReady()
	const deployResult = await mc.tevmDeploy({
		bytecode: SimpleContract.bytecode,
		abi: SimpleContract.abi,
		args: [420n],
	})
	if (!deployResult.createdAddress) {
		throw new Error('contract never deployed')
	}
	contractAddress = deployResult.createdAddress as Address
	await mc.tevmMine()

	// Verify the contract is properly deployed by reading its value
	const simpleContract = SimpleContract.withAddress(contractAddress)
	const initialValue = await mc.tevmContract(simpleContract.read.get())
	expect(initialValue.data).toBe(420n)
})

afterEach(() => {
	mc.transport.tevm.close()
})

describe('automine', () => {
	it('should disable and re-enable immediate mining through the viem test action', async () => {
		const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
		const secondSender = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
		const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
		await mc.tevmSetAccount({
			address: sender,
			balance: parseEther('100'),
		})
		await mc.tevmSetAccount({
			address: secondSender,
			balance: parseEther('100'),
		})

		await mc.setAutomine(false)
		expect(await mc.getAutomine()).toBe(false)

		const blockNumber = await mc.getBlockNumber()
		await mc.sendTransaction({
			account: sender,
			to: recipient,
			value: parseEther('1'),
		})
		expect(await mc.getBlockNumber()).toBe(blockNumber)

		await mc.setAutomine(true)
		expect(await mc.getAutomine()).toBe(true)

		const secondHash = await mc.sendTransaction({
			account: secondSender,
			to: recipient,
			value: parseEther('1'),
		})
		expect(await mc.getBlockNumber()).toBe(blockNumber + 1n)
		expect((await mc.getTransactionReceipt({ hash: secondHash })).blockNumber).toBe(blockNumber + 1n)
	})

	it('should get the automine status', async () => {
		// Get the current automine status through direct request
		const result = await mc.request({
			method: 'anvil_getAutomine',
		})

		// We expect a boolean response indicating whether automine is enabled
		expect(typeof result).toBe('boolean')
	})

	it('should mine transactions and update state when a block is mined', async () => {
		// Create a contract instance for interaction
		const simpleContract = SimpleContract.withAddress(contractAddress)

		// Send a transaction
		const setValueData = encodeFunctionData({
			abi: SimpleContract.abi,
			functionName: 'set',
			args: [999n],
		})

		// Create a transaction (this may or may not be immediately mined based on automine setting)
		await mc.tevmCall({
			to: contractAddress,
			data: setValueData,
			createTransaction: true,
		})

		// Manually mine the transaction
		// If automine is true, this will mine an empty block
		// If automine is false, this will mine the pending transaction
		await mc.tevmMine()

		// Verify the state changed
		const valueAfterMine = await mc.tevmContract(simpleContract.read.get())
		expect(valueAfterMine.data).toBe(999n)
	})

	it('should handle multiple transactions in a single block', async () => {
		// Create a contract instance for interaction
		const simpleContract = SimpleContract.withAddress(contractAddress)

		// Send multiple transactions
		// If automine is true, each will be mined in its own block
		// If automine is false, all will be queued as pending until mined
		const values = [100n, 200n, 300n]

		for (const value of values) {
			const setValueData = encodeFunctionData({
				abi: SimpleContract.abi,
				functionName: 'set',
				args: [value],
			})

			await mc.tevmCall({
				to: contractAddress,
				data: setValueData,
				createTransaction: true,
			})
		}

		// Mine all transactions in a single block if not yet mined
		await mc.tevmMine()

		// Verify final state reflects the last transaction
		// This will be true regardless of whether automine is on or off
		const valueAfterMine = await mc.tevmContract(simpleContract.read.get())
		expect(valueAfterMine.data).toBe(300n)
	})
})
