import { createZevmEngine } from '@tevm/node'
import { parseAbi } from 'viem'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import {
	tevmCall,
	tevmContract,
	tevmDeal,
	tevmDumpState,
	tevmGetAccount,
	tevmLoadState,
	tevmMine,
	tevmSetAccount,
} from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

// Minimal runtime contract: returns uint256(42) for any call
const return42Bytecode = '0x602a60005260206000f3' as const
const contractAddr = '0x0000000000000000000000000000000000002001' as const
const accountAddr = '0x0000000000000000000000000000000000002002' as const
const getterAbi = parseAbi(['function get() view returns (uint256)'])

let engine: ReturnType<typeof createZevmEngine>
let dumpedState: `0x${string}`

beforeAll(async () => {
	engine = createZevmEngine({ chainId: 31337 })
	await engine.ready()
	await tevmSetAccount(engine, { address: contractAddr, deployedBytecode: return42Bytecode })
	await tevmSetAccount(engine, { address: accountAddr, balance: 10n ** 20n, nonce: 1n })
	dumpedState = await tevmDumpState(engine)
})

afterAll(async () => {
	await engine.close()
})

describe('@tevm/actions', () => {
	bench(
		'tevmCall (pure eth_call)',
		async () => {
			const res = await tevmCall(engine, { to: contractAddr, data: '0x' })
			if (!res.rawData) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmContract (ABI encode + eth_call + ABI decode)',
		async () => {
			const res = await tevmContract(engine, {
				abi: getterAbi,
				functionName: 'get',
				to: contractAddr,
			})
			if (res.data !== 42n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmGetAccount',
		async () => {
			const acc = await tevmGetAccount(engine, { address: accountAddr })
			if (acc.balance === undefined) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'tevmSetAccount (balance + nonce)',
		async () => {
			await tevmSetAccount(engine, { address: accountAddr, balance: 10n ** 20n, nonce: 2n })
		},
		benchOpts,
	)

	bench(
		'tevmDeal (balance set)',
		async () => {
			await tevmDeal(engine, { address: accountAddr, amount: 5n * 10n ** 18n })
		},
		benchOpts,
	)

	bench(
		'tevmMine (1 block)',
		async () => {
			await tevmMine(engine, { blockCount: 1 })
		},
		benchOpts,
	)

	bench(
		'tevmDumpState + tevmLoadState',
		async () => {
			const snap = await tevmDumpState(engine)
			if (!snap.startsWith('0x')) throw new Error('unexpected')
			await tevmLoadState(engine, dumpedState)
		},
		{ time: 250, warmupTime: 50, warmupIterations: 3, throws: true },
	)
})
