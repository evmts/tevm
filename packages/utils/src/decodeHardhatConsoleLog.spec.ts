import { encodeAbiParameters, encodeFunctionData, type Hex, parseAbi, toFunctionSelector } from 'viem'
import { describe, expect, it } from 'vitest'
import { decodeHardhatConsoleLog } from './decodeHardhatConsoleLog.js'
import { HARDHAT_CONSOLE_ADDRESS } from './HARDHAT_CONSOLE_ADDRESS.js'

const encode = (signature: string, args: readonly unknown[]) =>
	encodeFunctionData({ abi: parseAbi([`function ${signature}`] as readonly string[]) as any, args: args as any }) as Hex
const address = '0x1234567890AbcdEF1234567890aBcdef12345678'

describe('HARDHAT_CONSOLE_ADDRESS', () => {
	it('is the ASCII bytes of console.log left-padded to 20 bytes', () => {
		expect(HARDHAT_CONSOLE_ADDRESS).toBe('0x000000000000000000636f6e736f6c652e6c6f67')
		expect(Buffer.from(HARDHAT_CONSOLE_ADDRESS.slice(-22), 'hex').toString('ascii')).toBe('console.log')
	})
})

describe('decodeHardhatConsoleLog', () => {
	it('decodes the selectors emitted by Hardhat console.sol', () => {
		// Selectors copied from hardhat/console.sol.
		expect(decodeHardhatConsoleLog('0x51973ec9')).toEqual({ formatted: '', args: [], signature: 'log()' })
		expect(
			decodeHardhatConsoleLog(`0x41304fac${encodeAbiParameters([{ type: 'string' }], ['hi']).slice(2)}`),
		).toMatchObject({ formatted: 'hi', signature: 'log(string)' })
		expect(decodeHardhatConsoleLog(`0xf82c50f1${encodeAbiParameters([{ type: 'uint256' }], [7n]).slice(2)}`)).toEqual({
			formatted: '7',
			args: [7n],
			signature: 'log(uint256)',
		})
	})

	it('decodes legacy uint/int selector spellings as uint256/int256', () => {
		const data = encodeAbiParameters([{ type: 'string' }, { type: 'uint256' }], ['n', 5n]).slice(2)
		expect(toFunctionSelector('log(string,uint)')).not.toBe(toFunctionSelector('log(string,uint256)'))
		expect(decodeHardhatConsoleLog(`${toFunctionSelector('log(string,uint)')}${data}`)).toEqual({
			formatted: 'n 5',
			args: ['n', 5n],
			signature: 'log(string,uint256)',
		})
		expect(decodeHardhatConsoleLog(encode('logInt(int256)', [-3n]))).toMatchObject({
			formatted: '-3',
			signature: 'logInt(int256)',
		})
		expect(
			decodeHardhatConsoleLog(
				`${toFunctionSelector('logInt(int)')}${encodeAbiParameters([{ type: 'int256' }], [-3n]).slice(2)}`,
			)?.signature,
		).toBe('logInt(int256)')
	})

	it('decodes every typed single-argument helper', () => {
		expect(decodeHardhatConsoleLog(encode('logUint(uint256)', [1n]))?.formatted).toBe('1')
		expect(decodeHardhatConsoleLog(encode('log(int256)', [-1n]))?.formatted).toBe('-1')
		expect(decodeHardhatConsoleLog(encode('logString(string)', ['s']))?.formatted).toBe('s')
		expect(decodeHardhatConsoleLog(encode('logBool(bool)', [true]))?.formatted).toBe('true')
		expect(decodeHardhatConsoleLog(encode('log(bool)', [false]))?.formatted).toBe('false')
		expect(decodeHardhatConsoleLog(encode('logAddress(address)', [address]))?.formatted).toBe(address)
		expect(decodeHardhatConsoleLog(encode('log(address)', [address]))?.args).toEqual([address])
		expect(decodeHardhatConsoleLog(encode('logBytes(bytes)', ['0xdeadbeef']))?.formatted).toBe('0xdeadbeef')
		expect(decodeHardhatConsoleLog(encode('log(bytes)', ['0x']))?.formatted).toBe('0x')
		for (let size = 1; size <= 32; size++) {
			const value = `0x${'ab'.repeat(size)}`
			expect(decodeHardhatConsoleLog(encode(`logBytes${size}(bytes${size})`, [value]))).toEqual({
				formatted: value,
				args: [value],
				signature: `logBytes${size}(bytes${size})`,
			})
			expect(decodeHardhatConsoleLog(encode(`log(bytes${size})`, [value]))?.formatted).toBe(value)
		}
	})

	it('decodes every multi-argument overload up to four arguments', () => {
		const samples = { uint256: 9n, int256: -9n, string: 'x', bool: true, address } as const
		const types = Object.keys(samples) as (keyof typeof samples)[]
		let combos: (keyof typeof samples)[][] = [[]]
		let count = 0
		for (let arity = 1; arity <= 4; arity++) {
			combos = combos.flatMap((prefix) => types.map((type) => [...prefix, type]))
			for (const combo of combos) {
				const signature = `log(${combo.join(',')})`
				const args = combo.map((type) => samples[type])
				const decoded = decodeHardhatConsoleLog(encode(signature, args))
				expect(decoded?.signature).toBe(signature)
				expect(decoded?.args).toEqual(args)
				count++
			}
		}
		expect(count).toBe(5 + 25 + 125 + 625)
	})

	it('applies %s, %d, %i, %o and %% format specifiers', () => {
		expect(decodeHardhatConsoleLog(encode('log(string,uint256)', ['balance: %d', 42n]))?.formatted).toBe(
			'balance: 42',
		)
		expect(decodeHardhatConsoleLog(encode('log(string,int256,string)', ['%i is %s', -4n, 'neg']))?.formatted).toBe(
			'-4 is neg',
		)
		expect(decodeHardhatConsoleLog(encode('log(string,string)', ['%o', 'q']))?.formatted).toBe("'q'")
		expect(decodeHardhatConsoleLog(encode('log(string,bool)', ['100%% %d', true]))?.formatted).toBe('100% NaN')
		expect(decodeHardhatConsoleLog(encode('log(string,address,uint256)', ['to %s', address, 3n]))?.formatted).toBe(
			`to ${address} 3`,
		)
		expect(decodeHardhatConsoleLog(encode('log(string,string)', ['%s %s', 'one']))?.formatted).toBe('one %s')
		expect(decodeHardhatConsoleLog(encode('log(string)', ['%s']))?.formatted).toBe('%s')
		expect(decodeHardhatConsoleLog(encode('log(uint256,string)', [1n, '%s']))?.formatted).toBe('1 %s')
	})

	it('accepts uppercase hex selectors', () => {
		expect(decodeHardhatConsoleLog('0x51973EC9')?.signature).toBe('log()')
	})

	it('returns null for unknown, short, malformed or truncated calldata', () => {
		expect(decodeHardhatConsoleLog('0x')).toBeNull()
		expect(decodeHardhatConsoleLog('0x5197')).toBeNull()
		expect(decodeHardhatConsoleLog('0xdeadbeef')).toBeNull()
		expect(decodeHardhatConsoleLog('0x51973ec9z' as Hex)).toBeNull()
		expect(decodeHardhatConsoleLog('nothex' as Hex)).toBeNull()
		expect(decodeHardhatConsoleLog(encode('log(string)', ['hi']).slice(0, 20) as Hex)).toBeNull()
	})
})
