import type { Contract } from '@tevm/contract'
import { type Address, type Hex } from '@tevm/utils'
import { type Predeploy } from './Predeploy.js'

/**
 * Defines an addressed contract whose runtime code can be installed in native state
 * @example
 * ```ts
 * import { definePredeploy } from 'tevm/predeploys'
 * import { createMemoryClient } from 'tevm'
 * import { createContract } from 'tevm/contract'
 *
 * const predeploy = definePredeploy(
 *   createContract({
 *     name: 'PredeployExample',
 *     humanReadableAbi: ['function foo() external pure returns (uint256)'],
 *     bytecode: '0x600a600c600039600a6000f3602a60005260206000f3',
 *     deployedBytecode: '0x602a60005260206000f3',
 *   }).withAddress(`0x${'23'.repeat(20)}`),
 * )
 *
 * const client = createMemoryClient()
 * await client.tevmSetAccount({
 *   address: predeploy.contract.address,
 *   deployedBytecode: predeploy.contract.deployedBytecode,
 * })
 * await client.tevmClose()
 * ```
 */
export type DefinePredeployFn = <TName extends string, THumanReadableAbi extends readonly string[]>(
	contract: Contract<TName, THumanReadableAbi, Address, Hex, Hex>,
) => Predeploy<TName, THumanReadableAbi>
