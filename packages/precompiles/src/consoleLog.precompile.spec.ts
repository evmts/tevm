import {
	type AbiParameter,
	encodeAbiParameters,
	getAddress,
	type Hex,
	hexToBytes,
	toFunctionSelector,
} from '@tevm/utils'
import { describe, expect, it, vi } from 'vitest'
import { consoleLogPrecompile } from './consoleLog.precompile.js'

const encodeConsoleCall = (
	signature: string,
	parameters: readonly AbiParameter[],
	values: readonly unknown[],
): Uint8Array => {
	const encodedParameters = encodeAbiParameters(parameters, values as any)
	return hexToBytes(`${toFunctionSelector(signature)}${encodedParameters.slice(2)}` as Hex)
}

const expectSuccessfulNoOutput = (result: ReturnType<ReturnType<typeof consoleLogPrecompile>['function']>) => {
	expect(result.executionGasUsed).toBe(0n)
	expect(result.returnValue).toEqual(new Uint8Array())
}

describe('consoleLogPrecompile', () => {
	it('matches known Hardhat and forge-std selectors', () => {
		const knownSelectors = [
			['log(string)', '0x41304fac', [{ type: 'string' }], ['hello']],
			['log(uint256)', '0xf82c50f1', [{ type: 'uint256' }], [42n]],
			['log(string,uint256)', '0xb60e72cc', [{ type: 'string' }, { type: 'uint256' }], ['count', 42n]],
			['log(address)', '0x2c2ecbc2', [{ type: 'address' }], ['0x1234567890123456789012345678901234567890']],
			['log(bool)', '0x32458eed', [{ type: 'bool' }], [true]],
		] as const
		const logs: unknown[][] = []
		const precompile = consoleLogPrecompile({ onLog: (args) => logs.push(args) })

		for (const [signature, selector, parameters, values] of knownSelectors) {
			expect(toFunctionSelector(signature)).toBe(selector)
			expectSuccessfulNoOutput(precompile.function({ data: encodeConsoleCall(signature, parameters, values) }))
		}

		expect(logs).toEqual([
			['hello'],
			['42'],
			['count', '42'],
			[getAddress('0x1234567890123456789012345678901234567890')],
			[true],
		])
	})

	it('decodes every supported one-to-four argument type combination', () => {
		const values = {
			uint256: 123n,
			string: 'tevm',
			bool: true,
			address: '0x1234567890123456789012345678901234567890',
		} as const
		const expectedValues = {
			uint256: '123',
			string: 'tevm',
			bool: true,
			address: getAddress(values.address),
		} as const
		const types = Object.keys(values) as (keyof typeof values)[]
		const logs: unknown[][] = []
		const precompile = consoleLogPrecompile({ onLog: (args) => logs.push(args) })
		let calls = 0

		const checkCombinations = (combination: (keyof typeof values)[]) => {
			if (combination.length > 0) {
				const parameters = combination.map((type) => ({ type }))
				const signature = `log(${combination.join(',')})`
				precompile.function({
					data: encodeConsoleCall(
						signature,
						parameters,
						combination.map((type) => values[type]),
					),
				})
				expect(logs.at(-1)).toEqual(combination.map((type) => expectedValues[type]))
				calls++
			}
			if (combination.length === 4) return
			for (const type of types) checkCombinations([...combination, type])
		}
		checkCombinations([])

		expect(calls).toBe(340)
		expect(logs).toHaveLength(340)
	})

	it('supports empty, bytes, integer aliases, and named variants', () => {
		const logs: unknown[][] = []
		const precompile = consoleLogPrecompile({ onLog: (args) => logs.push(args) })
		const cases = [
			['log()', [], [], []],
			['log(bytes)', [{ type: 'bytes' }], ['0x1234'], ['0x1234']],
			['log(bytes32)', [{ type: 'bytes32' }], [`0x${'ab'.repeat(32)}`], [`0x${'ab'.repeat(32)}`]],
			['log(int256)', [{ type: 'int256' }], [-7n], ['-7']],
			['log(int)', [{ type: 'int256' }], [-8n], ['-8']],
			['log(uint)', [{ type: 'uint256' }], [9n], ['9']],
			['logInt(int256)', [{ type: 'int256' }], [-10n], ['-10']],
			['logUint(uint256)', [{ type: 'uint256' }], [11n], ['11']],
			['logString(string)', [{ type: 'string' }], ['named'], ['named']],
			['logBool(bool)', [{ type: 'bool' }], [false], [false]],
			[
				'logAddress(address)',
				[{ type: 'address' }],
				['0x1234567890123456789012345678901234567890'],
				[getAddress('0x1234567890123456789012345678901234567890')],
			],
			['logBytes(bytes)', [{ type: 'bytes' }], ['0xabcd'], ['0xabcd']],
			['logBytes1(bytes1)', [{ type: 'bytes1' }], ['0xef'], ['0xef']],
		] as const

		for (const [signature, parameters, values, expected] of cases) {
			expectSuccessfulNoOutput(precompile.function({ data: encodeConsoleCall(signature, parameters, values) }))
			expect(logs.at(-1)).toEqual(expected)
		}
	})

	it.each([
		['unknown selector', hexToBytes('0xdeadbeef')],
		['empty calldata', new Uint8Array()],
		['three-byte calldata', hexToBytes('0x010203')],
		['truncated arguments', hexToBytes('0x41304fac01')],
		['garbage arguments', hexToBytes(`0x41304fac${'ff'.repeat(64)}`)],
	])('swallows %s', (_name, data) => {
		const onLog = vi.fn()
		const precompile = consoleLogPrecompile({ onLog })

		expect(() => expectSuccessfulNoOutput(precompile.function({ data }))).not.toThrow()
		expect(onLog).not.toHaveBeenCalled()
	})

	it('swallows errors thrown by a custom handler', () => {
		const precompile = consoleLogPrecompile({
			onLog: () => {
				throw new Error('handler failed')
			},
		})
		const data = encodeConsoleCall('log(bool)', [{ type: 'bool' }], [true])

		expect(() => expectSuccessfulNoOutput(precompile.function({ data }))).not.toThrow()
	})

	it('uses console.log by default', () => {
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
		try {
			const data = encodeConsoleCall('log(string,uint256)', [{ type: 'string' }, { type: 'uint256' }], ['default', 12n])
			expectSuccessfulNoOutput(consoleLogPrecompile().function({ data }))
			expect(consoleLog).toHaveBeenCalledWith('default', '12')
		} finally {
			consoleLog.mockRestore()
		}
	})
})
