import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { createCache } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

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

let tempDir: string
let solPath: string
let cache: ReturnType<typeof createCache>

const sampleArtifacts = {
	artifacts: {
		Counter: {
			contractName: 'Counter',
			abi: [{ type: 'function', name: 'count', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
			userdoc: {},
			evm: { bytecode: { object: '6080604052' }, deployedBytecode: { object: '6080604052' } },
		},
	},
	modules: {} as Record<string, any>,
	solcInput: { language: 'Solidity', sources: {} },
	solcOutput: { contracts: {} },
}

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-bundler-cache-bench-'))
	solPath = join(tempDir, 'Counter.sol')
	writeFileSync(solPath, 'pragma solidity ^0.8.20; contract Counter { uint256 public count; }')
	sampleArtifacts.modules[solPath] = { id: solPath, rawCode: 'pragma solidity ^0.8.20;', code: 'pragma solidity ^0.8.20;', importedIds: [] }
	cache = createCache('.tevm', fao as any, tempDir)
	cache.writeArtifactsSync(solPath, sampleArtifacts as any, 'bench-fp-1')
	cache.writeDtsSync(solPath, 'export declare const Counter: unknown;\n')
	cache.writeMjsSync(solPath, 'export const Counter = {};\n')
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/bundler-cache', () => {
	bench(
		'readArtifactsSync (cache hit)',
		() => {
			const hit = cache.readArtifactsSync(solPath, 'bench-fp-1')
			if (!hit) throw new Error('expected cache hit')
		},
		benchOpts,
	)

	bench(
		'readArtifacts async (cache hit)',
		async () => {
			const hit = await cache.readArtifacts(solPath, 'bench-fp-1')
			if (!hit) throw new Error('expected cache hit')
		},
		benchOpts,
	)

	bench(
		'writeArtifactsSync',
		() => {
			const p = cache.writeArtifactsSync(solPath, sampleArtifacts as any, 'bench-fp-1')
			if (!p) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'readDtsSync + readMjsSync',
		() => {
			const dts = cache.readDtsSync(solPath)
			const mjs = cache.readMjsSync(solPath)
			if (!dts || !mjs) throw new Error('unexpected')
		},
		benchOpts,
	)
})
