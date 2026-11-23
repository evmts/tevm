import { bench, describe } from 'vitest'
import {
	bytesToHex,
	decodeFunctionResult,
	encodeFunctionData,
	formatAbi,
	fromRlp,
	getAddress,
	hexToBytes,
	keccak256,
	PREFUNDED_PUBLIC_KEYS,
	parseAbi,
	toHex,
	toRlp,
} from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const erc20HumanAbi = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 value) returns (bool)',
	'function approve(address spender, uint256 value) returns (bool)',
	'function transferFrom(address from, address to, uint256 value) returns (bool)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

const erc20Abi = parseAbi(erc20HumanAbi)
const payloadBytes = new Uint8Array(1024).map((_, i) => i & 0xff)
const payloadHex = bytesToHex(payloadBytes)
const rlpInput = [toHex(1n), toHex(21000n), PREFUNDED_PUBLIC_KEYS[0], toHex(1000000000000000000n), payloadHex]
const encodedBalanceResult = '0x0000000000000000000000000000000000000000000000056bc75e2d63100000' as const

describe('@tevm/utils', () => {
	bench(
		'keccak256 (1 KB bytes)',
		() => {
			const h = keccak256(payloadBytes)
			if (h.length !== 66) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'bytesToHex + hexToBytes roundtrip (1 KB)',
		() => {
			const hex = bytesToHex(payloadBytes)
			const back = hexToBytes(hex)
			if (back.length !== 1024) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'toRlp + fromRlp roundtrip (tx-shaped list)',
		() => {
			const enc = toRlp(rlpInput)
			const dec = fromRlp(enc)
			if (!Array.isArray(dec) || dec.length !== 5) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'parseAbi (10-item ERC20 human-readable ABI)',
		() => {
			const abi = parseAbi(erc20HumanAbi)
			if (abi.length !== 10) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'formatAbi (10-item ERC20 JSON ABI)',
		() => {
			const formatted = formatAbi(erc20Abi)
			if (formatted.length !== 10) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'encodeFunctionData (ERC20 transfer)',
		() => {
			const data = encodeFunctionData({
				abi: erc20Abi,
				functionName: 'transfer',
				args: [PREFUNDED_PUBLIC_KEYS[1], 1000000000000000000n],
			})
			if (data.length !== 138) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'decodeFunctionResult (ERC20 balanceOf)',
		() => {
			const bal = decodeFunctionResult({
				abi: erc20Abi,
				functionName: 'balanceOf',
				data: encodedBalanceResult,
			})
			if (bal !== 100000000000000000000n) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'getAddress checksum validation (10 accounts)',
		() => {
			for (const acc of PREFUNDED_PUBLIC_KEYS) {
				getAddress(acc.toLowerCase())
			}
		},
		benchOpts,
	)
})
