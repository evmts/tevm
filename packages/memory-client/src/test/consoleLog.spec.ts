import { CONSOLE_LOG_ADDRESS } from '@tevm/precompiles'
import { encodeAbiParameters, getAddress, type Hex, toFunctionSelector } from '@tevm/utils'
import { encodeFunctionData, parseAbi } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryClient } from '../createMemoryClient.js'
import { consoleLogRuntimeBytecode } from './consoleLogRuntimeBytecode.js'

const consoleAddress = getAddress(CONSOLE_LOG_ADDRESS.toString())

describe('consoleLog option', () => {
	it('decodes direct calls to the console precompile', async () => {
		const onLog = vi.fn()
		const client = createMemoryClient({ consoleLog: { onLog } })
		const encodedParameters = encodeAbiParameters([{ type: 'string' }, { type: 'uint256' }], ['direct', 5n])
		const data = `${toFunctionSelector('log(string,uint256)')}${encodedParameters.slice(2)}` as Hex

		const result = await client.tevmCall({ to: consoleAddress, data })

		expect(result.errors).toBeUndefined()
		expect(result.rawData).toBe('0x')
		expect(result.executionGasUsed).toBe(0n)
		expect(onLog).toHaveBeenCalledOnce()
		expect(onLog).toHaveBeenCalledWith(['direct', '5'])
	})

	it('handles a STATICCALL from deployed runtime bytecode without reverting the caller', async () => {
		const onLog = vi.fn()
		const client = createMemoryClient({ consoleLog: { onLog } })
		const contractAddress = '0x1234567890123456789012345678901234567890'
		await client.tevmSetAccount({ address: contractAddress, deployedBytecode: consoleLogRuntimeBytecode })

		const result = await client.tevmCall({
			to: contractAddress,
			data: encodeFunctionData({ abi: parseAbi(['function run() view returns (bool)']), functionName: 'run' }),
		})

		expect(result.errors).toBeUndefined()
		expect(result.rawData).toBe(`0x${'0'.repeat(63)}1`)
		expect(onLog).toHaveBeenCalledOnce()
		expect(onLog).toHaveBeenCalledWith(['from bytecode', '42'])
	})

	it('does not register the precompile unless enabled', async () => {
		const client = createMemoryClient()
		const vm = await client.transport.tevm.getVm()

		expect((vm.evm as any).getPrecompile(CONSOLE_LOG_ADDRESS)).toBeUndefined()

		const result = await client.tevmCall({
			to: consoleAddress,
			data: '0x41304fac',
		})
		expect(result.errors).toBeUndefined()
		expect(result.rawData).toBe('0x')
	})
})
