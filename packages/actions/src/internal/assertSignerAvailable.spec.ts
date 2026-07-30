import { NoSignerAvailableError } from '@tevm/errors'
import { createTevmNode, prefundedAccounts } from '@tevm/node'
import { describe, expect, it } from 'vitest'
import { assertSignerAvailable } from './assertSignerAvailable.js'

const vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const

describe('assertSignerAvailable', () => {
	it('is a no-op by default (permissive auto impersonation)', () => {
		const node = createTevmNode()
		expect(() => assertSignerAvailable(node, vitalik)).not.toThrow()
	})

	it('throws for an unknown sender when strictImpersonation is enabled', () => {
		const node = createTevmNode({ strictImpersonation: true })
		expect(() => assertSignerAvailable(node, vitalik)).toThrow(NoSignerAvailableError)
		expect(() => assertSignerAvailable(node, vitalik)).toThrow(/No Signer available/)
	})

	it('allows prefunded dev accounts under strict mode', () => {
		const node = createTevmNode({ strictImpersonation: true })
		for (const account of prefundedAccounts) {
			expect(() => assertSignerAvailable(node, account)).not.toThrow()
		}
	})

	it('allows the impersonated account and rejects again after stopping', () => {
		const node = createTevmNode({ strictImpersonation: true })
		node.setImpersonatedAccount(vitalik)
		expect(() => assertSignerAvailable(node, vitalik)).not.toThrow()
		node.setImpersonatedAccount(undefined)
		expect(() => assertSignerAvailable(node, vitalik)).toThrow(NoSignerAvailableError)
	})

	it('matches the impersonated account case-insensitively', () => {
		const node = createTevmNode({ strictImpersonation: true })
		node.setImpersonatedAccount(vitalik)
		expect(() => assertSignerAvailable(node, vitalik.toLowerCase() as typeof vitalik)).not.toThrow()
	})

	it('bypasses the check while auto impersonation is on', () => {
		const node = createTevmNode({ strictImpersonation: true })
		node.setAutoImpersonate(true)
		expect(() => assertSignerAvailable(node, vitalik)).not.toThrow()
		node.setAutoImpersonate(false)
		expect(() => assertSignerAvailable(node, vitalik)).toThrow(NoSignerAvailableError)
	})

	it('can be toggled at runtime', () => {
		const node = createTevmNode()
		expect(node.getStrictImpersonation()).toBe(false)
		node.setStrictImpersonation(true)
		expect(node.getStrictImpersonation()).toBe(true)
		expect(() => assertSignerAvailable(node, vitalik)).toThrow(NoSignerAvailableError)
	})

	it('survives a deepCopy of the node', async () => {
		const node = createTevmNode({ strictImpersonation: true })
		const copy = await node.deepCopy()
		expect(copy.getStrictImpersonation()).toBe(true)
		expect(() => assertSignerAvailable(copy, vitalik)).toThrow(NoSignerAvailableError)
	})

	it('ignores an undefined sender', () => {
		const node = createTevmNode({ strictImpersonation: true })
		expect(() => assertSignerAvailable(node, undefined)).not.toThrow()
	})
})
