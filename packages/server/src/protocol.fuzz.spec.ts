import type { IncomingMessage } from 'node:http'
import { PassThrough } from 'node:stream'
import { StringDecoder } from 'node:string_decoder'
import fc from 'fast-check'
import { expect, it } from 'vitest'
import { ReadRequestBodyError } from './errors/ReadRequestBodyError.js'
import { extractJsonRpcFrames } from './internal/extractJsonRpcFrames.js'
import { getRequestBody } from './internal/getRequestBody.js'

const options = {
	seed: Number(process.env['FUZZ_SEED'] ?? 20261122),
	numRuns: Number(process.env['FUZZ_RUNS'] ?? 300),
}
if (!Number.isSafeInteger(options.seed) || !Number.isSafeInteger(options.numRuns) || options.numRuns < 1)
	throw new Error('FUZZ_SEED must be an integer and FUZZ_RUNS must be a positive integer')

const multibyte = fc.oneof(
	fc.constantFrom('é', '€', '漢', '🦊', '\u0301'),
	fc
		.oneof(fc.integer({ min: 0x80, max: 0xd7ff }), fc.integer({ min: 0xe000, max: 0x10ffff }))
		.map((point) => String.fromCodePoint(point)),
)
const text = fc
	.array(
		fc.oneof(multibyte, fc.constantFrom('"', '\\', '\n', '\r', '\t', '{', '}', '[', ']'), fc.string({ maxLength: 3 })),
		{ maxLength: 12 },
	)
	.map((parts) => parts.join(''))
const widths = fc.array(fc.integer({ min: 1, max: 64 }), { minLength: 1, maxLength: 12 })
function* chunks(bytes: Buffer, sizes: number[]) {
	let offset = 0
	let index = 0
	while (offset < bytes.length) {
		const end = offset + sizes[index++ % sizes.length]!
		yield bytes.subarray(offset, end)
		offset = end
	}
}

const request = fc.record({
	jsonrpc: fc.constant('2.0'),
	id: fc.oneof(fc.integer(), text, fc.constant(null)),
	method: fc.constantFrom('eth_call', 'eth_getLogs', 'eth_chainId'),
	params: fc.tuple(fc.record({ topics: fc.array(text, { maxLength: 3 }) }), text, multibyte),
})
const frame = fc
	.tuple(fc.oneof(request, fc.array(request, { minLength: 1, maxLength: 3 })), fc.boolean())
	.map(([value, pretty]) => JSON.stringify(value, null, pretty ? 1 : undefined))

it('emits the exact object and batch frames under arbitrary UTF-8 byte partitions', () => {
	fc.assert(
		fc.property(
			fc.array(fc.tuple(fc.constantFrom('', ' ', '\r\n', '\t'), frame), { maxLength: 5 }),
			widths,
			fc.option(text),
			(parts, sizes, tail) => {
				const expected = parts.map(([, value]) => value)
				const incomplete = tail === null ? '' : `{"tail":${JSON.stringify(tail)}`
				const bytes = Buffer.from(parts.map(([space, value]) => space + value).join('') + incomplete)
				for (const partition of [sizes, [1], [bytes.length]]) {
					const decoder = new StringDecoder('utf8')
					const actual: string[] = []
					let remainder = ''
					for (const chunk of chunks(bytes, partition)) {
						const [frames, next] = extractJsonRpcFrames(remainder + decoder.write(chunk))
						actual.push(...frames)
						remainder = next
					}
					expect(actual).toEqual(expected)
					expect(remainder + decoder.end()).toBe(incomplete)
				}
			},
		),
		options,
	)
})

async function readChunks(bytes: Buffer, sizes: number[], maxBodySize: number, asText = false) {
	const stream = new PassThrough()
	if (asText) stream.setEncoding('utf8')
	try {
		const result = getRequestBody(stream as unknown as IncomingMessage, { maxBodySize })
		for (const chunk of chunks(bytes, sizes)) stream.write(chunk)
		stream.end()
		return await result
	} finally {
		stream.destroy()
	}
}

it('accepts exact UTF-8 bodies at or below the byte limit and rejects one byte over', async () => {
	await fc.assert(
		fc.asyncProperty(text, multibyte, widths, async (value, character, sizes) => {
			const obj = { value: character + value }
			const body = JSON.stringify(obj)
			const bytes = Buffer.from(body)
			for (const maxBodySize of [bytes.length + 1, bytes.length, bytes.length - 1]) {
				const results = await Promise.all([
					readChunks(bytes, sizes, maxBodySize),
					readChunks(bytes, [1], maxBodySize, true),
					...[bytes, body, obj].map((body) => getRequestBody({ body }, { maxBodySize })),
				])
				for (const result of results) {
					if (maxBodySize < bytes.length) expect(result).toBeInstanceOf(ReadRequestBodyError)
					else expect(result).toBe(body)
				}
			}
		}),
		options,
	)
})

it('counts the original bytes even when decoding replaces an incomplete character', async () => {
	await fc.assert(
		fc.asyncProperty(fc.uint8Array({ maxLength: 40 }), widths, async (raw, sizes) => {
			const bytes = Buffer.from(raw)
			for (const result of [
				await readChunks(bytes, sizes, bytes.length),
				await getRequestBody({ body: bytes }, { maxBodySize: bytes.length }),
			]) {
				expect(result).toBe(bytes.toString('utf8'))
			}
		}),
		options,
	)
})

it('applies the same limit to an empty stream and an empty buffered body', async () => {
	for (const maxBodySize of [-1, 0, 1]) {
		const bytes = Buffer.alloc(0)
		for (const body of [
			await readChunks(bytes, [1], maxBodySize),
			await getRequestBody({ body: bytes }, { maxBodySize }),
		]) {
			if (maxBodySize < 0) expect(body).toBeInstanceOf(ReadRequestBodyError)
			else expect(body).toBe('')
		}
	}
})

it('accepts a single malformed byte at a one-byte limit on both binary body paths', async () => {
	const bytes = Buffer.from([0x80])
	expect(await readChunks(bytes, [1], 1)).toBe('�')
	expect(await getRequestBody({ body: bytes }, { maxBodySize: 1 })).toBe('�')
})

it('pauses as soon as a partial UTF-8 character crosses the wire limit', async () => {
	const stream = new PassThrough()
	try {
		const result = getRequestBody(stream as unknown as IncomingMessage, { maxBodySize: 0 })
		stream.write(Buffer.from('é').subarray(0, 1))
		expect(stream.isPaused()).toBe(true)
		expect(await result).toBeInstanceOf(ReadRequestBodyError)
	} finally {
		stream.destroy()
	}
})

it('charges four bytes for a surrogate pair delivered in two text chunks', async () => {
	for (const maxBodySize of [3, 4]) {
		const stream = new PassThrough({ objectMode: true })
		try {
			const result = getRequestBody(stream as unknown as IncomingMessage, { maxBodySize })
			stream.write('\ud83e')
			stream.write('')
			stream.end('\udd8a')
			if (maxBodySize === 4) expect(await result).toBe('🦊')
			else expect(await result).toBeInstanceOf(ReadRequestBodyError)
		} finally {
			stream.destroy()
		}
	}
})
