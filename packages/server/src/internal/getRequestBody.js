import { StringDecoder } from 'node:string_decoder'
import { ReadRequestBodyError } from '../errors/ReadRequestBodyError.js'

const oversized = () => new ReadRequestBodyError('Request body exceeds configured max body size', { kind: 'oversized' })
const ignoreLateError = () => {}

/**
 * @param {unknown} body
 * @returns {string | ReadRequestBodyError}
 */
const normalizeBody = (body) => {
	if (typeof body === 'string') {
		return body
	}
	try {
		const normalizedBody = JSON.stringify(body)
		if (normalizedBody !== undefined) {
			return normalizedBody
		}
	} catch (e) {
		const err = /** @type {Error} */ (e)
		return new ReadRequestBodyError('Request body must be JSON serializable', { kind: 'invalid', cause: err })
	}
	return new ReadRequestBodyError('Request body must be a JSON string, Buffer, or JSON-serializable value', {
		kind: 'invalid',
	})
}

/**
 * Gets request body from an http request.
 * @param {import('http').IncomingMessage|{body: unknown}} req The request object
 * @param {{ maxBodySize?: number }} [options] Maximum UTF-8 body size in bytes (before decoding binary input)
 * @returns {Promise<string | ReadRequestBodyError>} Request body as a promise
 * @throws {never} returns errors as value
 */
export const getRequestBody = (req, options = {}) => {
	const { maxBodySize = Number.POSITIVE_INFINITY } = options
	// If the request already has a body property, return it
	if ('body' in req && req.body !== undefined) {
		if (req.body instanceof Uint8Array) {
			return Promise.resolve(
				req.body.length > maxBodySize ? oversized() : new TextDecoder('utf-8', { ignoreBOM: true }).decode(req.body),
			)
		}
		const body = normalizeBody(req.body)
		if (body instanceof ReadRequestBodyError) {
			return Promise.resolve(body)
		}
		if (Buffer.byteLength(body, 'utf8') > maxBodySize) {
			return Promise.resolve(oversized())
		}
		return Promise.resolve(body)
	}

	// Otherwise, read from the stream
	return new Promise((resolve) => {
		let body = ''
		let receivedBytes = 0
		let endsWithHighSurrogate = false
		const decoder = new StringDecoder('utf8')
		let done = false

		if ('on' in req) {
			/** @param {string | ReadRequestBodyError} result */
			const finish = (result) => {
				if (done) {
					return
				}
				done = true
				if (typeof req.removeListener === 'function') {
					if (result instanceof ReadRequestBodyError) req.on('error', ignoreLateError)
					req.removeListener('error', onError)
					req.removeListener('aborted', onClose)
					req.removeListener('close', onClose)
					req.removeListener('data', onData)
					req.removeListener('end', onEnd)
				}
				resolve(result)
			}
			/** @param {Error} err */
			const onError = (err) => {
				finish(new ReadRequestBodyError(err.message, { cause: err }))
			}
			/** @param {Buffer | string} chunk */
			const onData = (chunk) => {
				if (done) {
					return
				}
				if (chunk.length === 0) return
				if (typeof chunk === 'string') {
					receivedBytes += Buffer.byteLength(chunk)
					// Two adjacent surrogate halves encode as a single four-byte sequence.
					if (endsWithHighSurrogate && /^[\uDC00-\uDFFF]/.test(chunk)) receivedBytes -= 2
					endsWithHighSurrogate = /[\uD800-\uDBFF]$/.test(chunk)
				} else {
					receivedBytes += chunk.length
					endsWithHighSurrogate = false
				}
				if (receivedBytes > maxBodySize) {
					if (typeof req.pause === 'function') {
						req.pause()
					}
					finish(oversized())
					return
				}
				body += typeof chunk === 'string' ? decoder.end() + chunk : decoder.write(chunk)
			}
			const onEnd = () => {
				finish(receivedBytes > maxBodySize ? oversized() : body + decoder.end())
			}

			const onClose = () => finish(new ReadRequestBodyError('Request stream closed before the body was complete'))
			// An ended stream never emits `data` or `end` again: fail now instead of waiting forever.
			if (req.readableEnded) {
				done = true
				return resolve(
					new ReadRequestBodyError(
						'Request body stream was already consumed. Pass the parsed body as `req.body`, or call the handler before another body reader.',
					),
				)
			}
			req.on('error', onError)
			req.on('aborted', onClose)
			req.on('close', onClose)
			req.on('data', onData)
			req.on('end', onEnd)
			if (req.aborted || req.destroyed) onClose()
		} else {
			// Should never happen, but needed for type safety
			resolve(new ReadRequestBodyError('Request object is not a valid stream', { kind: 'invalid' }))
		}
	})
}
