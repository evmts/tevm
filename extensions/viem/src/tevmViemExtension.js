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

/** Extend any local or remote viem client with native TEVM RPC helpers. */
export function tevmViemExtension() {
	/** @param {import('viem').Client} client */
	return (client) => {
		const rpc = /** @type {import('@tevm/actions').RpcClient} */ (client)
		const tevm = {
			/** @param {import('@tevm/actions').CallParams} params */
			call: (params) => tevmCall(rpc, params),
			contract: /** @type {import('@tevm/actions').BoundTevmContract} */ ((params) => tevmContract(rpc, params)),
			/** @param {import('@tevm/actions').DeployParams} params */
			deploy: (params) => tevmDeploy(rpc, params),
			/** @param {import('@tevm/actions').GetAccountParams} params */
			getAccount: (params) => tevmGetAccount(rpc, params),
			/** @param {import('@tevm/actions').SetAccountParams} params */
			setAccount: (params) => tevmSetAccount(rpc, params),
			/** @param {import('@tevm/actions').MineParams} [params] */
			mine: (params) => tevmMine(rpc, params),
			dumpState: () => tevmDumpState(rpc),
			/** @param {import('viem').Hex} state */
			loadState: (state) => tevmLoadState(rpc, state),
			/** @param {{address: import('viem').Address; amount: bigint}} params */
			deal: (params) => tevmDeal(rpc, params),
		}
		return {
			tevm,
			tevmCall: tevm.call,
			tevmContract: tevm.contract,
			tevmDeploy: tevm.deploy,
			tevmGetAccount: tevm.getAccount,
			tevmSetAccount: tevm.setAccount,
			tevmMine: tevm.mine,
			tevmDumpState: tevm.dumpState,
			tevmLoadState: tevm.loadState,
			tevmDeal: tevm.deal,
		}
	}
}
