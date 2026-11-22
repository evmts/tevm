import { defaultConfig } from '@tevm/config'
import { createLogger } from '@tevm/logger'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import solc from 'solc'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { resolveArtifacts, resolveArtifactsSync } from '../src/index.js'

const benchOpts = { time: 400, warmupTime: 100, warmupIterations: 2, throws: true }

const fao = {
	readFileSync,
	readFile: (p: string, enc: BufferEncoding) => readFile(p, { encoding: enc }),
	existsSync,
	exists: async (p: string) => existsSync(p),
}
const logger = createLogger({ name: 'compiler-bench', level: 'silent' })

let tempDir: string
let solPath: string

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-compiler-bench-'))
	solPath = join(tempDir, 'Counter.sol')
	writeFileSync(
		solPath,
		`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter {
	uint256 public count;
	function inc() external { count += 1; }
	function get() external view returns (uint256) { return count; }
}
`,
	)
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/compiler', () => {
	bench(
		'resolveArtifactsSync (Counter.sol)',
		() => {
			const res = resolveArtifactsSync(solPath, tempDir, logger, defaultConfig, true, true, fao, solc)
			if (!res.artifacts?.Counter) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'resolveArtifacts async (Counter.sol)',
		async () => {
			const res = await resolveArtifacts(solPath, tempDir, logger, defaultConfig, true, true, fao, solc)
			if (!res.artifacts?.Counter) throw new Error('unexpected')
		},
		benchOpts,
	)
})
