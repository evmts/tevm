import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Parameters } from 'fast-check'

const here = dirname(fileURLToPath(import.meta.url))

export const FUZZ_ROOT = resolve(here, '..')
export const FUZZ_CORPUS_DIR = resolve(FUZZ_ROOT, '__fuzz__')

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
	if (!raw) return fallback
	const parsed = Number.parseInt(raw, 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const parseOptionalInt = (raw: string | undefined): number | undefined => {
	if (!raw) return undefined
	const parsed = Number.parseInt(raw, 10)
	return Number.isFinite(parsed) ? parsed : undefined
}

export const FUZZ_CONFIG = {
	mode: process.env['TEVM_FUZZ_MODE'] === 'campaign' ? 'campaign' : 'ci',
	seed: parseOptionalInt(process.env['TEVM_FUZZ_SEED']),
	/** Standard pure-function property runs per test */
	pureRuns: parsePositiveInt(process.env['TEVM_FUZZ_RUNS'], 250),
	/** I/O / native-node / loopback server property runs per test */
	ioRuns: parsePositiveInt(process.env['TEVM_FUZZ_IO_RUNS'], 60),
	/** Stateful model-based command-sequence runs per test */
	modelRuns: parsePositiveInt(process.env['TEVM_FUZZ_MODEL_RUNS'], 25),
	/** Max commands per stateful model run */
	maxCommands: parsePositiveInt(process.env['TEVM_FUZZ_MAX_COMMANDS'], 30),
	/** Effect @smthrs/fuzz execution budget per target */
	effectExecutions: parsePositiveInt(process.env['TEVM_FUZZ_EFFECT_EXECUTIONS'], 1500),
	/** Effect @smthrs/fuzz seed (deterministic by default in CI) */
	effectSeed: parsePositiveInt(process.env['TEVM_FUZZ_EFFECT_SEED'], 0x7e7a_f022),
} as const

export function fcParams<T = unknown>(
	tier: 'pure' | 'io' | 'model' = 'pure',
	overrides: Parameters<T> = {},
): Parameters<T> {
	const numRuns = tier === 'pure' ? FUZZ_CONFIG.pureRuns : tier === 'io' ? FUZZ_CONFIG.ioRuns : FUZZ_CONFIG.modelRuns
	return {
		numRuns,
		...(FUZZ_CONFIG.seed !== undefined ? { seed: FUZZ_CONFIG.seed } : {}),
		endOnFailure: false,
		...overrides,
	}
}
