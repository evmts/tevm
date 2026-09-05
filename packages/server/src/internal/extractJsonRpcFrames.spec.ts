import { describe, expect, it } from 'vitest'
import { extractJsonRpcFrames } from './extractJsonRpcFrames.js'

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
})
