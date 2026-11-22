import { createZevmEngine, NativeRpcError } from '@tevm/node'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
	addressArb,
	adversarialJsonStringArb,
	buildConstantReturnRuntime,
	ECHO_CALLDATA_RUNTIME,
	hexBytesArb,
	jsonRpcIdArb,
	REVERT_ECHO_RUNTIME,
	u256Arb,
} from './arbitraries.js'
import { fcParams } from './config.js'

const assertValidRpcResponseObject = (obj: unknown): void => {
	expect(obj).toBeTypeOf('object')
	expect(obj).not.toBeNull()
	const record = obj as Record<string, unknown>
	expect(record['jsonrpc']).toBe('2.0')
	const hasResult = 'result' in record
	const hasError = 'error' in record
	expect(hasResult !== hasError).toBe(true)
	if (hasError) {
		const err = record['error'] as Record<string, unknown>
		expect(err).toBeTypeOf('object')
		expect(err).not.toBeNull()
		expect(typeof err['code']).toBe('number')
		expect(Number.isInteger(err['code'])).toBe(true)
		expect(typeof err['message']).toBe('string')
		expect((err['message'] as string).length).toBeGreaterThan(0)
	}
	// Wire value must always be round-trippable through JSON.
	expect(() => JSON.stringify(obj)).not.toThrow()
}

describe('@tevm/node native ZEVM engine fuzzing', () => {
	it('fuzz: raw engine.rpc never crashes on arbitrary or adversarial strings and preserves JSON-RPC 2.0 wire invariants', async () => {
		const engine = createZevmEngine()
		try {
			await engine.ready()
			await fc.assert(
				fc.asyncProperty(adversarialJsonStringArb, async (payload) => {
					const raw = await engine.rpc(payload)
					if (raw === null) return
					expect(typeof raw).toBe('string')
					const parsed = JSON.parse(raw)
					if (Array.isArray(parsed)) {
						expect(parsed.length).toBeGreaterThan(0)
						for (const item of parsed) {
							assertValidRpcResponseObject(item)
						}
					} else {
						assertValidRpcResponseObject(parsed)
					}
				}),
				fcParams('pure', { numRuns: 300 }),
			)
		} finally {
			await engine.close()
		}
	})

	it('fuzz: structured JSON-RPC single and batch envelopes correlate IDs and omit notifications', async () => {
		const engine = createZevmEngine()
		try {
			await engine.ready()
			const methodArb = fc.constantFrom(
				'eth_blockNumber',
				'eth_chainId',
				'net_version',
				'web3_clientVersion',
				'eth_gasPrice',
				'eth_accounts',
				'eth_syncing',
				'txpool_status',
				'unknown_fuzz_method',
				'eth_getBalance',
			)
			const itemArb = fc.record({
				id: fc.option(jsonRpcIdArb, { nil: undefined }),
				method: methodArb,
				params: fc.option(
					fc.oneof(
						fc.constant([]),
						fc.constant(['0x0000000000000000000000000000000000000001', 'latest']),
						fc.constant([123]),
					),
					{ nil: undefined },
				),
			})
			await fc.assert(
				fc.asyncProperty(fc.array(itemArb, { minLength: 1, maxLength: 8 }), fc.boolean(), async (items, isBatch) => {
					const selected = isBatch ? items : [items[0]!]
					const wireItems = selected.map((item) => ({
						jsonrpc: '2.0',
						method: item.method,
						...(item.params !== undefined ? { params: item.params } : {}),
						...(item.id !== undefined ? { id: item.id } : {}),
					}))
					const expectedIds = selected.filter((item) => item.id !== undefined).map((item) => item.id)
					const raw = await engine.rpc(JSON.stringify(isBatch ? wireItems : wireItems[0]))
					if (expectedIds.length === 0) {
						expect(raw).toBeNull()
						return
					}
					expect(typeof raw).toBe('string')
					const parsed = JSON.parse(raw as string)
					if (isBatch) {
						expect(Array.isArray(parsed)).toBe(true)
						expect(parsed.length).toBe(expectedIds.length)
						for (let i = 0; i < parsed.length; i++) {
							assertValidRpcResponseObject(parsed[i])
							expect(parsed[i].id).toEqual(expectedIds[i])
						}
					} else {
						assertValidRpcResponseObject(parsed)
						expect(parsed.id).toEqual(expectedIds[0])
					}
				}),
				fcParams('pure', { numRuns: 150 }),
			)
		} finally {
			await engine.close()
		}
	})

	it('fuzz: createZevmEngine option validation rejects invalid numbers and accepts valid unsigned safe integers', async () => {
		const invalidNumberArb = fc.oneof(
			fc.integer({ min: -1_000_000, max: -1 }),
			fc.constant(Number.NaN),
			fc.constant(Number.POSITIVE_INFINITY),
			fc.constant(Number.NEGATIVE_INFINITY),
			fc.constant(Number.MAX_SAFE_INTEGER + 1),
			fc.constant(-0.5),
			fc.double({ min: 0.01, max: 1000, noInteger: true, noNaN: true }),
		)
		await fc.assert(
			fc.asyncProperty(invalidNumberArb, fc.constantFrom('chainId', 'interval', 'blockNumber'), async (bad, field) => {
				if (field === 'chainId') {
					expect(() => createZevmEngine({ chainId: bad })).toThrow(TypeError)
				} else if (field === 'interval') {
					expect(() => createZevmEngine({ mining: { interval: bad } })).toThrow(TypeError)
				} else {
					expect(() => createZevmEngine({ fork: { url: 'http://127.0.0.1:1', blockNumber: bad } })).toThrow(TypeError)
				}
			}),
			fcParams('pure', { numRuns: 120 }),
		)

		// Valid chainIds must round-trip through eth_chainId as canonical hex quantity.
		const validChainIdArb = fc.oneof(
			fc.constantFrom(1, 5, 10, 137, 31337, 8453, 42161),
			fc.integer({ min: 1, max: 0x7fff_ffff }),
		)
		await fc.assert(
			fc.asyncProperty(validChainIdArb, async (chainId) => {
				const engine = createZevmEngine({ chainId })
				try {
					await engine.ready()
					const hexChainId = await engine.request({ method: 'eth_chainId' })
					expect(hexChainId).toBe(`0x${chainId.toString(16)}`)
				} finally {
					await engine.close()
				}
			}),
			fcParams('io', { numRuns: 30 }),
		)
	})

	it('fuzz: EVM call return data and revert data preserve exact arbitrary bytes through native N-API boundary', async () => {
		const engine = createZevmEngine()
		try {
			await engine.ready()
			const echoAddr = '0x000000000000000000000000000000000000e001'
			const revertAddr = '0x000000000000000000000000000000000000e002'
			const constAddr = '0x000000000000000000000000000000000000e003'
			await engine.request({ method: 'anvil_setCode', params: [echoAddr, ECHO_CALLDATA_RUNTIME] })
			await engine.request({ method: 'anvil_setCode', params: [revertAddr, REVERT_ECHO_RUNTIME] })

			await fc.assert(
				fc.asyncProperty(hexBytesArb(0, 256), u256Arb, async (calldata, word) => {
					const echoed = await engine.request({
						method: 'eth_call',
						params: [{ to: echoAddr, data: calldata }, 'latest'],
					})
					expect(echoed).toBe(calldata)

					// State override constant return must not mutate persistent code.
					const overridden = await engine.request({
						method: 'eth_call',
						params: [{ to: constAddr }, 'latest', { [constAddr]: { code: buildConstantReturnRuntime(word) } }],
					})
					expect(overridden).toBe(`0x${word.toString(16).padStart(64, '0')}`)
					expect(await engine.request({ method: 'eth_getCode', params: [constAddr, 'latest'] })).toBe('0x')

					// Revert echo must throw NativeRpcError with exact revert data preserved.
					try {
						await engine.request({
							method: 'eth_call',
							params: [{ to: revertAddr, data: calldata }, 'latest'],
						})
						expect.unreachable('revert contract must revert')
					} catch (error) {
						expect(error).toBeInstanceOf(NativeRpcError)
						const rpcErr = error as NativeRpcError
						expect(rpcErr.code).toBe(3)
						if (calldata !== '0x') {
							expect(rpcErr.data).toBe(calldata)
						}
					}
				}),
				fcParams('io', { numRuns: 100 }),
			)
		} finally {
			await engine.close()
		}
	})

	it('fuzz: concurrent request serialization, block events, and idempotent close never deadlock or throw unhandled errors', async () => {
		const opArb = fc.constantFrom('blockNumber', 'mine', 'setBalance', 'invalidRpc', 'attachBlock', 'detachBlock')
		await fc.assert(
			fc.asyncProperty(
				fc.array(opArb, { minLength: 4, maxLength: 20 }),
				addressArb,
				u256Arb,
				async (ops, targetAddr, balance) => {
					const engine = createZevmEngine()
					const seenBlocks: unknown[] = []
					const listener = (block: unknown) => {
						seenBlocks.push(block)
					}
					let expectedMines = 0
					try {
						const promises: Promise<unknown>[] = []
						for (const op of ops) {
							switch (op) {
								case 'blockNumber':
									promises.push(engine.request({ method: 'eth_blockNumber' }))
									break
								case 'mine':
									expectedMines++
									promises.push(engine.request({ method: 'evm_mine' }))
									break
								case 'setBalance':
									promises.push(
										engine.request({
											method: 'anvil_setBalance',
											params: [targetAddr, `0x${balance.toString(16)}`],
										}),
									)
									break
								case 'invalidRpc':
									promises.push(
										engine.request({ method: 'definitely_missing_method' }).catch((e) => {
											expect(e).toBeInstanceOf(NativeRpcError)
											return 'caught'
										}),
									)
									break
								case 'attachBlock':
									engine.events.on('block', listener)
									break
								case 'detachBlock':
									engine.events.off('block', listener)
									break
							}
						}
						await Promise.all(promises)
						const finalBlock = BigInt((await engine.request({ method: 'eth_blockNumber' })) as string)
						expect(finalBlock).toBe(BigInt(expectedMines))
					} finally {
						// Double close must be idempotent.
						await Promise.all([engine.close(), engine.close()])
						await expect(engine.request({ method: 'eth_blockNumber' })).rejects.toThrow('engine is closed')
						await expect(engine.rpc('{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}')).rejects.toThrow(
							'engine is closed',
						)
					}
				},
			),
			fcParams('io', { numRuns: 30 }),
		)
	})
})
