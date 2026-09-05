import {
	tevmCall,
	tevmContract,
	tevmDeal,
	tevmDeploy,
	tevmDumpState,
	tevmGetAccount,
	tevmLoadState,
	tevmMine,
	tevmSetAccount,
} from '@tevm/actions'
import { tevmReady } from './tevmReady.js'

/** Attach native TEVM actions to a viem client using createTevmTransport. */
export function tevmViemActions() {
	/** @param {import('viem').Client<import('viem').Transport<'tevm', {tevm: import('@tevm/node').ZevmEngine}>>} client */
	return (client) => {
		const rpc = client.transport.tevm
		return {
			tevmReady: () => tevmReady(client),
			tevmClose: () => client.transport.tevm.close(),
			/** @param {import('@tevm/actions').CallParams} params */
			tevmCall: (params) => tevmCall(rpc, params),
			tevmContract: /** @type {import('@tevm/actions').BoundTevmContract} */ ((params) => tevmContract(rpc, params)),
			/** @param {import('@tevm/actions').DeployParams} params */
			tevmDeploy: (params) => tevmDeploy(rpc, params),
			/** @param {import('@tevm/actions').SetAccountParams} params */
			tevmSetAccount: (params) => tevmSetAccount(rpc, params),
			/** @param {import('@tevm/actions').GetAccountParams} params */
			tevmGetAccount: (params) => tevmGetAccount(rpc, params),
			/** @param {import('@tevm/actions').MineParams} [params] */
			tevmMine: (params) => tevmMine(rpc, params),
			tevmDumpState: () => tevmDumpState(rpc),
			/** @param {import('viem').Hex} state */
			tevmLoadState: (state) => tevmLoadState(rpc, state),
			/** @param {{address: import('viem').Address; amount: bigint}} params */
			tevmDeal: (params) => tevmDeal(rpc, params),
		}
	}
}
