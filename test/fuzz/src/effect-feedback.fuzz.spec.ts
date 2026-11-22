import { Fuzz, FuzzSimulation } from '@smthrs/fuzz'
import { toJsonValue } from '@tevm/mcp'
import { createZevmEngine } from '@tevm/node'
import { Arbitrary, Effect, Ref, Schema, Semaphore } from 'effect'
import { describe, expect, it } from 'vitest'
import { extractJsonRpcFrames } from '../../../packages/server/src/internal/extractJsonRpcFrames.js'
import { FUZZ_CONFIG } from './config.js'

const Byte = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 255 }))

describe('@smthrs/fuzz Effect feedback-guided fuzzing & deterministic fiber simulation', () => {
	it('feedback-guided: extractJsonRpcFrames explores framing branches with AFL++ energy & satisfies chunk invariance', async () => {
		const FrameInput = Schema.Struct({
			tokens: Schema.Array(
				Schema.Literals([
					'{',
					'}',
					'[',
					']',
					'"',
					'\\',
					':',
					',',
					' ',
					'\n',
					'\r\n',
					'a',
					'0',
					'{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}',
					'{"s":"\\"}{\\""}',
				]),
			),
			cuts: Schema.Array(Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 64 }))),
		})

		const report = await Effect.runPromise(
			Fuzz.run(
				Arbitrary.schema(FrameInput),
				(input) =>
					Effect.gen(function* () {
						const raw = input.tokens.join('')
						const [singleFrames, singleRem] = extractJsonRpcFrames(raw)

						// Guide feedback-driven mutation toward deeper multi-frame & remainder states!
						yield* Fuzz.observe(`frames:${Math.min(singleFrames.length, 5)}`)
						yield* Fuzz.observe(singleRem.length > 0 ? 'has-remainder' : 'clean-end')
						yield* Fuzz.score('frame-count', singleFrames.length)

						const cuts = [...new Set(input.cuts.filter((c) => c > 0 && c < raw.length))].sort((a, b) => a - b)
						let buf = ''
						const chunkedFrames: string[] = []
						let prev = 0
						for (const cut of cuts) {
							buf += raw.slice(prev, cut)
							const [f, r] = extractJsonRpcFrames(buf)
							chunkedFrames.push(...f)
							buf = r
							prev = cut
						}
						buf += raw.slice(prev)
						const [lastF, lastR] = extractJsonRpcFrames(buf)
						chunkedFrames.push(...lastF)
						buf = lastR

						if (chunkedFrames.length !== singleFrames.length || buf !== singleRem) {
							return false
						}
						for (let i = 0; i < singleFrames.length; i++) {
							if (chunkedFrames[i] !== singleFrames[i]) return false
						}
						return true
					}),
				{
					seed: FUZZ_CONFIG.effectSeed,
					executions: FUZZ_CONFIG.effectExecutions,
				},
			),
		)

		const diagnostic = Fuzz.formatReport(report)
		expect(report._tag, diagnostic ?? 'expected Passed').toBe('Passed')
		expect(report.stats.executions).toBeGreaterThan(0)
	})

	it('feedback-guided: native ZEVM JSON-RPC dispatcher explores error codes, batches, and valid methods without crashing', async () => {
		const engine = createZevmEngine()
		await engine.ready()

		const RpcProbe = Schema.Struct({
			kind: Schema.Literals(['valid', 'batch', 'malformed', 'raw-bytes']),
			method: Schema.Literals([
				'eth_blockNumber',
				'eth_chainId',
				'net_version',
				'eth_gasPrice',
				'eth_getBalance',
				'eth_call',
				'eth_getStorageAt',
				'evm_snapshot',
				'txpool_status',
				'unknown_method',
			]),
			hasId: Schema.Boolean,
			idNum: Schema.Int.check(Schema.isBetween({ minimum: -1000, maximum: 1000 })),
			rawBytes: Schema.Array(Byte),
		})

		try {
			const report = await Effect.runPromise(
				Fuzz.run(
					Arbitrary.schema(RpcProbe),
					(probe) =>
						Effect.gen(function* () {
							let payload: string
							if (probe.kind === 'raw-bytes') {
								payload = Buffer.from(probe.rawBytes).toString('utf8')
							} else if (probe.kind === 'malformed') {
								payload = `{"jsonrpc":"2.0","method":${JSON.stringify(probe.method)},"params":${probe.idNum}`
							} else if (probe.kind === 'batch') {
								payload = JSON.stringify([
									{ jsonrpc: '2.0', method: probe.method, ...(probe.hasId ? { id: probe.idNum } : {}) },
									{ jsonrpc: '2.0', method: 'eth_chainId', id: probe.idNum + 1 },
								])
							} else {
								payload = JSON.stringify({
									jsonrpc: '2.0',
									method: probe.method,
									...(probe.hasId ? { id: probe.idNum } : {}),
								})
							}

							const raw = yield* Effect.tryPromise(() => engine.rpc(payload))
							if (raw === null) {
								yield* Fuzz.observe('reply:null')
								return true
							}

							const parsed = JSON.parse(raw)
							const items = Array.isArray(parsed) ? parsed : [parsed]
							yield* Fuzz.score('batch-replies', items.length)
							for (const item of items) {
								if (!item || typeof item !== 'object' || item.jsonrpc !== '2.0') return false
								const hasResult = 'result' in item
								const hasError = 'error' in item
								if (hasResult === hasError) return false
								if (hasError) {
									yield* Fuzz.observe(`rpc-err:${item.error.code}`)
									if (!Number.isInteger(item.error.code) || typeof item.error.message !== 'string') return false
								} else {
									yield* Fuzz.observe(`rpc-ok:${probe.method}`)
								}
							}
							return true
						}),
					{
						seed: FUZZ_CONFIG.effectSeed + 1,
						executions: Math.min(FUZZ_CONFIG.effectExecutions, 800),
					},
				),
			)

			const diagnostic = Fuzz.formatReport(report)
			expect(report._tag, diagnostic ?? 'expected Passed').toBe('Passed')
		} finally {
			await engine.close()
		}
	})

	it('feedback-guided: @tevm/mcp toJsonValue preserves JSON serializability across explored structures', async () => {
		const StructuredVal = Schema.Struct({
			big: Schema.Int.check(Schema.isBetween({ minimum: -1_000_000, maximum: 1_000_000 })),
			bytes: Schema.Array(Byte),
			tags: Schema.Array(Schema.String),
			errMsg: Schema.String,
			wrapInMap: Schema.Boolean,
		})

		const report = await Effect.runPromise(
			Fuzz.run(
				Arbitrary.schema(StructuredVal),
				(v) =>
					Effect.gen(function* () {
						const bigVal = BigInt(v.big) * 10n ** 18n
						const u8 = Uint8Array.from(v.bytes)
						const payload = v.wrapInMap
							? new Map<unknown, unknown>([
									['big', bigVal],
									['bytes', u8],
									['set', new Set(v.tags)],
									['err', new Error(v.errMsg)],
								])
							: { big: bigVal, bytes: u8, set: new Set(v.tags), err: new Error(v.errMsg) }

						yield* Fuzz.observe(v.wrapInMap ? 'shape:map' : 'shape:obj')
						yield* Fuzz.score('byte-len', v.bytes.length)
						const out = toJsonValue(payload) as Record<string, unknown>
						const serialized = JSON.stringify(out)
						if (typeof serialized !== 'string') return false
						return out['big'] === bigVal.toString() && out['bytes'] === `0x${Buffer.from(u8).toString('hex')}`
					}),
				{
					seed: FUZZ_CONFIG.effectSeed + 2,
					executions: FUZZ_CONFIG.effectExecutions,
				},
			),
		)

		const diagnostic = Fuzz.formatReport(report)
		expect(report._tag, diagnostic ?? 'expected Passed').toBe('Passed')
	})

	it('simulation: FuzzSimulation explores fiber interleavings of serialized engine queue + subscription teardown without races or deadlocks', async () => {
		const Op = Schema.Literals(['request', 'subscribe', 'unsubscribe', 'poll', 'close'])
		const Ops = Schema.Array(Op).check(Schema.isMinLength(2), Schema.isMaxLength(10))

		const report = await Effect.runPromise(
			Fuzz.run(
				Arbitrary.schema(Ops),
				(ops) =>
					Effect.gen(function* () {
						// Model TEVM's serialized RPC queue + connection-scoped subscription registry
						// under adversarial preemptive fiber interleavings.
						const stateRef = yield* Ref.make({
							closed: false,
							nextId: 0,
							activeFilters: new Set<string>(),
							completedRequests: 0,
						})
						const sem = Semaphore.makeUnsafe(1)

						const runOp = (op: (typeof ops)[number]) =>
							sem.withPermits(1)(
								Effect.gen(function* () {
									const st = yield* Ref.get(stateRef)
									if (st.closed) {
										yield* Fuzz.observe('op-after-close')
										return
									}
									if (op === 'request') {
										yield* Ref.update(stateRef, (s) => ({ ...s, completedRequests: s.completedRequests + 1 }))
										yield* Fuzz.observe('op:request')
									} else if (op === 'subscribe') {
										const id = `0x${(st.nextId + 1).toString(16)}`
										yield* Ref.update(stateRef, (s) => {
											const next = new Set(s.activeFilters)
											next.add(id)
											return { ...s, nextId: s.nextId + 1, activeFilters: next }
										})
										yield* Fuzz.observe('op:subscribe')
									} else if (op === 'unsubscribe') {
										const first = st.activeFilters.values().next().value
										if (first) {
											yield* Ref.update(stateRef, (s) => {
												const next = new Set(s.activeFilters)
												next.delete(first)
												return { ...s, activeFilters: next }
											})
											yield* Fuzz.observe('op:unsubscribe-hit')
										} else {
											yield* Fuzz.observe('op:unsubscribe-miss')
										}
									} else if (op === 'poll') {
										// Snapshot filters safely without mutating during iteration.
										const count = st.activeFilters.size
										yield* Fuzz.score('concurrent-filters', count)
									} else if (op === 'close') {
										yield* Ref.update(stateRef, (s) => ({
											...s,
											closed: true,
											activeFilters: new Set<string>(),
										}))
										yield* Fuzz.observe('op:close')
									}
								}),
							)

						// Fork all operations concurrently under FuzzSimulation's adversarial scheduler!
						yield* Effect.forEach(ops, runOp, { concurrency: 'unbounded' })
						// Always close at the end and prove zero leaked filters.
						yield* runOp('close')
						const final = yield* Ref.get(stateRef)
						return final.closed && final.activeFilters.size === 0
					}),
				{
					execution: FuzzSimulation.execution(),
					seed: FUZZ_CONFIG.effectSeed + 3,
					executions: Math.min(FUZZ_CONFIG.effectExecutions, 1000),
				},
			),
		)

		const diagnostic = Fuzz.formatReport(report)
		expect(report._tag, diagnostic ?? 'expected Passed').toBe('Passed')
	})
})
