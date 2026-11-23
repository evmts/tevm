import * as viemChains from 'viem/chains'
import { describe, expect, it } from 'vitest'
import * as commonExports from './index.js'
import { base, foundry, mainnet, optimism, sepolia, tevmDefault } from './index.js'

describe('@tevm/common', () => {
	it('uses viem chain definitions for native node configuration', () => {
		expect(tevmDefault).toBe(viemChains.foundry)
		expect(tevmDefault.id).toBe(31337)
		expect(foundry).toBe(viemChains.foundry)
		expect(mainnet).toBe(viemChains.mainnet)
		expect(optimism).toBe(viemChains.optimism)
		expect(base).toBe(viemChains.base)
		expect(sepolia).toBe(viemChains.sepolia)
	})

	it('re-exports every chain from viem/chains without missing or stale references', () => {
		const viemKeys = Object.keys(viemChains)
		expect(viemKeys.length).toBeGreaterThan(100)
		for (const key of viemKeys) {
			expect(commonExports).toHaveProperty(key)
			expect((commonExports as Record<string, unknown>)[key]).toBe((viemChains as Record<string, unknown>)[key])
		}
		for (const [key, value] of Object.entries(commonExports)) {
			expect(value, `export ${key} should be defined`).toBeDefined()
		}
	})
})
