import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { bundler, type FileAccessObject } from '@tevm/base-bundler'
import { createCache } from '@tevm/bundler-cache'
import { loadConfig } from '@tevm/config'
import type { IScriptSnapshot, VirtualCode } from '@volar/language-core'
import { runSync } from 'effect/Effect'
import path from 'node:path'
import solc from 'solc'

const hashText = (text: string): number => {
	let hash = 0
	for (let i = 0; i < text.length; i++) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0
	}
	return hash
}

export class SolFile implements VirtualCode {
	readonly id = 'tevm-solidity'
	readonly languageId = 'typescript'
	mappings: VirtualCode['mappings'] = []
	embeddedCodes: VirtualCode[] = []
	snapshot: IScriptSnapshot

	constructor(
		public readonly fileName: string,
		sourceSnapshot: IScriptSnapshot,
	) {
		this.snapshot = sourceSnapshot
		this.update(sourceSnapshot)
	}

	public update(sourceSnapshot: IScriptSnapshot) {
		const projectRoot = path.dirname(this.fileName)
		const c = runSync(loadConfig(projectRoot))
		const snapshotText = sourceSnapshot.getText(0, sourceSnapshot.getLength())
		const snapshotMtimeMs = hashText(snapshotText)
		const activeFilePath = path.resolve(this.fileName)
		const isActiveFile = (fileName: string) =>
			path.resolve(fileName) === activeFilePath || path.resolve(projectRoot, fileName) === activeFilePath
		const fao = {
			exists: async (fileName: string) => isActiveFile(fileName) || existsSync(fileName),
			existsSync: (fileName: string) => isActiveFile(fileName) || existsSync(fileName),
			mkdir,
			mkdirSync,
			readFile: (fileName: string, encoding: BufferEncoding) => {
				if (isActiveFile(fileName)) {
					return Promise.resolve(snapshotText)
				}
				return readFile(fileName, { encoding })
			},
			readFileSync: (fileName: string, encoding: BufferEncoding) => {
				if (isActiveFile(fileName)) {
					return snapshotText
				}
				return readFileSync(fileName, { encoding })
			},
			stat: async (fileName: string) => {
				if (!isActiveFile(fileName)) {
					return stat(fileName)
				}
				try {
					return { ...(await stat(fileName)), mtimeMs: snapshotMtimeMs } as Awaited<ReturnType<typeof stat>>
				} catch (_e) {
					return { mtimeMs: snapshotMtimeMs } as any
				}
			},
			statSync: (fileName: string) => {
				if (!isActiveFile(fileName)) {
					return statSync(fileName)
				}
				try {
					return { ...statSync(fileName), mtimeMs: snapshotMtimeMs } as ReturnType<typeof statSync>
				} catch (_e) {
					return { mtimeMs: snapshotMtimeMs } as any
				}
			},
			writeFile,
			writeFileSync,
		} as unknown as FileAccessObject
		const cache = createCache(c.cacheDir, fao, projectRoot)
		const b = bundler(
			c,
			console,
			fao,
			solc,
			cache,
		)
		const tsFile = b.resolveTsModuleSync(this.fileName, projectRoot, false, false)
		this.snapshot = {
			getText(start, end) {
				return tsFile.code.substring(start, end)
			},
			getLength() {
				return tsFile.code.length
			},
			getChangeRange() {
				return undefined
			},
		}
	}
}
