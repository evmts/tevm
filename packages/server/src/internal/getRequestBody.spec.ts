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
