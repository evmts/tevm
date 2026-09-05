import { foundry, mainnet } from 'viem/chains'
import { expect, it } from 'vitest'
import { mainnet as exportedMainnet, tevmDefault } from './index.js'

it('uses viem chain definitions for native node configuration', () => {
	expect(tevmDefault).toBe(foundry)
	expect(tevmDefault.id).toBe(31337)
	expect(exportedMainnet).toBe(mainnet)
})
