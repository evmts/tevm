import Module from 'node:module'
import * as common from '@tevm/common'
import { createContract } from '@tevm/contract'
import type { ZevmBackend } from '@tevm/node'
import { definePredeploy } from '@tevm/predeploys'
import fc from 'fast-check'
import { type Chain, encodeFunctionData, getAddress, type Hex, parseAbi, toHex } from 'viem'
import * as viemChains from 'viem/chains'
import { beforeAll, expect, it, vi } from 'vitest'

let createMemoryClient: typeof import('./createMemoryClient.js').createMemoryClient
beforeAll(async () => {
	const requireSpy = vi.spyOn(Module.prototype, 'require')
	try {
		createMemoryClient = (await import('./createMemoryClient.js')).createMemoryClient
		expect(requireSpy).not.toHaveBeenCalledWith('@evmts/zevm')
	} finally {
		requireSpy.mockRestore()
	}
})

const target = '0x0000000000000000000000000000000000000123'

it('decodes the selected overload when the no-argument overload returns a different type', async () => {
	const client = createMemoryClient()
	try {
		const abi = parseAbi(['function f() pure returns (bool)', 'function f(uint256) pure returns (uint256)'])
		const stateOverride = { [target]: { code: '0x60206000f3' } } // return one zero word
		expect(
			(await client.tevmContract({ address: target, abi, functionName: 'f', args: [0n], stateOverride })).data,
		).toBe(0n)
	} finally {
		await client.tevmClose()
	}
})

it('accepts the same storage slot and value as a quantity, a short byte string or a full word', async () => {
	const client = createMemoryClient()
	try {
		for (const slot of ['0x0', '0x00', word(0n)] as const) {
			for (const value of ['0x1', '0x01', word(1n)] as const) {
				await client.tevmSetAccount({ address: target, storage: { [slot]: value } })
				expect((await client.tevmGetAccount({ address: target })).storage).toEqual({ [word(0n)]: word(1n) })
				await client.tevmSetAccount({ address: target, storage: { [word(0n)]: word(0n) } })
			}
		}
		for (const invalid of ['0x', `0x1${'0'.repeat(64)}`] as const) {
			await expect(client.tevmSetAccount({ address: target, storage: { [word(0n)]: invalid } })).rejects.toMatchObject({
				code: -32602,
			})
		}
	} finally {
		await client.tevmClose()
	}
})

const options = {
	seed: Number(process.env['FUZZ_SEED'] ?? 0x7eabc),
	numRuns: Number(process.env['FUZZ_RUNS'] ?? 256),
}
if (!Number.isSafeInteger(options.numRuns) || options.numRuns < 1)
	throw new Error('FUZZ_RUNS must be a positive integer')
if (!Number.isSafeInteger(options.seed)) throw new Error('FUZZ_SEED must be an integer')

const quantity = (n: bigint): Hex => `0x${n.toString(16)}`
const word = (n: bigint): Hex => `0x${n.toString(16).padStart(64, '0')}`
function uint(bits: number) {
	const max = (1n << BigInt(bits)) - 1n
	return fc.oneof(
		fc.bigInt({ min: 0n, max }),
		fc.constantFrom(0n, 1n, 255n, 256n, 2n ** 53n - 1n, 2n ** 53n, max - 1n, max),
	)
}

// Every form represents the same unsigned EVM storage word, including short
// byte strings with leading zeroes and full-width data.
const storageInput = fc.tuple(uint(256), fc.integer({ min: 0, max: 32 })).map(([value, bytes]) => ({
	value,
	input: `0x${value.toString(16).padStart(2 * bytes, '0')}` as Hex,
}))
const sample = fc.record({
	// Keep generated accounts outside the precompile and prefunded ranges.
	address: fc.uint8Array({ minLength: 19, maxLength: 19 }).map((b) => getAddress(`0x91${toHex(b).slice(2)}`)),
	balance: uint(256),
	nonce: uint(64),
	slot: storageInput,
	cell: storageInput,
	gas: fc.bigInt({ min: 50_000n, max: 1_000_000n }),
	payload: fc.uint8Array({ maxLength: 80 }).map((b) => toHex(b)),
})
const abi = parseAbi(['function load() view returns (bool)', 'function load(uint256 slot) view returns (uint256)'])
// CALLDATALOAD(4), SLOAD, MSTORE(0), RETURN(0, 32).
const storageRuntime = '0x6004355460005260206000f3'
// Copy the entire calldata to memory, then revert with the same bytes.
const revertRuntime = '0x366000600037366000fd'

type WireStep = {
	method: string
	params?: unknown[]
	result?: unknown
	error?: { code: number; message: string; data: Hex }
}

// Exercise the public raw-JSON backend boundary. An unexpected call fails at the
// point of dispatch, even if its reply would otherwise look like the right value.
function scriptedBackend(steps: WireStep[]) {
	let id = 0
	const backend: ZevmBackend = {
		rpc: async (raw) => {
			const step = steps[id++]
			if (!step) throw new Error(`Unexpected RPC: ${raw}`)
			const { result, error, ...request } = step
			expect(JSON.parse(raw)).toEqual({ jsonrpc: '2.0', id, ...request })
			return JSON.stringify({ jsonrpc: '2.0', id, result, error })
		},
		close: vi.fn(),
	}
	return { backend, consumed: () => id }
}

it('forwards exact JSON-RPC quantities, storage words, overrides, opaque snapshots and errors to a supplied backend', async () => {
	const requireSpy = vi.spyOn(Module.prototype, 'require')
	try {
		await fc.assert(
			fc.asyncProperty(sample, fc.boolean(), async (s, legacy) => {
				const { address, balance, nonce, slot, cell, payload, gas } = s
				const key = word(slot.value)
				const value = word(cell.value)
				const stateOverride = { [address]: { balance: quantity(balance), stateDiff: { [key]: value } } }
				const args = [slot.value] as const
				const data = encodeFunctionData({ abi, functionName: 'load', args })
				const wireAccount = {
					balance: quantity(balance),
					nonce: quantity(nonce),
					code: storageRuntime,
					storage: { [key]: value },
				}
				const fees = legacy ? { gasPrice: balance } : { maxFeePerGas: balance, maxPriorityFeePerGas: 0n }
				const wireFees = legacy
					? { gasPrice: quantity(balance) }
					: { maxFeePerGas: quantity(balance), maxPriorityFeePerGas: '0x0' }
				const tx = {
					from: target,
					to: address,
					data: payload,
					value: quantity(balance),
					nonce: quantity(nonce),
					gas: quantity(gas),
					...wireFees,
				}
				const steps: WireStep[] = [
					{ method: 'anvil_setBalance', params: [address, quantity(balance)], result: true },
					{ method: 'anvil_setNonce', params: [address, quantity(nonce)], result: true },
					{ method: 'anvil_setCode', params: [address, storageRuntime], result: true },
					{ method: 'anvil_setStorageAt', params: [address, key, value], result: true },
					{ method: 'zevm_getAccount', params: [address], result: wireAccount },
					{ method: 'eth_call', params: [tx, 'pending', stateOverride], result: payload },
					{ method: 'eth_call', params: [{ to: address, data }, 'latest'], result: value },
					{ method: 'anvil_dumpState', result: payload },
					{ method: 'anvil_loadState', params: [payload], result: true },
					{
						method: 'eth_call',
						params: [{ to: address, data }, 'latest'],
						error: { code: -32000, message: 'execution failed', data: payload },
					},
				]
				const { backend, consumed } = scriptedBackend(steps)
				const client = createMemoryClient({ backend })
				try {
					await client.tevmSetAccount({
						address,
						balance,
						nonce,
						deployedBytecode: storageRuntime,
						storage: { [slot.input]: cell.input },
					})
					expect(await client.tevmGetAccount({ address })).toEqual({
						address,
						balance,
						nonce,
						deployedBytecode: storageRuntime,
						storage: { [key]: value },
					})
					expect(
						await client.tevmCall({
							from: target,
							to: address,
							data: payload,
							gas,
							value: balance,
							nonce,
							...fees,
							blockTag: 'pending',
							stateOverride,
						}),
					).toEqual({ rawData: payload })
					const contractCall = { address, abi, functionName: 'load', args } as const
					expect(await client.tevmContract(contractCall)).toEqual({ rawData: value, data: cell.value })
					const blob = await client.tevmDumpState()
					expect(blob).toBe(payload)
					expect(await client.tevmLoadState(blob)).toBe(true)
					await expect(client.tevmContract(contractCall)).rejects.toMatchObject({
						name: 'NativeRpcError',
						code: -32000,
						data: payload,
					})
					expect(consumed()).toBe(steps.length)
				} finally {
					await client.tevmClose()
				}
				expect(backend.close).toHaveBeenCalledTimes(1)
			}),
			options,
		)
		expect(requireSpy).not.toHaveBeenCalledWith('@evmts/zevm')
	} finally {
		requireSpy.mockRestore()
	}
})

it('agrees with native storage reads and preserves predeploy state across overrides, reverts and dump/load', async () => {
	await fc.assert(
		fc.asyncProperty(sample, async ({ address, balance, nonce, slot, cell, gas, payload }) => {
			const client = createMemoryClient()
			try {
				const contract = createContract({
					name: 'StorageReader',
					abi,
					address,
					deployedBytecode: storageRuntime,
					bytecode: '0x600c600c600039600c6000f36004355460005260206000f3',
				})
				const addressed = { ...contract, address: address.toLowerCase() as Hex }
				const predeploy = definePredeploy(addressed)
				expect(predeploy.contract).toBe(addressed)
				expect(predeploy.predeploy()).toEqual({ address })
				const key = word(slot.value)
				const value = word(cell.value)
				const other = word(cell.value ^ 1n)
				const expected = { address, balance, nonce, deployedBytecode: storageRuntime, storage: { [key]: value } }
				await client.tevmSetAccount({
					...predeploy.predeploy(),
					balance,
					nonce,
					deployedBytecode: predeploy.contract.deployedBytecode,
					storage: { [slot.input]: cell.input },
				})
				expect(await client.tevmGetAccount({ address })).toEqual(expected)
				expect(await client.getStorageAt({ address, slot: key })).toBe(value)
				const call = predeploy.contract.read.load(slot.value)
				const data = encodeFunctionData(call)
				expect(await client.tevmContract(call)).toEqual({ rawData: value, data: cell.value })
				const stateOverride = { [address]: { stateDiff: { [key]: other } } }
				expect(await client.tevmCall({ to: address, data, gas, stateOverride })).toEqual({ rawData: other })
				const reverting = { [address]: { code: revertRuntime } }
				await expect(client.tevmCall({ to: address, data: payload, stateOverride: reverting })).rejects.toMatchObject({
					code: 3,
					data: payload,
				})
				await expect(client.tevmContract({ ...call, stateOverride: reverting })).rejects.toMatchObject({
					code: 3,
					data,
				})
				expect(await client.tevmGetAccount({ address })).toEqual(expected)

				const snapshot = await client.tevmDumpState()
				expect(snapshot).toMatch(/^0x(?:[0-9a-f]{2})+$/i)
				await client.tevmSetAccount({ address, balance: balance ^ 1n, storage: { [key]: other } })
				expect(await client.getStorageAt({ address, slot: key })).toBe(other)
				expect(await client.tevmLoadState(snapshot)).toBe(true)
				expect(await client.tevmGetAccount({ address })).toEqual(expected)
				expect(await client.tevmContract(call)).toEqual({ rawData: value, data: cell.value })
			} finally {
				await client.tevmClose()
			}
		}),
		options,
	)
})

it('checks the chain metadata for the complete viem export set and the Foundry alias', () => {
	const { tevmDefault, ...chains } = common
	expect(tevmDefault).toBe(chains.foundry)
	expect(Object.keys(chains).sort()).toEqual(Object.keys(viemChains).sort())
	for (const [name, upstream] of Object.entries(viemChains) as [keyof typeof chains, Chain][]) {
		const chain: Chain = chains[name]
		expect([chain.id, chain.name, chain.nativeCurrency, chain.rpcUrls], name).toEqual([
			upstream.id,
			upstream.name,
			upstream.nativeCurrency,
			upstream.rpcUrls,
		])
		expect(Number.isSafeInteger(chain.id) && chain.id > 0, name).toBe(true)
		expect(chain.name, name).toMatch(/\S/)
		expect(chain.nativeCurrency.name, name).toMatch(/\S/)
		expect(chain.nativeCurrency.symbol, name).toMatch(/\S/)
		const { decimals } = chain.nativeCurrency
		expect(Number.isInteger(decimals) && decimals >= 0 && decimals <= 255, name).toBe(true)
		// viem includes chains without a public endpoint (e.g. Arc). Validate
		// every declared endpoint, including alternate providers, without I/O.
		expect(Array.isArray(chain.rpcUrls.default.http), name).toBe(true)
		for (const provider of Object.values(chain.rpcUrls)) {
			for (const url of provider.http) expect(new URL(url).protocol, name).toMatch(/^https?:$/)
			// The WebSocket URL constructor also accepts http(s) for an upgrade.
			for (const url of provider.webSocket ?? []) expect(new URL(url).protocol, name).toMatch(/^(?:ws|http)s?:$/)
		}
	}
})
