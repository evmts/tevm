import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

const seed = Number(process.env.FUZZ_SEED ?? 0x2097)
const runs = Number(process.env.FUZZ_RUNS ?? 200)
if (!Number.isSafeInteger(seed) || !Number.isSafeInteger(runs) || runs < 1)
	throw new Error('Invalid FUZZ_SEED or FUZZ_RUNS')

export function sandbox(run) {
	const root = mkdtempSync(join(tmpdir(), 'tevm-release-fuzz-'))
	try {
		return run(root)
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
}

export function write(path, content) {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, content)
}

// Every input is a replayable sequence of bounded choices. On failure, first
// isolate a single case, then minimize its choices toward the generator's defaults.
export function property(name, generate, check, batchSize = 1) {
	test(`${name} (${runs} cases, seed ${seed})`, () => {
		let state = seed >>> 0
		function next() {
			state = (state + 0x6d2b79f5) >>> 0
			let x = Math.imul(state ^ (state >>> 15), state | 1)
			x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
			return (x ^ (x >>> 14)) >>> 0
		}
		function sample(tape, replay) {
			let index = 0
			const int = (limit) => {
				const value = replay ? (tape[index] ?? 0) % limit : next() % limit
				if (!replay) tape.push(value)
				index++
				return value
			}
			return generate({ int, pick: (items) => items[int(items.length)] })
		}
		for (let offset = 0; offset < runs; offset += batchSize) {
			const tapes = Array.from({ length: Math.min(batchSize, runs - offset) }, () => [])
			const cases = tapes.map((tape) => sample(tape, false))
			try {
				check(cases)
			} catch (error) {
				function failure(tape) {
					try {
						check([sample(tape, true)])
					} catch (cause) {
						return cause
					}
				}
				for (const [i, tape] of tapes.entries()) {
					let cause = failure(tape)
					if (!cause) continue
					for (const [j, original] of tape.entries()) {
						for (const candidate of [0, Math.floor(original / 2)]) {
							if (candidate >= tape[j]) continue
							tape[j] = candidate
							const smaller = failure(tape)
							if (smaller) {
								cause = smaller
								break
							}
							tape[j] = original
						}
					}
					throw new Error(`case ${offset + i}, shrunk input ${JSON.stringify(sample(tape, true))}`, { cause })
				}
				throw new Error(`cases ${offset}..${offset + cases.length - 1} failed together`, { cause: error })
			}
		}
	})
}
