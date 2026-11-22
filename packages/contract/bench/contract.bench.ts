import { bench, describe } from 'vitest'
import { createContract, ERC20, SimpleContract } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const recipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

const erc20AtAddress = ERC20.withAddress(tokenAddress)

describe('@tevm/contract', () => {
	bench(
		'createContract from humanReadableAbi (ERC20)',
		() => {
			const c = createContract({
				name: 'BenchERC20',
				humanReadableAbi: ERC20.humanReadableAbi,
			})
			if (!c.read.balanceOf) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'createContract from JSON abi (ERC20)',
		() => {
			const c = createContract({
				name: 'BenchERC20',
				abi: ERC20.abi,
			})
			if (!c.read.balanceOf) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'ERC20.withAddress(addr)',
		() => {
			const bound = ERC20.withAddress(tokenAddress)
			if (bound.address !== tokenAddress) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'contract.read.balanceOf(user) action creation',
		() => {
			const action = erc20AtAddress.read.balanceOf(userAddress)
			if (action.functionName !== 'balanceOf') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'contract.write.transfer(to, amount) action creation',
		() => {
			const action = erc20AtAddress.write.transfer(recipientAddress, 1000n)
			if (action.functionName !== 'transfer') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'contract.events.Transfer(filter) creation',
		() => {
			const ev = erc20AtAddress.events.Transfer({ fromBlock: 'latest' })
			if (ev.eventName !== 'Transfer') throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'SimpleContract.deploy(42n) action creation',
		() => {
			const d = SimpleContract.deploy(42n)
			if (!d.bytecode) throw new Error('unexpected')
		},
		benchOpts,
	)
})
