import { createCache } from '@tevm/bundler-cache'
import { defaultConfig } from '@tevm/config'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import solc from 'solc'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { bundler, getContractPath } from '../src/index.js'

const benchOpts = { time: 250, warmupTime: 60, warmupIterations: 3, throws: true }

const fao = {
	existsSync,
	exists: async (p: string) => existsSync(p),
	readFile: (p: string, enc: BufferEncoding) => readFile(p, { encoding: enc }),
	readFileSync,
	writeFileSync,
	writeFile,
	statSync,
	stat,
	mkdirSync,
	mkdir,
}
const silentLogger = { error: () => {}, warn: () => {}, info: () => {}, log: () => {} }

let tempDir: string
let solPath: string
let tevmBundler: ReturnType<typeof bundler>

beforeAll(async () => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-base-bundler-bench-'))
	solPath = join(tempDir, 'Counter.sol')
	writeFileSync(
		solPath,
		`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter {
	uint256 public count;
	function inc() external { count += 1; }
}
`,
	)
	const cache = createCache('.tevm', fao as any, tempDir)
	tevmBundler = bundler(defaultConfig, silentLogger, fao as any, solc, cache, 'tevm/contract')
	// Warm cache for cache-hit benchmarks
	await tevmBundler.resolveEsmModule(solPath, tempDir, true, true)
	tevmBundler.resolveDtsSync(solPath, tempDir, true, true)
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/base-bundler', () => {
	bench(
		'getContractPath normalization',
		() => {
			const p = getContractPath(solPath)
			if (!p) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'resolveEsmModuleSync (warm cache)',
		() => {
			const res = tevmBundler.resolveEsmModuleSync(solPath, tempDir, true, true)
			if (!res.code.includes('Counter')) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'resolveEsmModule async (warm cache)',
		async () => {
			const res = await tevmBundler.resolveEsmModule(solPath, tempDir, true, true)
			if (!res.code.includes('Counter')) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'resolveDtsSync (warm cache)',
		() => {
			const res = tevmBundler.resolveDtsSync(solPath, tempDir, true, true)
			if (!res.code.includes('Counter')) throw new Error('unexpected')
		},
		benchOpts,
	)
})
