import { toHex } from 'viem'

/**
 * Mine native blocks, optionally advancing time between blocks in seconds.
 * @param {import('./TevmActions.js').RpcClient} client
 * @param {import('./TevmActions.js').MineParams} [params]
 * @returns {Promise<import('@tevm/node').JsonValue>}
 */
export function tevmMine(client, { blocks = 1, interval = 1 } = {}) {
	return client.request({ method: 'anvil_mine', params: [toHex(blocks), toHex(interval)] })
}
