import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { ReadRequestBodyError } from '../errors/ReadRequestBodyError.js'
import { getRequestBody } from './getRequestBody.js'

describe('getRequestBody', () => {
	it('should read request body from http request with on method', async () => {
		const req = {
			on: (event: string, callback: any) => {
				if (event === 'data') {
					callback(Buffer.from('{"data":"test"}'))
				}
				if (event === 'end') {
					setTimeout(() => callback(), 1)
				}
				return req
			},
		}

		const result = await getRequestBody(req as any)
		expect(result).toBe('{"data":"test"}')
	})

	it('should handle error events from request', async () => {
		const req = {
			on: (event: string, callback: any) => {
				if (event === 'error') {
					setTimeout(() => callback(new Error('test error')), 1)
				}
				return req
			},
		}

		const result = await getRequestBody(req as any)
		expect(result).toBeInstanceOf(ReadRequestBodyError)
	})

	it('should read request body from request with body property', async () => {
		const req = {
			body: '{"data":"test"}',
		}

		const result = await getRequestBody(req as any)
		expect(result).toBe('{"data":"test"}')
	})

	it('should handle invalid request object with no body or on method', async () => {
		const req = {}

		const result = await getRequestBody(req as any)
		expect(result).toBeInstanceOf(ReadRequestBodyError)
		if (result instanceof ReadRequestBodyError) {
			expect(result.message).toContain('Request object is not a valid stream')
		}
	})
})

it('normalizes parsed framework bodies without losing JSON wire values', async () => {
	expect(await getRequestBody({ body: Buffer.from('{"id":null}') })).toBe('{"id":null}')
	expect(await getRequestBody({ body: { id: null } })).toBe('{"id":null}')
	expect(await getRequestBody({ body: 1n })).toBeInstanceOf(Error)
	expect(await getRequestBody({ body: () => {} })).toBeInstanceOf(Error)
	expect(await getRequestBody({ body: 'é' }, { maxBodySize: 1 })).toBeInstanceOf(ReadRequestBodyError)
})

it('preserves UTF-8 split across stream chunks', async () => {
	const stream = new PassThrough()
	const result = getRequestBody(stream as never)
	const bytes = Buffer.from('{"id":"€"}')
	stream.write(bytes.subarray(0, 8))
	stream.end(bytes.subarray(8))
	expect(await result).toBe('{"id":"€"}')
})

it('reads streams that already decode text', async () => {
	const stream = new PassThrough()
	stream.setEncoding('utf8')
	const result = getRequestBody(stream as never)
	stream.end('null')
	expect(await result).toBe('null')
})

it('enforces maxBodySize when trailing incomplete UTF-8 bytes flush on stream end', async () => {
	const stream = new PassThrough()
	const result = getRequestBody(stream as never, { maxBodySize: 0 })
	stream.end(Buffer.from([0xc0]))
	expect(await result).toBeInstanceOf(ReadRequestBodyError)
})

it('counts UTF-8 bytes across chunks, stops immediately when maxBodySize is exceeded, and decodes large multi-chunk Unicode bodies', async () => {
	// '€' is 3 UTF-8 bytes; two chunks of 2 chars = 12 bytes > maxBodySize 10.
	const oversized = new PassThrough()
	const oversizedPromise = getRequestBody(oversized as never, { maxBodySize: 10 })
	oversized.write(Buffer.from('€€'))
	oversized.write(Buffer.from('€€'))
	// Resolves with ReadRequestBodyError immediately without waiting for stream.end().
	expect(await oversizedPromise).toBeInstanceOf(ReadRequestBodyError)

	// Multi-chunk 64 KB Unicode payload decodes losslessly.
	const stream = new PassThrough()
	const decodedPromise = getRequestBody(stream as never)
	const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, params: ['€'.repeat(20_000)] })
	const bytes = Buffer.from(payload, 'utf8')
	for (let offset = 0; offset < bytes.length; offset += 1024) {
		stream.write(bytes.subarray(offset, offset + 1024))
	}
	stream.end()
	expect(await decodedPromise).toBe(payload)
})

it.each(['aborted', 'close'])('settles a partial stream on %s and absorbs late errors', async (event) => {
	const stream = new PassThrough()
	const body = getRequestBody(stream as never)
	stream.write('{')
	stream.emit(event)
	expect(await body).toMatchObject({ kind: 'read_error' })
	expect(() => stream.emit('error', new Error('socket reset'))).not.toThrow()
	stream.destroy()
})

it('classifies body failures and decodes precisely the supplied byte view', async () => {
	const bytes = new TextEncoder().encode('a"é"b').subarray(1, 5)
	expect(await getRequestBody({ body: bytes }, { maxBodySize: 4 })).toBe('"é"')
	expect(await getRequestBody({ body: bytes }, { maxBodySize: 3 })).toMatchObject({ kind: 'oversized' })
	expect(await getRequestBody({ body: 1n })).toMatchObject({ kind: 'invalid' })
	const stream = new PassThrough()
	const result = getRequestBody(stream as never, { maxBodySize: 1 })
	stream.write('ab')
	expect(await result).toMatchObject({ kind: 'oversized' })
	expect(() => stream.emit('error', new Error('late error'))).not.toThrow()
	stream.destroy()
})

it('returns a read error for a stream that was already consumed instead of hanging', async () => {
	const req = new PassThrough()
	req.end('{"jsonrpc":"2.0"}')
	// Another body reader drains the stream first, as un-configured middleware does.
	for await (const _chunk of req) {
		// Discard.
	}
	expect(req.readableEnded).toBe(true)
	const listeners = () => ['data', 'end', 'error', 'close', 'aborted'].map((event) => req.listenerCount(event))
	const before = listeners()
	const result = await Promise.race([
		getRequestBody(req as any),
		new Promise((resolve) => setTimeout(() => resolve('hung'), 100)),
	])
	expect(result).toBeInstanceOf(ReadRequestBodyError)
	expect((result as ReadRequestBodyError).kind).toBe('read_error')
	expect((result as ReadRequestBodyError).message).toMatch(/already consumed/)
	// No listener is left behind on the dead stream.
	expect(listeners()).toEqual(before)
})
