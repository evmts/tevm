import { StringDecoder } from 'node:string_decoder'
import { InvalidRequestError } from '@tevm/errors'
import { ReadRequestBodyError } from '../errors/ReadRequestBodyError.js'

const bodySizeErrorMessage = 'Request body exceeds configured max body size'

/**
 * @param {unknown} body
 * @returns {string | InvalidRequestError}
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
		return new InvalidRequestError('Request body must be JSON serializable', { cause: err })
	}
	return new InvalidRequestError('Request body must be a JSON string, Buffer, or JSON-serializable value')
}

/**
 * Gets request body from an http request.
 * @param {import('http').IncomingMessage|{body: unknown}} req The request object
 * @param {{ maxBodySize?: number }} [options] Maximum UTF-8 body size in bytes (before decoding binary input)
 * @returns {Promise<string | ReadRequestBodyError | InvalidRequestError>} Request body as a promise
 * @throws {never} returns errors as value
 */
export const getRequestBody = (req, options = {}) => {
	const { maxBodySize = Number.POSITIVE_INFINITY } = options
	// If the request already has a body property, return it
	if ('body' in req && req.body !== undefined) {
		if (Buffer.isBuffer(req.body)) {
			return Promise.resolve(
				req.body.length > maxBodySize ? new ReadRequestBodyError(bodySizeErrorMessage) : req.body.toString('utf8'),
			)
		}
		const body = normalizeBody(req.body)
		if (body instanceof InvalidRequestError) {
			return Promise.resolve(body)
		}
		if (Buffer.byteLength(body, 'utf8') > maxBodySize) {
			return Promise.resolve(new ReadRequestBodyError(bodySizeErrorMessage))
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
					req.removeListener('error', onError)
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
					finish(new ReadRequestBodyError(bodySizeErrorMessage))
					return
				}
				body += typeof chunk === 'string' ? decoder.end() + chunk : decoder.write(chunk)
			}
			const onEnd = () => {
				finish(receivedBytes > maxBodySize ? new ReadRequestBodyError(bodySizeErrorMessage) : body + decoder.end())
			}

			req.on('error', onError)
			req.on('data', onData)
			req.on('end', onEnd)
		} else {
			// Should never happen, but needed for type safety
			resolve(new ReadRequestBodyError('Request object is not a valid stream', {}))
		}
	})
}
