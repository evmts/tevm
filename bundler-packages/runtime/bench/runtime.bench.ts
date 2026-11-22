import { runSync } from 'effect/Effect'
import { bench, describe } from 'vitest'
import { generateRuntime } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const sampleArtifacts = {
	ERC20Token: {
		abi: [
			{ type: 'function', name: 'name', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
			{ type: 'function', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
			{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
			{
				type: 'function',
				name: 'balanceOf',
				inputs: [{ name: 'owner', type: 'address' }],
				outputs: [{ name: '', type: 'uint256' }],
				stateMutability: 'view',
			},
			{
				type: 'function',
				name: 'transfer',
				inputs: [
					{ name: 'to', type: 'address' },
					{ name: 'amount', type: 'uint256' },
				],
				outputs: [{ name: '', type: 'bool' }],
				stateMutability: 'nonpayable',
			},
			{
				type: 'event',
				name: 'Transfer',
				inputs: [
					{ name: 'from', type: 'address', indexed: true },
					{ name: 'to', type: 'address', indexed: true },
					{ name: 'value', type: 'uint256', indexed: false },
				],
			},
		],
		userdoc: {
			notice: 'Standard ERC20 token contract',
			methods: {
				'balanceOf(address)': { notice: 'Returns token balance for account' },
				'transfer(address,uint256)': { notice: 'Transfers tokens to recipient' },
			},
		},
		evm: {
			bytecode: { object: '6080604052'.repeat(100) },
			deployedBytecode: { object: '6080604052'.repeat(80) },
		},
	},
}

describe('@tevm/runtime', () => {
	bench(
		'generateRuntime (mjs with bytecode)',
		() => {
			const code = runSync(generateRuntime(sampleArtifacts as any, 'mjs', true, 'tevm/contract'))
			if (!code.includes('createContract')) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'generateRuntime (ts with bytecode)',
		() => {
			const code = runSync(generateRuntime(sampleArtifacts as any, 'ts', true, 'tevm/contract'))
			if (!code.includes('export const ERC20Token')) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'generateRuntime (dts declarations)',
		() => {
			const code = runSync(generateRuntime(sampleArtifacts as any, 'dts', true, 'tevm/contract'))
			if (!code.includes('ERC20Token')) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'generateRuntime (cjs)',
		() => {
			const code = runSync(generateRuntime(sampleArtifacts as any, 'cjs', false, 'tevm/contract'))
			if (!code.includes('module.exports')) throw new Error('unexpected')
		},
		benchOpts,
	)
})
