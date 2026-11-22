import { afterAll, beforeAll, bench, describe } from 'vitest'
import { TevmProvider } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 5, throws: true }

const contractAddr = '0x0000000000000000000000000000000000006001'
const sender = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

let provider: TevmProvider

beforeAll(async () => {
	provider = await TevmProvider.createMemoryProvider()
	await provider.tevm.tevmSetAccount({ address: contractAddr, deployedBytecode: '0x602a60005260206000f3' })
})

afterAll(async () => {
	provider.destroy()
})

describe('@tevm/ethers', () => {
	bench(
		'TevmProvider.getBlockNumber()',
		async () => {
			const bn = await provider.getBlockNumber()
			if (bn < 0) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'TevmProvider.getBalance()',
		async () => {
			const bal = await provider.getBalance(sender)
			if (bal <= 0n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'TevmProvider.call()',
		async () => {
			const res = await provider.call({ to: contractAddr, data: '0x' })
			if (!res || res === '0x') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'TevmProvider.send("eth_chainId", [])',
		async () => {
			const chainId = await provider.send('eth_chainId', [])
			if (!chainId) throw new Error('unexpected')
		},
		benchOpts,
	)
})
