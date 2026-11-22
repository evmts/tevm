import { createZevmEngine } from '@tevm/node'

const engine = createZevmEngine()
const readyPromise = engine.ready()

/**
 * Coverage-guided LibFuzzer target for the native ZEVM Node-API JSON-RPC boundary.
 * Asserts the native addon never crashes, never hangs, and always returns either
 * null (notification) or a valid JSON-RPC 2.0 response string.
 * @param {Buffer} data
 */
export async function fuzz(data) {
	await readyPromise
	const input = data.toString('utf8')
	const raw = await engine.rpc(input)
	if (raw === null) return
	const parsed = JSON.parse(raw)
	const items = Array.isArray(parsed) ? parsed : [parsed]
	for (const item of items) {
		if (!item || typeof item !== 'object' || item.jsonrpc !== '2.0') {
			throw new Error(`Invalid JSON-RPC envelope: ${raw}`)
		}
		const hasResult = 'result' in item
		const hasError = 'error' in item
		if (hasResult === hasError) {
			throw new Error(`Response must have XOR(result, error): ${raw}`)
		}
		if (hasError && (!Number.isInteger(item.error?.code) || typeof item.error?.message !== 'string')) {
			throw new Error(`Malformed JSON-RPC error object: ${raw}`)
		}
	}
}
