import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createZevmEngine } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

// Simple runtime contract: PUSH1 42; PUSH1 0; MSTORE; PUSH1 32; PUSH1 0; RETURN
const return42Bytecode = '0x602a60005260206000f3'
// SLOAD(0) + ADD 1 + SSTORE(0) + RETURN
const counterBytecode = '0x6000546001018060005560005260206000f3'
const contractAddr = '0x0000000000000000000000000000000000001001'
const counterAddr = '0x0000000000000000000000000000000000001002'
const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

const blockNumberReqJson = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] })
const ethCallReqJson = JSON.stringify({
	jsonrpc: '2.0',
	id: 2,
	method: 'eth_call',
	params: [{ to: contractAddr, data: '0x' }, 'latest'],
})

let engine: ReturnType<typeof createZevmEngine>
let dumpSnapshot: string

beforeAll(async () => {
	engine = createZevmEngine({ chainId: 31337 })
	await engine.ready()
	await engine.request({ method: 'anvil_setCode', params: [contractAddr, return42Bytecode] })
	await engine.request({ method: 'anvil_setCode', params: [counterAddr, counterBytecode] })
	dumpSnapshot = (await engine.request({ method: 'anvil_dumpState' })) as string
})

afterAll(async () => {
	await engine.close()
})

describe('@tevm/node (native ZEVM)', () => {
	bench(
		'createZevmEngine + ready + close lifecycle',
		async () => {
			const e = createZevmEngine({ chainId: 31337 })
			await e.ready()
			await e.close()
		},
		{ time: 250, warmupTime: 50, warmupIterations: 3, throws: true },
	)

	bench(
		'raw rpc("eth_blockNumber")',
		async () => {
			const res = await engine.rpc(blockNumberReqJson)
			if (!res) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'request({ method: "eth_blockNumber" })',
		async () => {
			const res = await engine.request({ method: 'eth_blockNumber' })
			if (typeof res !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'raw rpc("eth_call") simple bytecode',
		async () => {
			const res = await engine.rpc(ethCallReqJson)
			if (!res) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'request("eth_call") simple bytecode',
		async () => {
			const res = await engine.request({ method: 'eth_call', params: [{ to: contractAddr, data: '0x' }, 'latest'] })
			if (typeof res !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'request("eth_getBalance")',
		async () => {
			const res = await engine.request({ method: 'eth_getBalance', params: [sender, 'latest'] })
			if (typeof res !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'eth_sendTransaction (ETH transfer + automine)',
		async () => {
			const hash = await engine.request({
				method: 'eth_sendTransaction',
				params: [{ from: sender, to: recipient, value: '0x1' }],
			})
			if (typeof hash !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'eth_sendTransaction (SSTORE counter + automine)',
		async () => {
			const hash = await engine.request({
				method: 'eth_sendTransaction',
				params: [{ from: sender, to: counterAddr, data: '0x' }],
			})
			if (typeof hash !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'evm_snapshot + evm_revert cycle',
		async () => {
			const snap = await engine.request({ method: 'evm_snapshot' })
			const ok = await engine.request({ method: 'evm_revert', params: [snap] })
			if (!ok) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'anvil_dumpState + anvil_loadState',
		async () => {
			const state = await engine.request({ method: 'anvil_dumpState' })
			if (typeof state !== 'string') throw new Error('unexpected')
			await engine.request({ method: 'anvil_loadState', params: [dumpSnapshot] })
		},
		{ time: 250, warmupTime: 50, warmupIterations: 3, throws: true },
	)

	bench(
		'25 concurrent eth_call requests',
		async () => {
			const results = await Promise.all(
				Array.from({ length: 25 }, () =>
					engine.request({ method: 'eth_call', params: [{ to: contractAddr, data: '0x' }, 'latest'] }),
				),
			)
			if (results.length !== 25) throw new Error('unexpected')
		},
		benchOpts,
	)
})
