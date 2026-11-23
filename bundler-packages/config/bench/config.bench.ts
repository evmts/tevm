import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runPromise } from 'effect/Effect'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { defineConfig, loadConfig } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

let tempDir: string

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-config-bench-'))
	writeFileSync(
		join(tempDir, 'tevm.config.json'),
		JSON.stringify({
			libs: ['lib'],
			remappings: { '@openzeppelin/': 'lib/openzeppelin/' },
			cacheDir: '.tevm',
		}),
	)
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/config', () => {
	bench(
		'defineConfig().configFn()',
		async () => {
			const cfg = await runPromise(
				defineConfig(() => ({
					libs: ['lib'],
					remappings: { '@oz/': 'lib/oz/' },
				})).configFn(tempDir),
			)
			if (!cfg.cacheDir) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'loadConfig (from tevm.config.json)',
		async () => {
			const cfg = await runPromise(loadConfig(tempDir))
			if (!cfg.cacheDir) throw new Error('unexpected')
		},
		benchOpts,
	)
})
