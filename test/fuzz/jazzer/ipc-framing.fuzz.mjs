import { FuzzedDataProvider } from '@jazzer.js/core'
import { extractJsonRpcFrames } from '../../../packages/server/src/internal/extractJsonRpcFrames.js'

/**
 * Coverage-guided LibFuzzer target verifying extractJsonRpcFrames never throws
 * and satisfies exact chunk-splitting invariance on arbitrary UTF-8 streams.
 * @param {Buffer} data
 */
export function fuzz(data) {
	const provider = new FuzzedDataProvider(data)
	const cutCount = provider.consumeIntegralInRange(0, 6)
	const cutFractions = []
	for (let i = 0; i < cutCount; i++) {
		cutFractions.push(provider.consumeIntegralInRange(0, 255))
	}
	const stream = provider.consumeRemainingAsString()
	const [singleFrames, singleRem] = extractJsonRpcFrames(stream)

	if (stream.length < 2 || cutFractions.length === 0) return

	const cuts = [
		...new Set(
			cutFractions.map((f) => Math.floor((f / 256) * stream.length)).filter((c) => c > 0 && c < stream.length),
		),
	].sort((a, b) => a - b)

	let buf = ''
	const chunkedFrames = []
	let prev = 0
	for (const cut of cuts) {
		buf += stream.slice(prev, cut)
		const [frames, rem] = extractJsonRpcFrames(buf)
		chunkedFrames.push(...frames)
		buf = rem
		prev = cut
	}
	buf += stream.slice(prev)
	const [lastFrames, lastRem] = extractJsonRpcFrames(buf)
	chunkedFrames.push(...lastFrames)
	buf = lastRem

	if (chunkedFrames.length !== singleFrames.length || buf !== singleRem) {
		throw new Error(`Chunk invariance violated for input ${JSON.stringify(stream)}`)
	}
	for (let i = 0; i < singleFrames.length; i++) {
		if (chunkedFrames[i] !== singleFrames[i]) {
			throw new Error(`Frame mismatch at index ${i} for input ${JSON.stringify(stream)}`)
		}
	}
}
