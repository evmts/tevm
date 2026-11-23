import { FuzzedDataProvider } from '@jazzer.js/core'
import { createJsonRpcFetcher } from '@tevm/jsonrpc'

/**
 * Coverage-guided LibFuzzer target for @tevm/jsonrpc createJsonRpcFetcher:
 * verifies it never throws and always produces a valid JSON-RPC 2.0 envelope.
 * @param {Buffer} data
 */
export async function fuzz(data) {
	const provider = new FuzzedDataProvider(data)
	const shouldThrow = provider.consumeBoolean()
	const hasId = provider.consumeBoolean()
	const id = provider.consumeIntegral(4, true)
	const method = provider.consumeString(24) || 'eth_blockNumber'
	const code = provider.consumeIntegral(4, true)
	const message = provider.consumeRemainingAsString()

	const fetcher = createJsonRpcFetcher({
		request: async () => {
			if (shouldThrow) {
				throw { code, message }
			}
			return message
		},
	})

	const response = await fetcher.request({
		method,
		...(hasId ? { id } : {}),
	})
	if (response.jsonrpc !== '2.0') {
		throw new Error(`Invalid jsonrpc version: ${String(response.jsonrpc)}`)
	}
	if (shouldThrow) {
		if (!('error' in response) || !Number.isFinite(response.error.code)) {
			throw new Error(`Malformed error response: ${JSON.stringify(response)}`)
		}
	} else if (!('result' in response)) {
		throw new Error(`Missing result field: ${JSON.stringify(response)}`)
	}
}
