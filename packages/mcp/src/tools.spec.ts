import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionManager } from './createSessionManager.js'
import { executeTool } from './executeTool.js'
import { toolDefinitions } from './toolDefinitions.js'
import { toolSchemas } from './toolSchemas.js'

const source = `
pragma solidity ^0.8.20;

contract AgentHarness {
    uint256 public value;

    event ValueChanged(uint256 value);

    constructor(uint256 initialValue) {
        value = initialValue;
    }

    function set(uint256 nextValue) external {
        value = nextValue;
        emit ValueChanged(nextValue);
    }

    function fail() external pure {
        require(false, "agent-visible revert");
    }

    function burn() external pure {
        while (true) {}
    }
}
`

describe('Tevm MCP tools', () => {
	const sessions = createSessionManager()
	let session = ''
	let contractAddress = ''
	let transactionHash = ''
	let artifact: any

	beforeAll(async () => {
		const created: any = await executeTool('evm_create_session', {}, sessions)
		session = created.handle
	})

	it('publishes a tight schema and an implementation for every required tool', () => {
		const names = toolDefinitions.map((tool) => tool.name)
		expect(names).toEqual(
			expect.arrayContaining([
				'evm_create_session',
				'evm_fork_chain',
				'evm_call_contract',
				'evm_send_transaction',
				'evm_deploy_contract',
				'evm_get_account',
				'evm_set_account',
				'evm_mine',
				'evm_get_block',
				'evm_get_transaction_receipt',
				'evm_get_txpool',
				'evm_trace_call',
				'evm_compile_solidity',
			]),
		)
		for (const tool of toolDefinitions) {
			expect(tool.description.length).toBeGreaterThan(40)
			expect(tool.inputSchema.type).toBe('object')
			expect(tool.inputSchema.additionalProperties).toBe(false)
		}
	})

	it('compiles, deploys, mines, reads, writes, traces, and queries chain data for real', async () => {
		artifact = await executeTool('evm_compile_solidity', { source, contractName: 'AgentHarness' }, sessions)
		expect(artifact.abi.length).toBeGreaterThan(0)
		expect(artifact.bytecode).toMatch(/^0x[0-9a-f]+$/i)

		const deployed: any = await executeTool(
			'evm_deploy_contract',
			{ session, bytecode: artifact.bytecode, abi: artifact.abi, args: ['7'] },
			sessions,
		)
		contractAddress = deployed.contractAddress
		transactionHash = deployed.transactionHash
		expect(contractAddress).toMatch(/^0x[0-9a-f]{40}$/i)
		expect(BigInt(deployed.gasUsed)).toBeGreaterThan(0n)

		const txpoolBeforeMine: any = await executeTool('evm_get_txpool', { session }, sessions)
		expect(txpoolBeforeMine.status.pending).toBe('0x1')

		const mined: any = await executeTool('evm_mine', { session }, sessions)
		expect(mined.blockNumber).toBe('1')

		const receipt: any = await executeTool('evm_get_transaction_receipt', { session, transactionHash }, sessions)
		expect(receipt.status).toBe('success')
		expect(receipt.contractAddress.toLowerCase()).toBe(contractAddress.toLowerCase())

		const read: any = await executeTool(
			'evm_call_contract',
			{ session, address: contractAddress, signature: 'value() view returns (uint256)' },
			sessions,
		)
		expect(read.decodedOutput).toBe('7')
		expect(BigInt(read.gasUsed)).toBeGreaterThan(0n)

		const sent: any = await executeTool(
			'evm_send_transaction',
			{ session, address: contractAddress, signature: 'set(uint256)', args: ['42'] },
			sessions,
		)
		expect(sent.txHash).toMatch(/^0x[0-9a-f]{64}$/i)
		expect(sent.logs).toHaveLength(1)

		const txpoolAfterWrite: any = await executeTool('evm_get_txpool', { session }, sessions)
		expect(txpoolAfterWrite.status.pending).toBe('0x1')
		await executeTool('evm_mine', { session }, sessions)

		const changed: any = await executeTool(
			'evm_call_contract',
			{ session, address: contractAddress, abi: artifact.abi, functionName: 'value' },
			sessions,
		)
		expect(changed.decodedOutput).toBe('42')

		const account: any = await executeTool(
			'evm_get_account',
			{ session, address: contractAddress, storageSlot: '0x00' },
			sessions,
		)
		expect(account.isContract).toBe(true)
		expect(account.storageValue).toMatch(/^0x2a0+$/i)

		const cheatAddress = '0x1000000000000000000000000000000000000001'
		await executeTool(
			'evm_set_account',
			{
				session,
				address: cheatAddress,
				balance: '1000000000000000000',
				nonce: '9',
				code: '0x6000',
				storage: { '0x00': '0x2a' },
			},
			sessions,
		)
		const cheated: any = await executeTool(
			'evm_get_account',
			{ session, address: cheatAddress, storageSlot: '0x00' },
			sessions,
		)
		expect(cheated.balance).toBe('1000000000000000000')
		expect(cheated.nonce).toBe('9')
		expect(cheated.code).toBe('0x6000')
		expect(cheated.storageValue).toMatch(/^0x2a0+$/i)

		const block: any = await executeTool(
			'evm_get_block',
			{ session, blockNumber: '2', includeTransactions: true },
			sessions,
		)
		expect(block.number).toBe('2')
		expect(block.transactions).toHaveLength(1)

		const trace: any = await executeTool(
			'evm_trace_call',
			{
				session,
				address: contractAddress,
				signature: 'value() view returns (uint256)',
				maxSteps: 10,
			},
			sessions,
		)
		expect(trace.totalSteps).toBeGreaterThan(0)
		expect(trace.returnedSteps).toBeLessThanOrEqual(10)
		expect(trace.steps[0].op).toBeTypeOf('string')
	})

	it('surfaces a decode failure', async () => {
		await expect(
			executeTool(
				'evm_call_contract',
				{ session, address: contractAddress, signature: 'value() view returns (string)' },
				sessions,
			),
		).rejects.toThrow(/bounds|decode/i)
	})

	it('surfaces a decoded revert reason', async () => {
		await expect(
			executeTool('evm_call_contract', { session, address: contractAddress, signature: 'fail()' }, sessions),
		).rejects.toThrow('agent-visible revert')
	})

	it('surfaces out of gas', async () => {
		await expect(
			executeTool(
				'evm_call_contract',
				{ session, address: contractAddress, signature: 'burn()', gasLimit: '25000' },
				sessions,
			),
		).rejects.toThrow(/out of gas/i)
	})

	it('traces a reverting call instead of throwing', async () => {
		const trace: any = await executeTool(
			'evm_trace_call',
			{ session, address: contractAddress, signature: 'fail()' },
			sessions,
		)
		expect(trace.failed).toBe(true)
		expect(trace.totalSteps).toBeGreaterThan(0)
		expect(JSON.stringify(trace.errors)).toMatch(/revert/i)
		expect(trace.revertReason).toBe('Error: agent-visible revert')
	})

	it('accepts a minimal zero argument signature and rejects a malformed one', () => {
		expect(() =>
			toolSchemas.evm_call_contract.parse({ session, address: contractAddress, signature: 'n()' }),
		).not.toThrow()
		expect(() =>
			toolSchemas.evm_call_contract.parse({ session, address: contractAddress, signature: 'notASignature' }),
		).toThrow()
	})

	it('rejects bad input at the schema boundary', async () => {
		await expect(executeTool('evm_mine', { session, blockCount: 0 }, sessions)).rejects.toThrow()
		await expect(executeTool('evm_get_account', { session, address: 'not-an-address' }, sessions)).rejects.toThrow()
	})

	it('closes an isolated session', async () => {
		expect(await executeTool('evm_close_session', { session }, sessions)).toEqual({ closed: true })
		expect(() => sessions.get(session)).toThrow(/Unknown or expired/)
	})
})
