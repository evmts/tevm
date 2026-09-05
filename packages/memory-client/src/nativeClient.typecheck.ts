import type { RpcClient } from '@tevm/actions'
import { tevmContract } from '@tevm/actions'
import type { MemoryClient } from './MemoryClient.js'

// Compile-only regression: ABI names, arguments and decoded results survive
// both the standalone action and the native viem extension.
async function assertContractTypes(client: MemoryClient, rpc: RpcClient) {
	const abi = [
		{
			type: 'function',
			name: 'double',
			stateMutability: 'pure',
			inputs: [{ name: 'value', type: 'uint256' }],
			outputs: [{ name: 'result', type: 'uint256' }],
		},
	] as const
	const address = '0x0000000000000000000000000000000000000123' as const
	const bound = await client.tevmContract({ abi, address, functionName: 'double', args: [21n] })
	const direct = await tevmContract(rpc, { abi, address, functionName: 'double', args: [21n] })
	const result: bigint | undefined = bound.data
	const directResult: bigint | undefined = direct.data
	// @ts-expect-error Decoded uint256 values are not strings.
	const wrongResult: string = bound.data
	// @ts-expect-error Only declared ABI functions are callable.
	await client.tevmContract({ abi, address, functionName: 'missing', args: [21n] })
	// @ts-expect-error uint256 arguments require bigint.
	await tevmContract(rpc, { abi, address, functionName: 'double', args: ['21'] })
	// @ts-expect-error Native wire values must already be JSON-safe.
	await rpc.request({ method: 'anvil_setBalance', params: [address, 42n] })
	return [result, directResult, wrongResult]
}
void assertContractTypes
