import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { tevmUnplugin } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 3, throws: true }

let tempDir: string
let solPath: string
let plugin: any

const pluginCtx = { addWatchFile: () => {} }

beforeAll(async () => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-unplugin-bench-'))
	solPath = join(tempDir, 'Counter.sol')
	writeFileSync(
		solPath,
		`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter { uint256 public count; function inc() external { count += 1; } }
`,
	)
	plugin = tevmUnplugin({}, { framework: 'vite' } as any)
	await plugin.buildStart?.()
	await plugin.load?.call(pluginCtx, solPath)
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/unplugin', () => {
	bench(
		'tevmUnplugin() creation',
		() => {
			const p = tevmUnplugin({}, { framework: 'vite' } as any)
			if (!p.name) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'loadInclude() filter check (.sol vs .ts)',
		() => {
			const a = plugin.loadInclude?.(solPath)
			const b = plugin.loadInclude?.('/tmp/index.ts')
			if (!a || b) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'load() warm-cache Solidity transform',
		async () => {
			const out = await plugin.load?.call(pluginCtx, solPath)
			if (!out || typeof out !== 'string') throw new Error('unexpected')
		},
		benchOpts,
	)
})
