import type { Abi, Address, ContractFunctionArgs, ContractFunctionName, ContractFunctionReturnType } from 'viem'
import type { CallParams, CallResult } from './TevmActions.js'

/** A contract action bound to a native client. */
export type BoundTevmContract = <const TAbi extends Abi, TName extends ContractFunctionName<TAbi>>(
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
