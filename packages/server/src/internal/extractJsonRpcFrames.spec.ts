import { describe, expect, it } from 'vitest'
import { createJsonRpcFrameExtractor, extractJsonRpcFrames } from './extractJsonRpcFrames.js'

describe('IPC framing', () => {
	it('preserves escaped quotes, backslashes and braces inside strings', () => {
		const frame = JSON.stringify({ jsonrpc: '2.0', id: '"\\}[]{', method: 'eth_chainId' })
		expect(extractJsonRpcFrames(` \n${frame}[${frame}] {"partial":`)).toEqual([[frame, `[${frame}]`], '{"partial":'])
	})
	it('forwards newline-delimited malformed and scalar JSON to the native validator', () => {
		expect(extractJsonRpcFrames('bad\nnull\n123')).toEqual([['bad', 'null'], '123'])
		expect(extractJsonRpcFrames(' \t')).toEqual([[], ''])
		expect(extractJsonRpcFrames('{}\n')).toEqual([['{}'], ''])
	})
	it('preserves non-JSON newline-delimited frames and JSON frames split across incremental extractor chunks', () => {
		const extractor = createJsonRpcFrameExtractor()
		// Non-JSON prefix split before the terminating newline must be emitted intact, not truncated or dropped.
		expect(extractor.push('  ba')).toEqual([])
		expect(extractor.remaining()).toBe('ba')
		expect(extractor.push('d')).toEqual([])
		expect(extractor.remaining()).toBe('bad')
		expect(extractor.push('\n')).toEqual(['bad'])
		expect(extractor.remaining()).toBe('')

		// Concatenated JSON frames with escaped strings plus another split malformed line.
		const f1 = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: ['a\\"b}{c'] })
		const f2 = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber' })
		const wire = `${f1}${f2}invalid\n{"incomplete":true`
		const extracted: Array<string> = []
		for (let i = 0; i < wire.length; i += 7) {
			extracted.push(...extractor.push(wire.slice(i, i + 7)))
		}
		expect(extracted).toEqual([f1, f2, 'invalid'])
		expect(extractor.remaining()).toBe('{"incomplete":true')
	})
})
