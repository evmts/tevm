import assert from 'node:assert/strict'
import { FuzzedDataProvider } from '@jazzer.js/core'
import { ParseJsonError, parseJson } from '@tevm/effect'
import { parseUri } from '@tevm/whatsabi'
import { InvalidAddressError } from 'viem'
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
		let expected
		try {
			expected = JSON.parse(text)
		} catch (error) {
			if (!(error instanceof SyntaxError)) throw error
		}
		if (expected !== undefined) {
			assert.equal(exit._tag, 'Success')
			assert.deepEqual(exit.value, expected)
		} else if (exit._tag === 'Success') {
			// JSONC also accepts comments and trailing commas.
			assert.notEqual(exit.value, undefined)
		} else {
			assert.equal(exit._tag, 'Failure')
			assert.equal(exit.cause._tag, 'Fail')
			assert.ok(exit.cause.error instanceof ParseJsonError)
		}
	} else {
		let parsed
		try {
			parsed = parseUri(text)
		} catch (error) {
			if (error instanceof InvalidAddressError) return
			throw error
		}
		if (parsed !== undefined) {
			assert.ok(Number.isSafeInteger(parsed.chainId))
			assert.match(parsed.address, /^0x[0-9a-fA-F]{40}$/)
		}
	}
}
