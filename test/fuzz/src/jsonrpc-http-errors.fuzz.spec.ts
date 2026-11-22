import type { AddressInfo } from 'node:net'
import * as tevmCommon from '@tevm/common'
import { BaseError, InternalError, InvalidParamsError, rpcErrorCodeToMessage } from '@tevm/errors'
import { createHttpClient } from '@tevm/http-client'
import { createJsonRpcFetcher } from '@tevm/jsonrpc'
import { createLogger } from '@tevm/logger'
import { createMemoryClient } from '@tevm/memory-client'
import { createServer } from '@tevm/server'
import { bytesToHex, hexToBytes, invariant, numberToHex, PREFUNDED_ACCOUNTS, PREFUNDED_PUBLIC_KEYS } from '@tevm/utils'
import fc from 'fast-check'
import { getAddress, isAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import { addressArb, jsonRpcIdArb, u256Arb } from './arbitraries.js'
import { fcParams } from './config.js'

describe('@tevm/jsonrpc, @tevm/http-client, @tevm/errors, @tevm/utils, @tevm/common, and @tevm/logger fuzzing', () => {
	it('fuzz: createJsonRpcFetcher never throws and always produces a valid JSON-RPC 2.0 envelope', async () => {
		const thrownArb = fc.oneof(
			fc.string().map((m) => new Error(m)),
			fc.record({
				code: fc.oneof(
					fc.integer({ min: -40000, max: 5000 }),
					fc.constant(Number.NaN),
					fc.constant(Number.POSITIVE_INFINITY),
					fc.string({ maxLength: 16 }),
					fc.constant(null),
				),
				message: fc.option(fc.string({ maxLength: 64 }), { nil: undefined }),
				data: fc.option(fc.jsonValue({ maxDepth: 2 }), { nil: undefined }),
			}),
			fc.string({ maxLength: 64 }),
			fc.integer(),
			fc.constant(null),
			fc.constant(undefined),
		)

		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 1, maxLength: 32 }),
				fc.option(jsonRpcIdArb, { nil: undefined }),
				fc.boolean(),
				fc.jsonValue({ maxDepth: 3 }),
				thrownArb,
				async (method, id, shouldThrow, okResult, thrown) => {
					const fetcher = createJsonRpcFetcher({
						request: (async () => {
							if (shouldThrow) throw thrown
							return okResult
						}) as never,
					})
					const req = {
						method,
						...(id !== undefined ? { id } : {}),
					} as never
					const response = await fetcher.request(req)
					expect(response.jsonrpc).toBe('2.0')
					if (id !== undefined) {
						expect(response.id).toEqual(id)
					} else {
						expect('id' in response).toBe(false)
					}
					if (!shouldThrow) {
						expect('result' in response).toBe(true)
						expect('error' in response).toBe(false)
						expect((response as { result: unknown }).result).toEqual(okResult)
					} else {
						expect('error' in response).toBe(true)
						expect('result' in response).toBe(false)
						const err = (response as { error: { code: number; message: string } }).error
						expect(typeof err.code).toBe('number')
						expect(Number.isFinite(err.code)).toBe(true)
						expect(typeof err.message).toBe('string')
					}
				},
			),
			fcParams('pure', { numRuns: 300 }),
		)
	})

	it('fuzz: @tevm/http-client maintains exact JSON-RPC parity with in-process @tevm/memory-client', async () => {
		const memoryClient = createMemoryClient()
		await memoryClient.tevmReady()
		const server = createServer(memoryClient)
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const { port } = server.address() as AddressInfo
		const httpClient = createHttpClient({ url: `http://127.0.0.1:${port}` })

		try {
			await fc.assert(
				fc.asyncProperty(addressArb, u256Arb, async (addr, balance) => {
					await memoryClient.tevmDeal({ address: addr, amount: balance })
					const [direct, remote] = await Promise.all([
						memoryClient.transport.tevm.request({ method: 'eth_getBalance', params: [addr, 'latest'] }),
						httpClient.request({ method: 'eth_getBalance', params: [addr, 'latest'] }),
					])
					expect(remote).toBe(direct)
					expect(BigInt(remote as string)).toBe(balance)
				}),
				fcParams('io', { numRuns: 40 }),
			)
		} finally {
			await new Promise<void>((resolve) => server.close(() => resolve()))
			await memoryClient.tevmClose()
		}
	})

	it('fuzz: @tevm/errors BaseError hierarchy preserves message, code, cause, and never throws during formatting', () => {
		fc.assert(
			fc.property(
				fc.string({ maxLength: 128 }),
				fc.option(fc.string({ maxLength: 64 }), { nil: undefined }),
				fc.array(fc.string({ maxLength: 64 }), { maxLength: 4 }),
				(shortMessage, causeMessage, metaMessages) => {
					const cause = causeMessage !== undefined ? new Error(causeMessage) : undefined
					const err1 = new InvalidParamsError(shortMessage, {
						...(cause ? { cause } : {}),
						metaMessages,
					})
					const err2 = new InternalError(shortMessage, {
						...(cause ? { cause } : {}),
						metaMessages,
					})
					expect(err1).toBeInstanceOf(Error)
					expect(err1).toBeInstanceOf(BaseError)
					expect(err2).toBeInstanceOf(BaseError)
					expect(typeof err1.message).toBe('string')
					expect(typeof err1.code).toBe('number')
					expect(typeof err2.code).toBe('number')
					expect(() => String(err1)).not.toThrow()
					expect(() => String(err2)).not.toThrow()
				},
			),
			fcParams('pure', { numRuns: 200 }),
		)

		for (const [code, message] of Object.entries(rpcErrorCodeToMessage)) {
			expect(Number.isInteger(Number(code))).toBe(true)
			expect(typeof message).toBe('string')
			expect(message.length).toBeGreaterThan(0)
		}
	})

	it('fuzz: @tevm/utils hex/bytes round-trip, invariant, prefundedAccounts, @tevm/common, and @tevm/logger', () => {
		fc.assert(
			fc.property(fc.uint8Array({ minLength: 0, maxLength: 128 }), (bytes) => {
				const hex = bytesToHex(bytes)
				expect(hex).toMatch(/^0x([0-9a-f]{2})*$/)
				const back = hexToBytes(hex)
				expect(back).toEqual(bytes)
			}),
			fcParams('pure', { numRuns: 300 }),
		)

		fc.assert(
			fc.property(u256Arb, (n) => {
				const hex = numberToHex(n)
				expect(hex).toMatch(/^0x(0|[1-9a-f][0-9a-f]*)$/)
				expect(BigInt(hex)).toBe(n)
			}),
			fcParams('pure', { numRuns: 300 }),
		)

		fc.assert(
			fc.property(fc.boolean(), fc.string({ maxLength: 64 }), (cond, msg) => {
				if (cond) {
					expect(() => invariant(cond, new Error(msg))).not.toThrow()
				} else {
					expect(() => invariant(cond, new Error(msg))).toThrow()
				}
			}),
			fcParams('pure', { numRuns: 150 }),
		)

		// Prefunded accounts invariants.
		expect(PREFUNDED_ACCOUNTS.length).toBeGreaterThan(0)
		expect(PREFUNDED_ACCOUNTS.length).toBe(PREFUNDED_PUBLIC_KEYS.length)
		const seen = new Set<string>()
		for (let i = 0; i < PREFUNDED_ACCOUNTS.length; i++) {
			const account = PREFUNDED_ACCOUNTS[i]!.address
			expect(isAddress(account)).toBe(true)
			expect(getAddress(account)).toBe(account)
			expect(account).toBe(PREFUNDED_PUBLIC_KEYS[i])
			expect(seen.has(account)).toBe(false)
			seen.add(account)
		}

		// Common presets sanity.
		expect(tevmCommon.tevmDefault.id).toBeGreaterThan(0)

		// Logger accepts all valid levels without throwing.
		fc.assert(
			fc.property(
				fc.constantFrom('silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'),
				fc.string({ maxLength: 32 }),
				(level, name) => {
					const logger = createLogger({ level: level as never, name })
					expect(typeof logger.info).toBe('function')
					expect(typeof logger.error).toBe('function')
				},
			),
			fcParams('pure', { numRuns: 50 }),
		)
	})
})
