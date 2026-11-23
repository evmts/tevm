import { FuzzedDataProvider } from '@jazzer.js/core'
import { createSessionManager, executeTool, toJsonValue } from '@tevm/mcp'

const sessions = createSessionManager()

/**
 * Coverage-guided LibFuzzer target for @tevm/mcp:
 * - toJsonValue must always emit strictly JSON-serializable output
 * - executeTool must cleanly reject arbitrary untrusted tool names and malformed inputs
 * @param {Buffer} data
 */
export async function fuzz(data) {
	const provider = new FuzzedDataProvider(data)
	const mode = provider.consumeIntegralInRange(0, 1)

	if (mode === 0) {
		const big = provider.consumeBigIntegral(16, true)
		const bytes = Uint8Array.from(provider.consumeBytes(32))
		const label = provider.consumeRemainingAsString()
		const payload = {
			big,
			bytes,
			nested: new Map([
				[label, new Set([big, label])],
				['err', new Error(label)],
			]),
		}
		const converted = toJsonValue(payload)
		const json = JSON.stringify(converted)
		if (typeof json !== 'string') {
			throw new Error('toJsonValue output was not JSON serializable')
		}
		return
	}

	const toolName = provider.consumeString(32)
	const raw = provider.consumeRemainingAsString()
	let parsed = raw
	try {
		parsed = JSON.parse(raw)
	} catch {
		// Pass raw string directly to stress schema boundary validation.
	}
	if (toolName === 'evm_create_session') return
	try {
		await executeTool(toolName, parsed, sessions)
	} catch (error) {
		if (!(error instanceof Error)) {
			throw new Error(`executeTool threw non-Error: ${String(error)}`)
		}
	}
}
