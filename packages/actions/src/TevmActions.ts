import type { EngineRequest, JsonValue } from '@tevm/node'
import type { Abi, Address, ContractFunctionArgs, ContractFunctionName, ContractFunctionReturnType, Hex } from 'viem'

/** Minimal client interface for tree-shakeable native RPC actions. */
export type RpcClient = { request: (request: EngineRequest) => Promise<JsonValue> }
/** Native call parameters. State overrides use the standard eth_call wire shape. */
export type CallParams = {
	to?: Address
	from?: Address
	data?: Hex
	value?: bigint
	gas?: bigint
	gasPrice?: bigint
	maxFeePerGas?: bigint
	maxPriorityFeePerGas?: bigint
	nonce?: bigint
	blockTag?: string
	stateOverride?: Record<string, JsonValue>
	addToMempool?: boolean
	addToBlockchain?: boolean
}
/** Simulation output or the hash of a submitted transaction. */
export type CallResult = { rawData: Hex; txHash?: Hex; receipt?: JsonValue }
/** Account fields to update in native state. Unspecified fields are preserved. */
export type SetAccountParams = {
	address: Address
	balance?: bigint
	nonce?: bigint
	deployedBytecode?: Hex
	storage?: Record<Hex, Hex>
}
export type GetAccountParams = { address: Address }
export type GetAccountResult = {
	address: Address
	balance: bigint
	nonce: bigint
	deployedBytecode: Hex
	storage: Record<Hex, Hex>
}
export type MineParams = { blocks?: number; interval?: number }
export type DeployParams = Omit<CallParams, 'to' | 'data'> & { abi?: Abi; bytecode: Hex; args?: readonly unknown[] }
/** ABI-aware contract call preserving the function's return type. */
export type TevmContract = <const TAbi extends Abi, TName extends ContractFunctionName<TAbi>>(
	client: RpcClient,
	params: Omit<CallParams, 'to' | 'data'> & {
		abi: TAbi
		functionName: TName
		args?: ContractFunctionArgs<TAbi, 'pure' | 'view' | 'nonpayable' | 'payable', TName>
		to?: Address
		address?: Address
	},
) => Promise<
	CallResult & { data?: ContractFunctionReturnType<TAbi, 'pure' | 'view' | 'nonpayable' | 'payable', TName> }
>
