import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
	vi.unstubAllEnvs()
	vi.resetModules()
})

it('honors each explicit campaign budget over the property default', async () => {
	vi.stubEnv('TEVM_FUZZ_MODE', 'campaign')
	vi.stubEnv('TEVM_FUZZ_RUNS', '501')
	vi.stubEnv('TEVM_FUZZ_IO_RUNS', '121')
	vi.stubEnv('TEVM_FUZZ_MODEL_RUNS', '51')
	const { fcParams } = await import('./config.js')
	expect(fcParams('pure', { numRuns: 10 }).numRuns).toBe(501)
	expect(fcParams('io', { numRuns: 10 }).numRuns).toBe(121)
	expect(fcParams('model', { numRuns: 10 }).numRuns).toBe(51)
})

it('uses the property default when there is no valid environment budget', async () => {
	vi.stubEnv('TEVM_FUZZ_RUNS', undefined)
	vi.stubEnv('TEVM_FUZZ_IO_RUNS', '0')
	const { fcParams } = await import('./config.js')
	expect(fcParams('pure', { numRuns: 15 }).numRuns).toBe(15)
	expect(fcParams('io', { numRuns: 8 }).numRuns).toBe(8)
	expect(fcParams('pure').numRuns).toBe(250)
})
