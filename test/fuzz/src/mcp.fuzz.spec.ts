import { createSessionManager, executeTool, toJsonValue, toolDefinitions } from '@tevm/mcp'
import fc from 'fast-check'
import { type Address, type Hex, toHex } from 'viem'
import { describe, expect, it } from 'vitest'
import {
	addressArb,
	buildConstantReturnRuntime,
	buildDeployInitcode,
	bytes32Arb,
	STORAGE_BOX_RUNTIME,
	u256Arb,
} from './arbitraries.js'
import { fcParams } from './config.js'

describe('@tevm/mcp toJsonValue, schema validation, tool execution, and session fuzzing', () => {
	it('fuzz: toJsonValue always produces strictly JSON-serializable values and preserves exact bigint precision and byte slices', () => {
		const arbitraryRichValue: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
			leaf: fc.oneof(
				fc.constant(null),
				fc.boolean(),
				fc.integer(),
				fc.string({ maxLength: 64 }),
				fc.bigInt({ min: -(1n << 256n), max: 1n << 256n }),
				fc.uint8Array({ minLength: 0, maxLength: 64 }),
				// Uint8Array subarray with non-zero byteOffset!
				fc
					.tuple(fc.uint8Array({ minLength: 4, maxLength: 64 }), fc.integer({ min: 1, max: 3 }))
					.map(([buf, offset]) => buf.subarray(offset, buf.length - 1)),
				fc.string({ maxLength: 32 }).map((msg) => new Error(msg)),
			),
			node: fc.oneof(
				{ depthSize: 'small' },
				tie('leaf'),
				fc.array(tie('node'), { maxLength: 5 }),
				fc.dictionary(fc.string({ maxLength: 16 }), tie('node'), { maxKeys: 5 }),
				fc.array(tie('leaf'), { maxLength: 5 }).map((arr) => new Set(arr)),
				fc
					.array(fc.tuple(fc.string({ maxLength: 12 }), tie('leaf')), { maxLength: 5 })
					.map((entries) => new Map(entries)),
			),
		})).node

		fc.assert(
			fc.property(arbitraryRichValue, (value) => {
				const converted = toJsonValue(value)
				const serialized = JSON.stringify(converted)
				expect(typeof serialized).toBe('string')
				if (typeof value === 'bigint') {
					expect(converted).toBe(value.toString())
					expect(BigInt(converted as string)).toBe(value)
				}
				if (value instanceof Uint8Array) {
					expect(converted).toBe(`0x${Buffer.from(value).toString('hex')}`)
				}
			}),
			fcParams('pure', { numRuns: 350 }),
		)
	})

	it('fuzz: executeTool safely rejects unknown and prototype-property tool names and malformed inputs', async () => {
		const sessions = createSessionManager()
		const validToolNames = toolDefinitions.map((t) => t.name)
		const adversarialToolNames = fc.oneof(
			fc.constantFrom('__proto__', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', '', 'eval', 'evm_unknown'),
			fc.string({ maxLength: 48 }).filter((s) => !validToolNames.includes(s)),
		)

		await fc.assert(
			fc.asyncProperty(adversarialToolNames, fc.anything({ maxDepth: 2 }), async (name, input) => {
				await expect(executeTool(name, input, sessions)).rejects.toThrow(`Unknown tool: ${name}`)
			}),
			fcParams('pure', { numRuns: 150 }),
		)

		// Malformed arguments to real tools MUST fail cleanly with an Error, never crash the process.
		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...validToolNames).filter((n) => n !== 'evm_create_session'),
				fc.oneof(
					fc.constant(null),
					fc.constant(undefined),
					fc.constant({}),
					fc.dictionary(fc.string({ maxLength: 16 }), fc.jsonValue({ maxDepth: 2 }), { maxKeys: 4 }),
				),
				async (name, badInput) => {
					await expect(executeTool(name, badInput, sessions)).rejects.toThrow()
				},
			),
			fcParams('pure', { numRuns: 120 }),
		)
	})

	it('fuzz: evm_trace_call maxSteps truncation strictly satisfies returnedSteps <= maxSteps and returnedSteps + omittedSteps === totalSteps', async () => {
		const sessions = createSessionManager()
		const created = (await executeTool('evm_create_session', {}, sessions)) as { handle: string }
		try {
			const contractAddr = '0x0000000000000000000000000000000000007777'
			// Simple contract that executes ~10 opcodes: PUSH1 1 PUSH1 2 ADD PUSH1 3 ADD ... RETURN
			await executeTool(
				'evm_set_account',
				{
					session: created.handle,
					address: contractAddr,
					code: '0x600160020160030160040160050160005260206000f3',
				},
				sessions,
			)

			await fc.assert(
				fc.asyncProperty(fc.integer({ min: 10, max: 64 }), async (maxSteps) => {
					const trace = (await executeTool(
						'evm_trace_call',
						{
							session: created.handle,
							address: contractAddr,
							data: '0x',
							maxSteps,
						},
						sessions,
					)) as {
						totalSteps: number
						returnedSteps: number
						omittedSteps: number
						steps: unknown[]
					}

					expect(trace.returnedSteps).toBe(trace.steps.length)
					expect(trace.returnedSteps).toBeLessThanOrEqual(maxSteps)
					expect(trace.returnedSteps + trace.omittedSteps).toBe(trace.totalSteps)
					expect(() => JSON.stringify(trace)).not.toThrow()
				}),
				fcParams('io', { numRuns: 25 }),
			)
		} finally {
			await sessions.close(created.handle)
		}
	})

	it('fuzz: stateful MCP session operations maintain account, deploy, call, mine, and block consistency', async () => {
		const sessions = createSessionManager()
		const created = (await executeTool('evm_create_session', {}, sessions)) as { handle: string }
		const session = created.handle
		try {
			await fc.assert(
				fc.asyncProperty(
					addressArb,
					u256Arb,
					fc.bigInt({ min: 0n, max: 1000n }),
					bytes32Arb,
					bytes32Arb,
					fc.integer({ min: 1, max: 3 }),
					async (addr, balance, nonce, slot, slotValue, mineCount) => {
						const runtime = buildConstantReturnRuntime(balance)
						await executeTool(
							'evm_set_account',
							{
								session,
								address: addr,
								balance: balance.toString(),
								nonce: nonce.toString(),
								code: runtime,
								storage: { [slot]: slotValue },
							},
							sessions,
						)
						const acc = (await executeTool(
							'evm_get_account',
							{ session, address: addr, storageSlot: slot },
							sessions,
						)) as {
							balance: string
							nonce: string
							code: Hex
							isContract: boolean
							storageValue: Hex
						}
						expect(BigInt(acc.balance)).toBe(balance)
						expect(BigInt(acc.nonce)).toBe(nonce)
						expect(acc.code.toLowerCase()).toBe(runtime.toLowerCase())
						expect(acc.isContract).toBe(true)
						expect(acc.storageValue.toLowerCase()).toBe(slotValue.toLowerCase())

						const mined = (await executeTool('evm_mine', { session, blockCount: mineCount }, sessions)) as {
							blockNumber: string
						}
						const block = (await executeTool(
							'evm_get_block',
							{ session, blockNumber: mined.blockNumber },
							sessions,
						)) as { number: string }
						expect(block.number).toBe(mined.blockNumber)

						// Deploy and call a real contract through MCP tools.
						const deployed = (await executeTool(
							'evm_deploy_contract',
							{ session, bytecode: buildDeployInitcode(STORAGE_BOX_RUNTIME) },
							sessions,
						)) as { contractAddress: Address }
						expect(deployed.contractAddress).toMatch(/^0x[0-9a-f]{40}$/i)
						await executeTool('evm_mine', { session, blockCount: 1 }, sessions)
						const readBack = (await executeTool(
							'evm_trace_call',
							{ session, address: deployed.contractAddress, data: '0x', maxSteps: 50 },
							sessions,
						)) as { failed: boolean; returnValue: Hex }
						expect(readBack.failed).toBe(false)
						expect(readBack.returnValue.toLowerCase()).toBe(toHex(0n, { size: 32 }))
					},
				),
				fcParams('io', { numRuns: 20 }),
			)

			const closed = (await executeTool('evm_close_session', { session }, sessions)) as { closed: boolean }
			expect(closed.closed).toBe(true)
			expect(await executeTool('evm_close_session', { session }, sessions)).toEqual({ closed: false })
		} finally {
			await sessions.close(session)
		}
	})
})
