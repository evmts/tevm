import { createZevmEngine } from '@tevm/node'
import { parseAbi, toHex } from 'viem'
import { expect, it } from 'vitest'
import {
	tevmCall,
	tevmContract,
	tevmDeal,
	tevmDeploy,
	tevmDumpState,
	tevmGetAccount,
	tevmLoadState,
	tevmMine,
	tevmSetAccount,
} from './index.js'

const address = '0x0000000000000000000000000000000000000123'
const runtime = '0x602a60005260206000f3'
const initcode = '0x600a600c600039600a6000f3602a60005260206000f3'
const abi = parseAbi(['function answer() view returns (uint256)'])

it('exports standalone account, storage, call and state actions over native RPC', async () => {
	const engine = createZevmEngine()
	try {
		await tevmSetAccount(engine, {
			address,
			balance: 42n,
			nonce: 2n,
			deployedBytecode: runtime,
			storage: { '0x0': '0x2a' },
		})
		await tevmSetAccount(engine, { address })
		expect(await tevmGetAccount(engine, { address })).toMatchObject({
			address,
			balance: 42n,
			nonce: 2n,
			deployedBytecode: runtime,
		})
		expect(await engine.request({ method: 'eth_getStorageAt', params: [address, '0x0', 'latest'] })).toBe(
			toHex(42n, { size: 32 }),
		)
		expect((await tevmCall(engine, { to: address })).rawData).toBe(toHex(42n, { size: 32 }))
		const state = await tevmDumpState(engine)
		await tevmDeal(engine, { address, amount: 99n })
		expect((await tevmGetAccount(engine, { address })).balance).toBe(99n)
		await tevmLoadState(engine, state)
		expect((await tevmGetAccount(engine, { address })).balance).toBe(42n)
	} finally {
		await engine.close()
	}
})

it('deploys, submits and mines native transactions with ABI helpers', async () => {
	const engine = createZevmEngine({ mining: { auto: false } })
	try {
		const deployed = await tevmDeploy(engine, { bytecode: initcode })
		expect(deployed.createdAddress).toMatch(/^0x[0-9a-f]{40}$/i)
		expect((await tevmContract(engine, { address: deployed.createdAddress!, abi, functionName: 'answer' })).data).toBe(
			42n,
		)
		const queued = await tevmContract(engine, {
			to: deployed.createdAddress!,
			abi,
			functionName: 'answer',
			addToMempool: true,
		})
		expect(queued.txHash).toMatch(/^0x[0-9a-f]{64}$/)
		expect(queued.data).toBeUndefined()
		expect(await engine.request({ method: 'eth_getTransactionReceipt', params: [queued.txHash!] })).toBeNull()
		await tevmMine(engine, { blocks: 1, interval: 2 })
		expect(await engine.request({ method: 'eth_getTransactionReceipt', params: [queued.txHash!] })).toMatchObject({
			status: '0x1',
		})
		const pending = await tevmDeploy(engine, { bytecode: initcode, abi: [], args: [], addToMempool: true })
		expect(pending.createdAddress).toBeUndefined()
		await tevmMine(engine)
	} finally {
		await engine.close()
	}
})

it('preserves overrides, explicit transaction fields, and structured failures', async () => {
	const engine = createZevmEngine()
	try {
		const [from] = (await engine.request({ method: 'eth_accounts' })) as string[]
		const result = await tevmCall(engine, {
			to: address,
			from: from as `0x${string}`,
			data: '0x',
			gas: 100000n,
			maxFeePerGas: 0n,
			maxPriorityFeePerGas: 0n,
			value: 0n,
			blockTag: 'latest',
			stateOverride: { [address]: { code: runtime } },
		})
		expect(result.rawData).toBe(toHex(42n, { size: 32 }))
		expect(await engine.request({ method: 'eth_getCode', params: [address, 'latest'] })).toBe('0x')
		const sent = await tevmCall(engine, {
			to: address,
			from: from as `0x${string}`,
			value: 1n,
			nonce: 0n,
			gasPrice: BigInt((await engine.request({ method: 'eth_gasPrice' })) as string),
			addToBlockchain: true,
		})
		expect(sent.receipt).toMatchObject({ status: '0x1' })
		await expect(tevmContract(engine, { abi, functionName: 'answer' })).rejects.toThrow(
			'A contract address is required',
		)
		await tevmSetAccount(engine, { address, deployedBytecode: '0x63deadbeef6000526004601cfd' })
		await expect(tevmCall(engine, { to: address })).rejects.toMatchObject({ code: 3, data: '0xdeadbeef' })
	} finally {
		await engine.close()
	}
})
