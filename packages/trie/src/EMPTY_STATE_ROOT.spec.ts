import { bytesToHex } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { EMPTY_STATE_ROOT } from './EMPTY_STATE_ROOT.js'
import { genesisStateRoot } from './index.js'

const EXPECTED_EMPTY_ROOT_HEX = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

describe('EMPTY_STATE_ROOT', () => {
	it('is the well-known keccak256(rlp(empty)) state root', () => {
		expect(bytesToHex(EMPTY_STATE_ROOT)).toBe(EXPECTED_EMPTY_ROOT_HEX)
	})

	it('returns a copy from .buffer so the underlying bytes cannot be mutated through it', () => {
		const buffer = EMPTY_STATE_ROOT.buffer
		new Uint8Array(buffer)[0] = 0
		expect(EMPTY_STATE_ROOT[0]).toBe(86)
		expect(bytesToHex(EMPTY_STATE_ROOT)).toBe(EXPECTED_EMPTY_ROOT_HEX)
	})

	it('returns a copy from .subarray so mutations of the result do not leak into the constant', () => {
		const sub = EMPTY_STATE_ROOT.subarray(0, 4)
		sub[0] = 0
		sub.fill(0)
		expect(EMPTY_STATE_ROOT[0]).toBe(86)
		expect(EMPTY_STATE_ROOT[1]).toBe(232)
		expect(bytesToHex(EMPTY_STATE_ROOT)).toBe(EXPECTED_EMPTY_ROOT_HEX)
	})

	it('throws TypeError from every mutating Uint8Array method', () => {
		expect(() => EMPTY_STATE_ROOT.copyWithin(0, 1)).toThrow(TypeError)
		expect(() => EMPTY_STATE_ROOT.fill(0)).toThrow(TypeError)
		expect(() => EMPTY_STATE_ROOT.reverse()).toThrow(TypeError)
		expect(() => EMPTY_STATE_ROOT.set([1])).toThrow(TypeError)
		expect(() => EMPTY_STATE_ROOT.sort()).toThrow(TypeError)
		expect(() => EMPTY_STATE_ROOT.copyWithin(0, 1)).toThrow('EMPTY_STATE_ROOT is immutable')
	})

	it('throws when assigning, deleting, or defining an array index through the proxy', () => {
		expect(() => {
			EMPTY_STATE_ROOT[31] = 7
		}).toThrow('EMPTY_STATE_ROOT is immutable')
		expect(() => {
			delete EMPTY_STATE_ROOT[0]
		}).toThrow('EMPTY_STATE_ROOT is immutable')
		expect(() => {
			Object.defineProperty(EMPTY_STATE_ROOT, '0', { value: 9 })
		}).toThrow('EMPTY_STATE_ROOT is immutable')
		// the bytes are untouched
		expect(bytesToHex(EMPTY_STATE_ROOT)).toBe(EXPECTED_EMPTY_ROOT_HEX)
	})

	it('treats non-canonical numeric strings as ordinary properties, not array indices', () => {
		// '01' and ' 1' fail the /^(0|[1-9]\d*)$/ test so they are allowed as custom properties
		Object.defineProperty(EMPTY_STATE_ROOT, '01', { value: 'custom', configurable: true })
		// @ts-expect-error - arbitrary property access on the proxied bytes
		expect(EMPTY_STATE_ROOT['01']).toBe('custom')
		// @ts-expect-error - operand of delete must be optional
		expect(delete EMPTY_STATE_ROOT['01']).toBe(true)
		// @ts-expect-error - property was deleted
		expect(EMPTY_STATE_ROOT['01']).toBeUndefined()
	})

	it('allows defining, assigning, and deleting non-index properties', () => {
		Object.defineProperty(EMPTY_STATE_ROOT, 'customProp', { value: 42, configurable: true, writable: true })
		// @ts-expect-error - arbitrary property access on the proxied bytes
		expect(EMPTY_STATE_ROOT.customProp).toBe(42)
		// @ts-expect-error - arbitrary property assignment on the proxied bytes
		EMPTY_STATE_ROOT.customProp = 43
		// @ts-expect-error - arbitrary property access on the proxied bytes
		expect(EMPTY_STATE_ROOT.customProp).toBe(43)
		// @ts-expect-error - operand of delete must be optional
		expect(delete EMPTY_STATE_ROOT.customProp).toBe(true)
		// @ts-expect-error - property was deleted
		expect(EMPTY_STATE_ROOT.customProp).toBeUndefined()
	})

	it('binds methods to the real bytes so detached method references still work', () => {
		// The proxy `get` trap binds functions to the target; grabbing a method
		// reference and calling it detached must not lose `this`.
		const slice = EMPTY_STATE_ROOT.slice
		expect(bytesToHex(slice())).toBe(EXPECTED_EMPTY_ROOT_HEX)
		const indexOf = EMPTY_STATE_ROOT.indexOf
		expect(indexOf(86)).toBe(0)
		expect(EMPTY_STATE_ROOT.join(',').split(',').map(Number)).toEqual(Array.from(EMPTY_STATE_ROOT))
	})
})

describe('genesisStateRoot', () => {
	it('computes a deterministic non-empty root that differs from EMPTY_STATE_ROOT', async () => {
		const state = { '0x0000000000000000000000000000000000000001': '0xde0b6b3a7640000' } as const
		const root1 = await genesisStateRoot(state)
		const root2 = await genesisStateRoot(state)
		expect(bytesToHex(root1)).toBe(bytesToHex(root2))
		expect(bytesToHex(root1)).not.toBe(EXPECTED_EMPTY_ROOT_HEX)
		// pinned so a regression in trie construction or hashing is caught
		expect(bytesToHex(root1)).toBe('0x176a3fe6cfe66b3061f2f8750206530da568ca5be992641af0d1fe227156159f')
	})
})
