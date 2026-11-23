import { EventEmitter } from 'node:events'
import { FuzzedDataProvider } from '@jazzer.js/core'
import { ReadRequestBodyError } from '../../../packages/server/src/errors/ReadRequestBodyError.js'
import { getRequestBody } from '../../../packages/server/src/internal/getRequestBody.js'

/**
 * Coverage-guided LibFuzzer target for getRequestBody enforcing maxBodySize
 * across arbitrary UTF-8 byte splits and trailing incomplete multibyte sequences.
 * @param {Buffer} data
 */
export async function fuzz(data) {
	if (data.length < 2) return
	const provider = new FuzzedDataProvider(data)
	const maxBodySize = provider.consumeIntegralInRange(0, 128)
	const splitOffset = provider.consumeIntegralInRange(0, 255)
	const payload = Buffer.from(provider.consumeRemainingAsBytes())

	const decodedExpected = payload.toString('utf8')

	const req = new EventEmitter()
	req.pause = () => {}
	const promise = getRequestBody(req, { maxBodySize })

	if (payload.length > 1) {
		const cut = Math.max(1, Math.min(payload.length - 1, splitOffset % payload.length))
		req.emit('data', payload.subarray(0, cut))
		req.emit('data', payload.subarray(cut))
	} else if (payload.length === 1) {
		req.emit('data', payload)
	}
	req.emit('end')

	const res = await promise
	if (payload.length > maxBodySize) {
		if (!(res instanceof ReadRequestBodyError) || res.kind !== 'oversized') {
			throw new Error(`Expected oversized for ${payload.length} wire bytes with maxBodySize=${maxBodySize}`)
		}
	} else if (res !== decodedExpected) {
		throw new Error(`Decoded body mismatch for maxBodySize=${maxBodySize}`)
	}
}
