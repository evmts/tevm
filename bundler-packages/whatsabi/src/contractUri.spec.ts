import { describe, expect, it } from 'vitest'
import { knownChains, parseUri, resolveContractUri, UnknownChainError } from './index.js'

const optimismRpc = process.env['TEVM_RPC_URLS_OPTIMISM']?.split(',')[0] ?? 'https://mainnet.optimism.io'
const weth = '0x4200000000000000000000000000000000000006'

describe('contract URI resolution', () => {
	it('parses every public query option and rejects non-contract URIs', () => {
		expect(
			parseUri(
				`evm://10/${weth}?rpcUrl=${encodeURIComponent(optimismRpc)}&etherscanApiKey=key&etherscanBaseUrl=https%3A%2F%2Fexample.com&followProxies=true`,
			),
		).toEqual({
			chainId: 10,
			address: weth,
			rpcUrl: optimismRpc,
			etherscanApiKey: 'key',
			etherscanBaseUrl: 'https://example.com',
			followProxies: true,
		})
		expect(parseUri('https://example.com')).toBeUndefined()
		expect(knownChains[10]).toMatchObject({ id: 10, name: 'OP Mainnet' })
	})

	it('reports an actionable error for an unknown chain without an RPC URL', async () => {
		await expect(resolveContractUri(`evm://999999/${weth}`, {} as any)).rejects.toEqual(
			expect.objectContaining({ name: 'UnknownChainError', _tag: 'UnknownChainError' }),
		)
		expect(new UnknownChainError(999999).message).toContain('Unknown chain ID: 999999')
	})

	it('loads an ABI and deployed bytecode from a real Optimism contract', async () => {
		const uri = `evm://10/${weth}?rpcUrl=${encodeURIComponent(optimismRpc)}`
		const resolved = await resolveContractUri(uri, {} as any)
		expect(resolved?.address).toBe(weth)
		expect(resolved?.deployedBytecode).toMatch(/^0x6080604052[0-9a-f]+$/)
		expect(resolved?.abi).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'function', name: 'name' })]))
	}, 30_000)
})
