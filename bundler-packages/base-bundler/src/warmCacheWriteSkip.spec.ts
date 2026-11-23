import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCache } from '@tevm/bundler-cache'
import { defaultConfig } from '@tevm/config'
import solc from 'solc'
import { afterEach, describe, expect, it } from 'vitest'
import { bundler } from './bundler.js'

const realFao = {
	existsSync,
	readFileSync,
	readFile: (path: string, encoding: BufferEncoding) => readFile(path, { encoding }),
	writeFileSync,
	writeFile,
	statSync,
	stat,
	mkdirSync,
	mkdir,
	exists: async (path: string) => {
		try {
			await access(path)
			return true
		} catch {
			return false
		}
	},
}

const silentLogger = {
	error: () => {},
	warn: () => {},
	info: () => {},
	log: () => {},
}

describe('warm-cache write avoidance', () => {
	const tempDirs: Array<string> = []

	afterEach(() => {
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('persists artifacts on cold resolution and skips cache writes on warm async and sync hits', async () => {
		const workspace = mkdtempSync(join(tmpdir(), 'tevm-base-bundler-warm-'))
		tempDirs.push(workspace)
		const cacheDir = join(workspace, '.tevm')
		const solPath = join(workspace, 'Counter.sol')
		const syncSolPath = join(workspace, 'SyncCounter.sol')
		const source =
			'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Counter { uint256 public count; function inc() public { count += 1; } }\n'
		writeFileSync(solPath, source)
		writeFileSync(syncSolPath, source)

		const realCache = createCache(cacheDir, realFao, workspace)
		const pendingWrites: Array<Promise<unknown>> = []
		let asyncWrites = 0
		let syncWrites = 0
		const trackAsync = <T>(promise: Promise<T>): Promise<T> => {
			asyncWrites += 1
			pendingWrites.push(promise)
			return promise
		}
		const instrumentedCache = {
			...realCache,
			writeArtifacts: (...args: Parameters<typeof realCache.writeArtifacts>) =>
				trackAsync(realCache.writeArtifacts(...args)),
			writeMjs: (...args: Parameters<typeof realCache.writeMjs>) => trackAsync(realCache.writeMjs(...args)),
			writeDts: (...args: Parameters<typeof realCache.writeDts>) => trackAsync(realCache.writeDts(...args)),
			writeArtifactsSync: (...args: Parameters<typeof realCache.writeArtifactsSync>) => {
				syncWrites += 1
				return realCache.writeArtifactsSync(...args)
			},
			writeMjsSync: (...args: Parameters<typeof realCache.writeMjsSync>) => {
				syncWrites += 1
				return realCache.writeMjsSync(...args)
			},
			writeDtsSync: (...args: Parameters<typeof realCache.writeDtsSync>) => {
				syncWrites += 1
				return realCache.writeDtsSync(...args)
			},
		}

		const resolved = bundler(
			{ ...defaultConfig, cacheDir: '.tevm' },
			silentLogger,
			realFao,
			solc,
			instrumentedCache,
			'@tevm/contract',
		)

		// Cold async resolution compiles and schedules non-blocking cache writes.
		const coldAsync = await resolved.resolveEsmModule(solPath, workspace, false, true)
		await Promise.all(pendingWrites.splice(0))
		expect(coldAsync.code).toContain('Counter')
		expect(asyncWrites).toBeGreaterThan(0)

		// Warm async resolution (including concurrent calls) must not rewrite cache files.
		const writesAfterColdAsync = asyncWrites
		const [warmAsync1, warmAsync2] = await Promise.all([
			resolved.resolveEsmModule(solPath, workspace, false, true),
			resolved.resolveEsmModule(solPath, workspace, false, true),
		])
		await Promise.all(pendingWrites.splice(0))
		expect(warmAsync1.code).toBe(coldAsync.code)
		expect(warmAsync2.code).toBe(coldAsync.code)
		expect(asyncWrites).toBe(writesAfterColdAsync)

		// Cold sync resolution persists artifacts; subsequent warm sync hit skips writes.
		const coldSync = resolved.resolveEsmModuleSync(syncSolPath, workspace, false, true)
		expect(coldSync.code).toContain('Counter')
		expect(syncWrites).toBeGreaterThan(0)

		const writesAfterColdSync = syncWrites
		const warmSync = resolved.resolveEsmModuleSync(syncSolPath, workspace, false, true)
		expect(warmSync.code).toBe(coldSync.code)
		expect(syncWrites).toBe(writesAfterColdSync)
	})
})
