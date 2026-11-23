import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { verifyPack, verifyStatic, workspacePackages } from './verify-publish-smoke.mjs'

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'publish-smoke-test-'))
	symlinkSync(join(import.meta.dirname, '../../node_modules'), join(root, 'node_modules'), 'dir')
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const packages = []
	function write(path, content) {
		const file = join(root, path)
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, content)
	}
	function add(dir, name, exports, fields = {}) {
		const manifest = { name, version: '1.0.0', type: 'module', exports, ...fields }
		write(join(dir, 'package.json'), JSON.stringify(manifest))
		packages.push({ dir: join(root, dir), manifest })
	}
	return { root, packages, write, add }
}

function staticFixture(t) {
	const repo = fixture(t)
	repo.add('common', '@tevm/common', './dist/index.js')
	repo.write('common/tsup.config.ts', "export default { entry: ['src/index.ts'] }")
	repo.write('common/src/index.ts', "export type { Chain } from 'viem'; export { foundry } from 'viem/chains';")
	repo.add('errors', '@tevm/errors', {
		'.': { import: { types: './dist/index.d.ts', default: './dist/index.js' }, require: './dist/index.cjs' },
		'./client': './dist/client.js',
	})
	repo.write('errors/dist/index.js', "export * from './client.js';")
	repo.write('errors/dist/client.js', 'export class NoSignerAvailableError extends Error {}')
	repo.write('errors/dist/index.cjs', "Object.defineProperty(exports, 'NoSignerAvailableError', { get: () => Error });")
	repo.write('errors/dist/index.d.ts', 'export declare class NoSignerAvailableError extends Error {}')
	repo.add('actions', '@tevm/actions', './dist/index.js')
	repo.write(
		'actions/dist/index.js',
		"import { NoSignerAvailableError as SignerError } from '@tevm/errors'; export const error = new SignerError();",
	)
	repo.write(
		'actions/dist/index.cjs',
		"const errors = require('@tevm/errors'); exports.error = new errors.NoSignerAvailableError();",
	)
	repo.write('actions/dist/index.d.ts', "export type ErrorType = import('@tevm/errors').NoSignerAvailableError;")
	return repo
}

test('checks local build entries, ESM star re-exports, CJS property access, and declarations', (t) => {
	const { root, packages } = staticFixture(t)
	const result = verifyStatic(root, packages)
	assert.deepEqual(result.findings, [])
	assert.equal(result.builtCount, 7)
	assert.equal(result.commonEntry, 'common/src/index.ts')
	assert.match(result.viemVersion, /^2\./)
})

test('reports stale symbols by file and export condition and rejects absent subpaths', (t) => {
	const { root, packages, write } = staticFixture(t)
	write('errors/dist/index.js', "export { WrongError as NoSignerAvailableError } from './client.js';")
	write('errors/dist/client.js', 'export class DifferentError extends Error {}')
	write('errors/dist/index.cjs', 'exports.DifferentError = Error;')
	write('errors/dist/index.d.ts', 'export declare class DifferentError extends Error {}')
	write(
		'actions/dist/chunk.js',
		"import * as errors from '@tevm/errors'; export const error = new errors.NoSignerAvailableError(); export { default } from '@tevm/errors/private';",
	)
	assert.deepEqual(verifyStatic(root, packages).findings, [
		'actions/dist/chunk.js: import @tevm/errors: missing export "NoSignerAvailableError"',
		'actions/dist/chunk.js: import @tevm/errors/private: cannot resolve workspace export',
		'actions/dist/index.cjs: require @tevm/errors: missing export "NoSignerAvailableError"',
		'actions/dist/index.d.ts: import types @tevm/errors: missing export "NoSignerAvailableError"',
		'actions/dist/index.js: import @tevm/errors: missing export "NoSignerAvailableError"',
	])
})

test('checks the actual common package when built and reports orphan viem exports', (t) => {
	const { root, packages, write } = staticFixture(t)
	write('common/dist/index.js', "export { noSuchViemChain as tevmDefault } from 'viem/chains';")
	const result = verifyStatic(root, packages)
	assert.equal(result.commonEntry, 'common/dist/index.js')
	assert.equal(result.findings.length, 1)
	assert.match(
		result.findings[0],
		/@tevm\/common against installed viem.+?ESM import @tevm\/common:[\s\S]+noSuchViemChain/,
	)
})

test('reports an undeclared build output and a nested tarball, and ignores dependency contents', (t) => {
	const { root, packages, write } = staticFixture(t)
	packages[0].manifest.exports = './dist/typo.js'
	write('errors/.artifacts/stale.tgz', '')
	write('errors/node_modules/ignored.tgz', '')
	assert.deepEqual(verifyStatic(root, packages).findings, [
		'@tevm/common exports .: missing target ./dist/typo.js',
		'errors/.artifacts/stale.tgz: stray tarball',
		'@tevm/common against installed viem: missing ESM entry ./dist/typo.js',
	])
})

function packFixture(t) {
	const repo = fixture(t)
	repo.write('package.json', JSON.stringify({ name: 'smoke-test-workspace', private: true }))
	repo.write('pnpm-workspace.yaml', 'packages:\n  - common\n  - facade\n  - runner\n')
	repo.add('common', '@tevm/common', './index.js')
	repo.write('common/index.js', 'export const getBlockNumber = () => Promise.resolve(0n);')
	repo.add(
		'facade',
		'tevm',
		{
			import: { types: './index.d.ts', default: './index.js' },
			require: { types: './index.d.cts', default: './index.cjs' },
		},
		{ dependencies: { '@tevm/common': 'workspace:^' } },
	)
	mkdirSync(join(repo.root, 'facade/node_modules/@tevm'), { recursive: true })
	symlinkSync(join(repo.root, 'common'), join(repo.root, 'facade/node_modules/@tevm/common'), 'dir')
	repo.write(
		'facade/index.js',
		"import { getBlockNumber } from '@tevm/common'; export const createMemoryClient = () => ({ getBlockNumber });",
	)
	repo.write(
		'facade/index.cjs',
		"const { getBlockNumber } = require('@tevm/common'); exports.createMemoryClient = () => ({ getBlockNumber });",
	)
	for (const extension of ['ts', 'cts']) {
		repo.write(
			`facade/index.d.${extension}`,
			'export declare function createMemoryClient(): { getBlockNumber(): Promise<bigint> };',
		)
	}
	return repo
}

test('packs and consumes local tarballs through both runtime and type conditions', (t) => {
	const { root } = packFixture(t)
	assert.equal(verifyPack(root, workspacePackages(root), root), 2)
})

test('rejects an exports target excluded from the packed file list', (t) => {
	const { root, packages, write } = packFixture(t)
	const manifest = { ...packages[0].manifest, files: ['other.js'] }
	write('common/package.json', JSON.stringify(manifest))
	write('common/other.js', 'export {}')
	assert.throws(
		() => verifyPack(root, workspacePackages(root), root),
		/@tevm\/common exports \.: missing target \.\/index\.js/,
	)
})

test('checks every declared entry point of the packed, unscoped tevm-run', (t) => {
	const { root, add, write } = packFixture(t)
	add('runner', 'tevm-run', './index.js', {
		files: ['index.js'],
		bin: { 'tevm-run': 'cli.js' },
		main: 'main.cjs',
		module: 'esm.js',
		types: 'index.d.ts',
	})
	write('runner/index.js', 'export {}')
	// Each entry exists locally, but only the export and npm's mandatory main/bin files are shipped.
	for (const file of ['cli.js', 'main.cjs', 'esm.js', 'index.d.ts']) write(`runner/${file}`, '')
	assert.throws(
		() => verifyPack(root, workspacePackages(root), root),
		(error) => error.message.includes('tevm-run module:') && error.message.includes('tevm-run types:'),
	)
	rmSync(join(root, 'runner/cli.js'))
	rmSync(join(root, 'runner/main.cjs'))
	assert.throws(
		() => verifyPack(root, workspacePackages(root), root),
		(error) => error.message.includes('tevm-run bin.tevm-run:') && error.message.includes('tevm-run main:'),
	)
})
