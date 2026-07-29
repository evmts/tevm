import { createAddress } from '@tevm/address'
import { ForkError, InternalError, InvalidParamsError } from '@tevm/errors'
import { bytesToHex, hexToBytes, setLengthLeft } from '@tevm/utils'
import { cloneVmWithBlockTag } from '../Call/cloneVmWithBlock.js'
import { getPendingClient } from '../internal/getPendingClient.js'
import { asLightSelector, ensureLightReady, getLightProof } from './lightClientRead.js'

/**
 * Canonicalizes a storage slot key or value to a 32-byte left-padded hex string.
 * viem's `bytesToHex`/`hexToBytes` with `{ size: 32 }` pad on the RIGHT which
 * produces non-canonical storage words (and wrong slot keys) diverging from anvil/geth.
 * @param {import('@tevm/utils').Hex} hex
 * @returns {import('@tevm/utils').Hex}
 * @throws {InvalidParamsError} if the hex value is longer than 32 bytes
 * @example
 * ```ts
 * import { padStorageWord } from './getStorageAtHandler.js' // internal helper
 * // '0x1' becomes '0x0000000000000000000000000000000000000000000000000000000000000001'
 * ```
 */
const padStorageWord = (hex) => {
	const bytes = hexToBytes(hex)
	if (bytes.length > 32) {
		throw new InvalidParamsError(
			`Storage slot must be 32 bytes or less. Received ${bytes.length} bytes for value ${hex}.`,
		)
	}
	return bytesToHex(setLengthLeft(bytes, 32))
}

/**
 * @param {import('@tevm/node').TevmNode} client
 * @returns {import('./EthHandler.js').EthGetStorageAtHandler}
 */
export const getStorageAtHandler = (client) => async (params) => {
	const normalizedPosition = padStorageWord(params.position)
	if (client.consensus?.mode === 'light-client') {
		ensureLightReady(client, 'eth_getStorageAt')
		const selector = asLightSelector(params.blockTag ?? 'latest')
		const { proof } = await getLightProof(client, params.address, [normalizedPosition], selector)
		const hit = proof.storageProof.find(
			/** @param {{ key: import('@tevm/utils').Hex, value?: import('@tevm/utils').Hex }} entry */
			(entry) => padStorageWord(entry.key) === normalizedPosition,
		)
		if (!hit) throw new Error('LIGHT_CLIENT_MALFORMED_UPSTREAM_PROOF: requested storage key missing from proof payload')
		return padStorageWord(hit.value ?? '0x')
	}
	const vm = await client.getVm()
	const tag = params.blockTag ?? 'latest'
	if (tag === 'pending') {
		const mineResult = await getPendingClient(client)
		if (mineResult.errors) {
			throw mineResult.errors[0]
		}
		return getStorageAtHandler(mineResult.pendingClient)({ ...params, blockTag: 'latest' })
	}
	if (tag === 'latest') {
		const value = await vm.stateManager.getStorage(createAddress(params.address), hexToBytes(normalizedPosition))
		return bytesToHex(setLengthLeft(value, 32))
	}
	const block = await vm.blockchain.getBlockByTag(tag)
	const clonedVm = await cloneVmWithBlockTag(client, block)

	if (clonedVm instanceof ForkError || clonedVm instanceof InternalError) {
		throw clonedVm
	}

	return getStorageAtHandler({ ...client, getVm: () => Promise.resolve(clonedVm) })({ ...params, blockTag: 'latest' })
}
