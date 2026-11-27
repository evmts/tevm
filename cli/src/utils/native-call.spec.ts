import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { nativeCallOptions } from './native-call-options.js'
import { nativeCallParams } from './native-call-params.js'
import { parseCliAbi } from './parse-cli-abi.js'

describe('nativeCallParams, nativeCallOptions, and parseCliAbi', () => {
	describe('nativeCallParams', () => {
		it('omits unset options and returns empty object for empty input', () => {
			expect(nativeCallParams({})).toEqual({})
		})

		it('converts decimal and hex quantity strings to bigint and preserves address/data fields', () => {
			const params = nativeCallParams({
				to: '0x0000000000000000000000000000000000000042',
				from: '0x0000000000000000000000000000000000000001',
				data: '0x12345678',
				blockTag: 'latest',
				value: '1000000000000000000',
				gas: '0x5208',
				gasPrice: '20000000000',
				maxFeePerGas: '30000000000',
				maxPriorityFeePerGas: '1000000000',
				nonce: '7',
				submit: true,
				queue: false,
			})

			expect(params).toEqual({
				to: '0x0000000000000000000000000000000000000042',
				from: '0x0000000000000000000000000000000000000001',
				data: '0x12345678',
				blockTag: 'latest',
				value: 1000000000000000000n,
				gas: 21000n,
				gasPrice: 20000000000n,
				maxFeePerGas: 30000000000n,
				maxPriorityFeePerGas: 1000000000n,
				nonce: 7n,
				addToBlockchain: true,
			})
		})

		it('ignores empty string quantities and maps queue flag to addToMempool', () => {
			const params = nativeCallParams({
				value: '',
				gas: '',
				queue: true,
			})
			expect(params).toEqual({ addToMempool: true })
		})
	})

	describe('nativeCallOptions', () => {
		it('exposes complete Zod option definitions including common flags', () => {
			const opts = nativeCallOptions()
			for (const key of [
				'to',
				'from',
				'data',
				'value',
				'gas',
				'gasPrice',
				'maxFeePerGas',
				'maxPriorityFeePerGas',
				'nonce',
				'blockTag',
				'submit',
				'queue',
				'local',
				'run',
				'rpc',
				'json',
				'session',
			]) {
				expect(opts).toHaveProperty(key)
			}
			expect(opts.submit.parse(undefined)).toBe(false)
			expect(opts.queue.parse(undefined)).toBe(false)
			expect(opts.local.parse(undefined)).toBe(false)
		})
	})

	describe('parseCliAbi', () => {
		it('returns empty array for undefined or empty string', () => {
			expect(parseCliAbi(undefined)).toEqual([])
			expect(parseCliAbi('')).toEqual([])
		})

		it('parses inline JSON ABI arrays', () => {
			const abiJson = JSON.stringify([
				{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
			])
			const parsed = parseCliAbi(abiJson)
			expect(parsed).toHaveLength(1)
			expect(parsed[0]).toMatchObject({ type: 'function', name: 'totalSupply' })
		})

		it('reads and parses ABI arrays from a local JSON file', () => {
			const dir = mkdtempSync(join(tmpdir(), 'tevm-cli-abi-'))
			try {
				const abiFile = join(dir, 'erc20.json')
				writeFileSync(
					abiFile,
					JSON.stringify([
						{ type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
					]),
				)
				const parsed = parseCliAbi(abiFile)
				expect(parsed).toHaveLength(1)
				expect(parsed[0]).toMatchObject({ name: 'symbol' })
			} finally {
				rmSync(dir, { recursive: true, force: true })
			}
		})

		it('rejects non-array JSON payloads with a clear error', () => {
			const dir = mkdtempSync(join(tmpdir(), 'tevm-cli-abi-bad-'))
			try {
				const badFile = join(dir, 'not-array.json')
				writeFileSync(badFile, JSON.stringify({ abi: [] }))
				expect(() => parseCliAbi(badFile)).toThrow('ABI must be a JSON array')
			} finally {
				rmSync(dir, { recursive: true, force: true })
			}
		})
	})
})
