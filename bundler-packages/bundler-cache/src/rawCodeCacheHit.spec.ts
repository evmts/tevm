import * as fs from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ResolvedArtifacts } from '@tevm/compiler'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readArtifacts } from './readArtifacts.js'
import { readArtifactsSync } from './readArtifactsSync.js'
import type { FileAccessObject } from './types.js'
import { writeArtifacts } from './writeArtifacts.js'
import { writeArtifactsSync } from './writeArtifactsSync.js'

const fao: FileAccessObject = {
	writeFileSync: fs.writeFileSync,
	writeFile: fsPromises.writeFile,
	readFile: (path, encoding) => fsPromises.readFile(path, encoding),
	readFileSync: (path, encoding) => fs.readFileSync(path, encoding),
	exists: async (path) => fs.existsSync(path),
	existsSync: fs.existsSync,
	statSync: fs.statSync,
	stat: fsPromises.stat,
	mkdirSync: fs.mkdirSync,
	mkdir: fsPromises.mkdir,
	renameSync: fs.renameSync,
	rename: fsPromises.rename,
}

let dir: string
let entry: string
let dep: string

/**
 * Builds artifacts the way `compileContract` does: solc receives `module.code`, where
 * imports point at absolute paths, while `module.rawCode` is the file as read from disk.
 */
const build = (): ResolvedArtifacts => {
	const entryRaw = fs.readFileSync(entry, 'utf8')
	const depRaw = fs.readFileSync(dep, 'utf8')
	const entryCode = entryRaw.replace('"./B.sol"', JSON.stringify(dep))
	expect(entryCode).not.toBe(entryRaw)
	return {
		artifacts: {},
		modules: {
			[entry]: { id: entry, rawCode: entryRaw, code: entryCode, importedIds: [dep] },
			[dep]: { id: dep, rawCode: depRaw, code: depRaw, importedIds: [] },
		},
		asts: undefined,
		solcInput: {
			language: 'Solidity',
			settings: {},
			sources: { [entry]: { content: entryCode }, [dep]: { content: depRaw } },
		},
		solcOutput: {},
	} as unknown as ResolvedArtifacts
}

beforeEach(() => {
	dir = fs.mkdtempSync(join(tmpdir(), 'tevm-cache-hit-'))
	entry = join(dir, 'A.sol')
	dep = join(dir, 'B.sol')
	fs.writeFileSync(entry, 'pragma solidity ^0.8.0;\nimport "./B.sol";\ncontract A is B {}\n')
	fs.writeFileSync(dep, 'pragma solidity ^0.8.0;\ncontract B {}\n')
})

afterEach(() => {
	fs.rmSync(dir, { recursive: true, force: true })
})

describe('cache content hashes use the raw source bytes', () => {
	it('hits the cache on a second async build of an unchanged multi-file contract', async () => {
		await writeArtifacts(dir, '.tevm', entry, build(), fao, 'fp')
		expect(await readArtifacts('.tevm', fao, dir, entry, 'fp')).toBeDefined()
	})

	it('hits the cache on a second sync build of an unchanged multi-file contract', () => {
		writeArtifactsSync(dir, '.tevm', entry, build(), fao, 'fp')
		expect(readArtifactsSync('.tevm', fao, dir, entry, 'fp')).toBeDefined()
	})

	it('still misses when a source changes without changing its size or mtime', async () => {
		await writeArtifacts(dir, '.tevm', entry, build(), fao, 'fp')
		const { mtime, atime } = fs.statSync(dep)
		fs.writeFileSync(dep, fs.readFileSync(dep, 'utf8').replace('contract B', 'contract C'))
		fs.utimesSync(dep, atime, mtime)
		expect(await readArtifacts('.tevm', fao, dir, entry, 'fp')).toBeUndefined()
		expect(readArtifactsSync('.tevm', fao, dir, entry, 'fp')).toBeUndefined()
	})
})
