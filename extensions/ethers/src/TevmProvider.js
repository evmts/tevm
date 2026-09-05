import { createMemoryClient } from '@tevm/memory-client'
import { JsonRpcApiProvider } from 'ethers'

/** Ethers provider over the native ZEVM JSON-RPC engine. */
export class TevmProvider extends JsonRpcApiProvider {
	/** @param {import('@tevm/memory-client').MemoryClientOptions} [options] */
	static async createMemoryProvider(options = {}) {
		const client = createMemoryClient(options)
		await client.tevmReady()
		return new TevmProvider(client)
	}
	/** @param {import('@tevm/memory-client').MemoryClient} client */
	constructor(client) {
		super(undefined, { batchMaxCount: 1, cacheTimeout: -1 })
		this.tevm = client
		this._start()
	}
	/** @param {import('ethers').JsonRpcPayload | import('ethers').JsonRpcPayload[]} payload
	 * @returns {Promise<Array<import('ethers').JsonRpcResult | import('ethers').JsonRpcError>>}
	 */
	async _send(payload) {
		const result = await this.tevm.transport.tevm.rpc(JSON.stringify(payload))
		if (result === null) return []
		const parsed = JSON.parse(result)
		return Array.isArray(parsed) ? parsed : [parsed]
	}
	/** Stop ethers polling and release the native engine. @override */
	destroy() {
		super.destroy()
		void this.tevm.tevmClose()
	}
}
