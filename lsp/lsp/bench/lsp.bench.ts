import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { language } from '../src/language.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 3, throws: true }

const solCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter { uint256 public count; function inc() external { count += 1; } }
`

const makeSnapshot = (text: string) => ({
	getText: (start: number, end: number) => text.slice(start, end),
	getLength: () => text.length,
	getChangeRange: () => undefined,
})

let tempDir: string
let solPath: string

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-lsp-bench-'))
	writeFileSync(join(tempDir, 'tevm.config.json'), JSON.stringify({ cacheDir: '.tevm' }))
	solPath = join(tempDir, 'Counter.sol')
	writeFileSync(solPath, solCode)
	// Warm disk cache
	language.createVirtualCode?.({ path: solPath, fsPath: solPath } as any, 'solidity', makeSnapshot(solCode))
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/lsp', () => {
	bench(
		'language.getLanguageId (.sol & .ts)',
		() => {
			const a = language.getLanguageId({ path: '/a/Counter.sol' } as any)
			const b = language.getLanguageId({ path: '/a/index.ts' } as any)
			if (a !== 'solidity' || b !== undefined) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'language.createVirtualCode (warm SolFile)',
		() => {
			const vf = language.createVirtualCode?.(
				{ path: solPath, fsPath: solPath } as any,
				'solidity',
				makeSnapshot(solCode),
			)
			if (!vf) throw new Error('unexpected')
		},
		benchOpts,
	)
})
