import { FuzzedDataProvider } from '@jazzer.js/core'
import { parseJson } from '@tevm/effect'
import { parseUri } from '@tevm/whatsabi'
import { runPromiseExit } from '../../../packages/effect/node_modules/effect/dist/esm/Effect.js'

/**
 * Coverage-guided LibFuzzer target for TEVM bundler/utility parsers:
 * @tevm/effect parseJson (JSONC) and @tevm/whatsabi parseUri.
 * @param {Buffer} data
 */
export async function fuzz(data) {
	const provider = new FuzzedDataProvider(data)
	const mode = provider.consumeIntegralInRange(0, 1)
	const text = provider.consumeRemainingAsString()

	if (mode === 0) {
		const exit = await runPromiseExit(parseJson(text))
		if (exit._tag !== 'Success' && exit._tag !== 'Failure') {
			throw new Error(`Unexpected Effect exit tag: ${String(exit._tag)}`)
		}
	} else {
		try {
			const parsed = parseUri(text)
			if (parsed !== undefined) {
				if (!Number.isInteger(parsed.chainId) || !/^0x[0-9a-fA-F]{40}$/.test(parsed.address)) {
					throw new Error(`Invalid parsed URI: ${JSON.stringify(parsed)}`)
				}
			}
		} catch (err) {
			if (!(err instanceof Error)) {
				throw new Error(`Non-Error thrown by parseUri: ${String(err)}`)
			}
		}
	}
}
