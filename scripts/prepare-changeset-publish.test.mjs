import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
	isCoveredByNpmFiles,
	parseCliArgs,
	parseWorkspacePatterns,
	resolveWorkspaceRange,
	runPublishPrep,
	satisfiesRange,
	validateChangesetLockstep,
} from './prepare-changeset-publish.mjs'

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

/** @param {string} filePath @param {unknown} data @param {string | number} [indent] */
function writeJson(filePath, data, indent = '\t') {
	mkdirSync(dirname(filePath), { recursive: true })
	writeFileSync(filePath, `${JSON.stringify(data, null, indent)}\n`)
}

/**
 * Create an isolated temporary TEVM + sibling ZEVM workspace fixture for unit tests.
 */
function createFixtureWorkspace({ viemVersion = '2.58.4' } = {}) {
	const parent = mkdtempSync(join(tmpdir(), 'tevm-publish-prep-'))
	const repoRoot = join(parent, 'tevm')
	const zevmNpm = join(parent, 'zevm', 'npm')
	mkdirSync(repoRoot, { recursive: true })
	mkdirSync(zevmNpm, { recursive: true })

	const viem = join(repoRoot, 'node_modules', 'viem')
	writeJson(join(viem, 'package.json'), {
		name: 'viem',
		version: viemVersion,
		type: 'module',
		exports: { './package.json': './package.json', './chains': './chains.js' },
	})
	writeFileSync(join(viem, 'chains.js'), 'export const foundry = { id: 31337 }\n')

	writeFileSync(join(repoRoot, 'pnpm-workspace.yaml'), `packages:\n  - 'packages/*'\n  - 'tevm'\n  - '../zevm/npm/*'\n`)
	writeJson(join(repoRoot, 'package.json'), {
		name: '@tevm/root',
		private: true,
		devDependencies: { viem: '^2.58.4' },
	})
	writeJson(join(repoRoot, '.changeset', 'config.json'), {
		fixed: [['@tevm/*', 'tevm', 'tevm-run']],
		linked: [],
		access: 'public',
	})

	// @tevm/errors
	writeJson(join(repoRoot, 'packages', 'errors', 'package.json'), {
		name: '@tevm/errors',
		version: '1.0.0-rc.154',
		exports: {
			'./package.json': './package.json',
			'.': { import: { types: './dist/index.d.ts', default: './dist/index.js' } },
		},
		types: 'dist/index.d.ts',
		files: ['dist'],
		dependencies: { viem: '^2.58.4' },
		peerDependencies: { viem: '^2.58.4' },
		publishConfig: { access: 'public' },
	})
	mkdirSync(join(repoRoot, 'packages', 'errors', 'src'), { recursive: true })
	writeFileSync(
		join(repoRoot, 'packages', 'errors', 'src', 'index.ts'),
		`export class NoSignerAvailableError extends Error {}\nexport class BaseError extends Error {}\n`,
	)

	// @tevm/actions (imports NoSignerAvailableError from @tevm/errors)
	writeJson(join(repoRoot, 'packages', 'actions', 'package.json'), {
		name: '@tevm/actions',
		version: '1.0.0-rc.154',
		exports: {
			'./package.json': './package.json',
			'.': { import: { types: './dist/index.d.ts', default: './dist/index.js' } },
		},
		types: 'dist/index.d.ts',
		files: ['dist'],
		dependencies: { '@tevm/errors': 'workspace:^' },
		peerDependencies: { viem: '^2.58.4' },
		publishConfig: { access: 'public' },
	})
	mkdirSync(join(repoRoot, 'packages', 'actions', 'src'), { recursive: true })
	writeFileSync(
		join(repoRoot, 'packages', 'actions', 'src', 'index.ts'),
		`import { NoSignerAvailableError } from '@tevm/errors'\nexport const makeError = () => new NoSignerAvailableError()\n`,
	)

	// @tevm/common
	writeJson(join(repoRoot, 'packages', 'common', 'package.json'), {
		name: '@tevm/common',
		version: '1.0.0-rc.154',
		exports: {
			'./package.json': './package.json',
			'.': { import: { types: './dist/index.d.ts', default: './dist/index.js' } },
		},
		types: 'dist/index.d.ts',
		files: ['dist'],
		dependencies: { viem: '^2.58.4' },
		peerDependencies: { viem: '^2.58.4' },
		publishConfig: { access: 'public' },
	})
	mkdirSync(join(repoRoot, 'packages', 'common', 'src'), { recursive: true })
	writeFileSync(
		join(repoRoot, 'packages', 'common', 'src', 'index.ts'),
		`export * from 'viem/chains'\nexport { foundry as tevmDefault } from 'viem/chains'\n`,
	)

	// @tevm/node (depends on sibling @evmts/zevm)
	writeJson(join(repoRoot, 'packages', 'node', 'package.json'), {
		name: '@tevm/node',
		version: '1.0.0-rc.154',
		exports: {
			'./package.json': './package.json',
			'.': { import: { types: './dist/index.d.ts', default: './dist/index.js' } },
		},
		types: 'dist/index.d.ts',
		files: ['dist'],
		dependencies: { '@evmts/zevm': 'workspace:*', '@tevm/errors': 'workspace:^' },
		peerDependencies: { viem: '^2.58.4' },
		publishConfig: { access: 'public' },
	})
	mkdirSync(join(repoRoot, 'packages', 'node', 'src'), { recursive: true })
	writeFileSync(join(repoRoot, 'packages', 'node', 'src', 'index.ts'), `export const createZevmEngine = () => ({})\n`)

	// tevm facade
	writeJson(join(repoRoot, 'tevm', 'package.json'), {
		name: 'tevm',
		version: '1.0.0-rc.154',
		exports: {
			'./package.json': './package.json',
			'.': { import: { types: './index.d.ts', default: './index.js' } },
		},
		types: 'index.d.ts',
		files: ['index*'],
		dependencies: { '@tevm/node': 'workspace:^' },
		peerDependencies: { viem: '^2.58.4' },
		publishConfig: { access: 'public' },
	})
	writeJson(join(repoRoot, 'tevm', 'jsr.json'), {
		name: '@tevm/tevm',
		imports: { '@tevm/node': 'npm:@tevm/node@^1.0.0-rc.154', viem: 'npm:viem@^2.58.4' },
		version: '1.0.0-rc.154',
		exports: { '.': './index.js' },
	})
	writeJson(join(repoRoot, 'tevm', 'typedoc.json'), { entryPoints: ['./index.ts'] })
	writeFileSync(join(repoRoot, 'tevm', 'index.ts'), `export { createZevmEngine } from '@tevm/node'\n`)
	writeFileSync(join(repoRoot, 'tevm', 'index.d.ts'), `export { createZevmEngine } from '@tevm/node';\n`)
	writeFileSync(join(repoRoot, 'tevm', 'index.d.cts'), `export { createZevmEngine } from '@tevm/node';\n`)
	writeFileSync(join(repoRoot, 'tevm', 'index.js'), "export { createZevmEngine } from '@tevm/node'\n")
	for (const name of ['actions', 'common', 'errors', 'node']) {
		const dist = join(repoRoot, 'packages', name, 'dist')
		mkdirSync(dist)
		writeFileSync(join(dist, 'index.js'), 'export {}\n')
		writeFileSync(join(dist, 'index.d.ts'), 'export {}\n')
	}

	// Sibling @evmts/zevm
	writeJson(join(zevmNpm, 'zevm', 'package.json'), { name: '@evmts/zevm', version: '0.1.0', main: 'index.js' }, 2)

	return {
		parent,
		repoRoot,
		zevmNpm,
		cleanup: () => rmSync(parent, { recursive: true, force: true }),
	}
}

describe('helpers', () => {
	it('parses pnpm-workspace.yaml patterns and excludes negations', () => {
		const res = parseWorkspacePatterns(`packages:\n  - 'packages/*'\n  - '!packages/ignored'\n  - "../zevm/npm/*"\n`)
		assert.deepEqual(res.include, ['packages/*', '../zevm/npm/*'])
		assert.deepEqual(res.exclude, ['packages/ignored'])
	})

	it('evaluates npm files coverage, semver ranges, and workspace resolution', () => {
		assert.equal(isCoveredByNpmFiles('./dist/index.js', ['dist']), true)
		assert.equal(isCoveredByNpmFiles('./dist/index.spec.js', ['dist', '!dist/**/*.spec.js']), false)
		assert.equal(isCoveredByNpmFiles('./package.json', ['dist']), true)
		assert.equal(resolveWorkspaceRange('workspace:*', '0.1.0'), '0.1.0')
		assert.equal(resolveWorkspaceRange('workspace:~', '0.1.0'), '~0.1.0')
		assert.equal(satisfiesRange('0.0.0', '^0.1.0'), false)
		assert.equal(satisfiesRange('0.1.0', '^0.1.0'), true)
		assert.equal(satisfiesRange('0.1.5', '^0.1.0'), true)
		assert.equal(satisfiesRange('0.2.0', '^0.1.0'), false)
	})

	it('defaults CLI to --dry-run locally and --apply --check-registry in GitHub Actions', () => {
		const local = parseCliArgs([], {})
		assert.equal(local.mode, 'dry-run')
		assert.equal(local.checkRegistry, false)
		const ci = parseCliArgs([], { GITHUB_ACTIONS: 'true' })
		assert.equal(ci.mode, 'apply')
		assert.equal(ci.checkRegistry, true)
		assert.equal(ci.checkDist, true)
	})
})

describe('publish preflight & lifecycle', () => {
	it('runs dry-run -> apply -> double-apply guard -> byte-for-byte restore -> idempotent restore', async () => {
		const fx = createFixtureWorkspace()
		try {
			const nodePkgPath = join(fx.repoRoot, 'packages', 'node', 'package.json')
			const zevmPkgPath = join(fx.zevmNpm, 'zevm', 'package.json')
			const origNode = readFileSync(nodePkgPath, 'utf8')
			const origZevm = readFileSync(zevmPkgPath, 'utf8')

			const dry = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'dry-run' })
			assert.equal(dry.ok, true)
			assert.equal(dry.edits.length, 2)
			assert.equal(readFileSync(nodePkgPath, 'utf8'), origNode)
			assert.equal(readFileSync(zevmPkgPath, 'utf8'), origZevm)

			const applied = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'apply' })
			assert.equal(applied.ok, true)
			assert.equal(JSON.parse(readFileSync(nodePkgPath, 'utf8')).dependencies['@evmts/zevm'], '0.1.0')
			assert.equal(JSON.parse(readFileSync(zevmPkgPath, 'utf8')).private, true)

			// Double-apply must fail instead of clobbering the original backup
			await assert.rejects(() => runPublishPrep({ repoRoot: fx.repoRoot, mode: 'apply' }), /Backup file already exists/)

			const restored = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'restore' })
			assert.equal(restored.restored, 2)
			assert.equal(readFileSync(nodePkgPath, 'utf8'), origNode)
			assert.equal(readFileSync(zevmPkgPath, 'utf8'), origZevm)

			// Second restore is a clean no-op
			const restoredAgain = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'restore' })
			assert.equal(restoredAgain.restored, 0)
		} finally {
			fx.cleanup()
		}
	})

	it('catches Issue #2097 missing cross-package symbol (NoSignerAvailableError)', async () => {
		const fx = createFixtureWorkspace()
		try {
			writeFileSync(
				join(fx.repoRoot, 'packages', 'errors', 'src', 'index.ts'),
				`export class BaseError extends Error {}\n`,
			)
			const res = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'dry-run' })
			assert.equal(res.ok, false)
			assert.ok(res.errors.some((e) => e.includes('NoSignerAvailableError') && e.includes('@tevm/errors')))
		} finally {
			fx.cleanup()
		}
	})

	it('rejects an installed viem outside the declared range during dist or registry checks', async (t) => {
		const fx = createFixtureWorkspace({ viemVersion: '2.49.3' })
		t.after(fx.cleanup)
		for (const checks of [{ checkDist: true }, { checkRegistry: true }]) {
			const result = await runPublishPrep({
				...checks,
				repoRoot: fx.repoRoot,
				mode: 'apply',
				fetchImpl: async () => Response.json({ versions: { '0.1.0': {} } }),
			})
			assert.equal(result.ok, false)
			assert.deepEqual(result.errors, [
				'package.json: installed viem@2.49.3 does not satisfy devDependencies.viem "^2.58.4"',
			])
			assert.equal(existsSync(join(fx.repoRoot, '.changeset/.publish-prep-backup.json')), false)
		}
	})

	it('enforces lockstep fixed versioning in .changeset/config.json', () => {
		const fx = createFixtureWorkspace()
		try {
			writeJson(join(fx.repoRoot, '.changeset', 'config.json'), {
				fixed: [],
				linked: [['@tevm/*', 'tevm']],
			})
			const errors = validateChangesetLockstep(fx.repoRoot)
			assert.equal(errors.length, 2)
		} finally {
			fx.cleanup()
		}
	})

	it('rejects different versions within the fixed group and skips private members', (t) => {
		const fx = createFixtureWorkspace()
		t.after(fx.cleanup)
		const path = join(fx.repoRoot, 'packages', 'runner', 'package.json')
		writeJson(path, { name: 'tevm-run', version: '0.9.0' })
		assert.match(validateChangesetLockstep(fx.repoRoot).join('\n'), /tevm-run@0.9.0/)
		writeJson(path, { name: 'tevm-run', version: '0.9.0', private: true })
		assert.deepEqual(validateChangesetLockstep(fx.repoRoot), [])
	})

	it('syncs the JSR version and imports after versioning and preserves unrelated mappings', (t) => {
		const fx = createFixtureWorkspace()
		t.after(fx.cleanup)
		const path = join(fx.repoRoot, 'tevm', 'jsr.json')
		const jsr = JSON.parse(readFileSync(path))
		writeJson(path, { ...jsr, version: '0.1.0', imports: { other: 'npm:other@2', '@tevm/old': 'npm:@tevm/old@1' } })
		execFileSync(process.execPath, [
			join(REPO_ROOT, 'scripts/prepare-changeset-publish.mjs'),
			'--sync-jsr',
			'--repo-root',
			fx.repoRoot,
		])
		assert.deepEqual(JSON.parse(readFileSync(path)), {
			...jsr,
			imports: { other: 'npm:other@2', '@tevm/node': 'npm:@tevm/node@^1.0.0-rc.154', viem: 'npm:viem@^2.58.4' },
		})
	})

	it('blocks publish when @evmts/zevm@0.1.0 is absent on npm and passes when 0.1.0 is published', async () => {
		const fx = createFixtureWorkspace()
		try {
			/** @type {typeof fetch} */
			const onlyZeroFetch = async () =>
				/** @type {Response} */ ({
					ok: true,
					status: 200,
					json: async () => ({ versions: { '0.0.0': {}, '0.1.5': {} } }),
				})
			const blocked = await runPublishPrep({
				repoRoot: fx.repoRoot,
				mode: 'apply',
				checkRegistry: true,
				fetchImpl: onlyZeroFetch,
			})
			assert.equal(blocked.ok, false)
			assert.ok(blocked.errors.some((e) => e.includes('@evmts/zevm@0.1.0 is not published')))
			// Fail-closed: node manifest must NOT be mutated on failure
			assert.equal(
				JSON.parse(readFileSync(join(fx.repoRoot, 'packages', 'node', 'package.json'), 'utf8')).dependencies[
					'@evmts/zevm'
				],
				'workspace:*',
			)

			/** @type {typeof fetch} */
			const readyFetch = async () =>
				/** @type {Response} */ ({
					ok: true,
					status: 200,
					json: async () => ({ versions: { '0.0.0': {}, '0.1.0': {} } }),
				})
			const ok = await runPublishPrep({
				repoRoot: fx.repoRoot,
				mode: 'dry-run',
				checkRegistry: true,
				fetchImpl: readyFetch,
			})
			assert.equal(ok.ok, true)
		} finally {
			fx.cleanup()
		}
	})

	it('catches @tevm/common orphan viem/chains export, facade drift, viem skew, and stray tarballs', async () => {
		const fx = createFixtureWorkspace()
		try {
			writeFileSync(
				join(fx.repoRoot, 'packages', 'common', 'src', 'index.ts'),
				`export { nonexistentChain2097, foundry as tevmDefault } from 'viem/chains'\n`,
			)
			writeFileSync(join(fx.repoRoot, 'tevm', 'index.d.ts'), `export { TevmState } from '@tevm/state';\n`)
			writeJson(join(fx.repoRoot, 'tevm', 'jsr.json'), {
				name: '@tevm/tevm',
				version: '1.0.0-rc.151',
				exports: {},
			})
			const actionsPkg = JSON.parse(readFileSync(join(fx.repoRoot, 'packages', 'actions', 'package.json'), 'utf8'))
			actionsPkg.peerDependencies.viem = '^2.49.3'
			actionsPkg.dependencies.bad = 'file:../oops'
			writeJson(join(fx.repoRoot, 'packages', 'actions', 'package.json'), actionsPkg)
			writeFileSync(join(fx.repoRoot, 'stray-artifact.tgz'), 'not-a-tarball')

			const res = await runPublishPrep({ repoRoot: fx.repoRoot, mode: 'dry-run' })
			assert.equal(res.ok, false)
			assert.ok(res.errors.some((e) => e.includes('nonexistentChain2097')))
			assert.ok(res.errors.some((e) => e.includes('@tevm/state')))
			assert.ok(res.errors.some((e) => e.includes('tevm/jsr.json: version')))
			assert.ok(res.errors.some((e) => e.includes('peerDependencies.viem is "^2.49.3"')))
			assert.ok(res.errors.some((e) => e.includes('unpublishable specifier "file:../oops"')))
			assert.ok(res.errors.some((e) => e.includes('stray-artifact.tgz')))
		} finally {
			fx.cleanup()
		}
	})

	it('validates the live TEVM monorepo in --dry-run mode cleanly', async () => {
		const res = await runPublishPrep({ repoRoot: REPO_ROOT, mode: 'dry-run' })
		assert.equal(res.ok, true, `Unexpected errors:\n${res.errors.join('\n')}`)
		// 17 public packages remain after the bundler, lsp, logger, effect, ethers and
		// test-utils packages moved to their standalone repositories.
		assert.ok(res.publishableCount >= 17)
		assert.ok(res.chainCount > 100)
		assert.ok(res.rewrites.some((r) => r.pkgName === '@tevm/node' && r.depName === '@evmts/zevm' && r.to === '0.1.0'))
	})
})

describe('pnpm-publish-wrapper tarball guard', () => {
	it('skips itself and symlink aliases in PATH and fails promptly without another pnpm', (t) => {
		const sandbox = mkdtempSync(join(tmpdir(), 'tevm-pnpm-path-'))
		t.after(() => rmSync(sandbox, { recursive: true, force: true }))
		const wrapper = join(REPO_ROOT, 'scripts/pnpm-publish-wrapper/pnpm')
		const tools = join(sandbox, 'tools')
		mkdirSync(tools)
		symlinkSync('/bin/bash', join(tools, 'bash'))
		symlinkSync(wrapper, join(tools, 'pnpm'))
		const env = { PATH: `${dirname(wrapper)}:${tools}` }
		assert.throws(
			() => execFileSync(wrapper, ['--version'], { env, timeout: 2000, stdio: 'pipe' }),
			(error) => error.status === 1 && /distinct pnpm/.test(error.stderr),
		)
		writeFileSync(join(sandbox, 'pnpm'), '#!/bin/sh\necho distinct\n', { mode: 0o755 })
		assert.equal(
			execFileSync(wrapper, ['--version'], {
				env: { PATH: `${env.PATH}:${sandbox}` },
				timeout: 2000,
				encoding: 'utf8',
			}).trim(),
			'distinct',
		)
	})

	it('refuses to publish a packed tarball leaking workspace:* and allows clean tarballs', () => {
		const sandbox = mkdtempSync(join(tmpdir(), 'tevm-wrapper-test-'))
		try {
			const fakeBin = join(sandbox, 'bin')
			const pkgDir = join(sandbox, 'pkg-src', 'package')
			mkdirSync(fakeBin, { recursive: true })
			mkdirSync(pkgDir, { recursive: true })

			// Fake pnpm that creates a real .tgz from pkg-src/package
			const fakePnpm = join(fakeBin, 'pnpm')
			writeFileSync(
				fakePnpm,
				`#!/usr/bin/env bash\nset -euo pipefail\nif [ "$1" = "pack" ]; then\n  dest="$3"\n  tar -czf "$dest/test-pkg-1.0.0.tgz" -C "${join(sandbox, 'pkg-src')}" package\n  exit 0\nfi\nexit 0\n`,
			)
			chmodSync(fakePnpm, 0o755)

			// Fake npm that records publish calls instead of hitting the network
			const npmLog = join(sandbox, 'npm.log')
			const fakeNpm = join(fakeBin, 'npm')
			writeFileSync(fakeNpm, `#!/usr/bin/env bash\necho "$@" >> "${npmLog}"\n`)
			chmodSync(fakeNpm, 0o755)

			const wrapper = resolve(REPO_ROOT, 'scripts', 'pnpm-publish-wrapper', 'pnpm')
			const env = { ...process.env, TEVM_REAL_PNPM: fakePnpm, PATH: `${fakeBin}:${process.env.PATH}` }

			// 1. Leaked workspace:* must be rejected before npm publish runs
			writeJson(join(pkgDir, 'package.json'), {
				name: '@tevm/node',
				version: '1.0.0-rc.154',
				dependencies: { '@evmts/zevm': 'workspace:*' },
			})
			assert.throws(
				() => execFileSync(wrapper, ['publish', '--tag', 'rc', '--access', 'public'], { env, stdio: 'pipe' }),
				(err) => String(err.stderr).includes('Refusing to publish') && String(err.stderr).includes('workspace:*'),
			)

			// 2. Clean ^0.1.0 tarball passes guard and invokes npm publish
			writeJson(join(pkgDir, 'package.json'), {
				name: '@tevm/node',
				version: '1.0.0-rc.154',
				dependencies: { '@evmts/zevm': '^0.1.0' },
			})
			execFileSync(wrapper, ['publish', '--tag', 'rc', '--access', 'public'], { env, stdio: 'pipe' })
			const recorded = readFileSync(npmLog, 'utf8')
			assert.match(recorded, /^publish .*\.tgz --tag rc --access public/)
		} finally {
			rmSync(sandbox, { recursive: true, force: true })
		}
	})
})

describe('release:publish transaction', () => {
	function setup(t, changeset) {
		const fx = createFixtureWorkspace()
		t.after(fx.cleanup)
		const bin = join(fx.repoRoot, 'bin')
		mkdirSync(bin)
		const tools = {
			pnpm: 'exit 0',
			nx: 'exit 0',
			node: 'if [ "$2" = --restore ] && [ -f fail-restore ]; then exit 73; fi\nshift\nexec "$NODE_BIN" "$PREP" "$@" --repo-root "$PWD"',
			changeset,
		}
		for (const [name, body] of Object.entries(tools))
			writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
		mkdirSync(join(fx.repoRoot, 'scripts'))
		copyFileSync(join(REPO_ROOT, 'scripts/publish-changesets.sh'), join(fx.repoRoot, 'scripts/publish-changesets.sh'))
		const options = {
			cwd: fx.repoRoot,
			env: {
				...process.env,
				PATH: `${bin}:${process.env.PATH}`,
				NODE_BIN: process.execPath,
				PREP: join(REPO_ROOT, 'scripts/prepare-changeset-publish.mjs'),
				GITHUB_ACTIONS: 'false',
				NODE_ENV: 'test',
				TEVM_SKIP_REGISTRY_CHECK: '1',
				npm_config_registry: 'file:///offline-registry',
			},
		}
		const manifest = join(fx.repoRoot, 'packages/node/package.json')
		const original = readFileSync(manifest, 'utf8')
		const backup = join(fx.repoRoot, '.changeset/.publish-prep-backup.json')
		const entry = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'))).scripts['release:publish']
		return { ...fx, entry, options, manifest, original, backup }
	}

	it('checks dist and registry before a local publish and only skips the registry on request', (t) => {
		const fx = setup(t, 'exit 99')
		rmSync(join(fx.repoRoot, 'packages/node/dist/index.js'))
		for (const [nodeEnv, skip] of [
			['test', '0'],
			['test', '1'],
			['production', '1'],
		]) {
			fx.options.env.NODE_ENV = nodeEnv
			fx.options.env.TEVM_SKIP_REGISTRY_CHECK = skip
			const result = spawnSync('sh', ['-c', fx.entry], { ...fx.options, encoding: 'utf8' })
			assert.equal(result.status, 1)
			assert.match(result.stderr, /built entry target ".*index.js" does not exist/)
			assert.equal(
				result.stderr.includes('registry lookup for @evmts/zevm errored'),
				nodeEnv !== 'test' || skip === '0',
			)
			assert.equal(readFileSync(fx.manifest, 'utf8'), fx.original)
		}
	})

	for (const signal of ['SIGINT', 'SIGTERM']) {
		it(`restores original bytes after ${signal} reaches the publishing shell`, { timeout: 10_000 }, async (t) => {
			const fx = setup(t, 'echo publisher-ready\nexec sleep 20')
			const child = spawn('sh', ['-c', fx.entry], { ...fx.options, stdio: ['ignore', 'pipe', 'pipe'] })
			const exited = once(child, 'exit')
			t.after(() => {
				if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
			})
			let output = ''
			let signalled = false
			for await (const chunk of child.stdout) {
				output += chunk
				if (signalled || !output.includes('publisher-ready')) continue
				assert.notEqual(readFileSync(fx.manifest, 'utf8'), fx.original)
				child.kill(signal)
				signalled = true
			}
			assert.deepEqual(await exited, [signal === 'SIGINT' ? 130 : 143, null])
			assert.equal(readFileSync(fx.manifest, 'utf8'), fx.original)
			assert.equal(existsSync(fx.backup), false)
		})
	}

	it('preserves publish errors and fails on restore errors after a successful publish', (t) => {
		const fx = setup(t, 'test "$*" = "publish --tag snapshot --no-git-tag" || exit 42')
		assert.throws(
			() => execFileSync('sh', ['-c', fx.entry], fx.options),
			(error) => error.status === 42,
		)
		assert.equal(readFileSync(fx.manifest, 'utf8'), fx.original)
		writeFileSync(join(fx.repoRoot, 'fail-restore'), '')
		assert.throws(
			() => execFileSync('sh', ['-c', `${fx.entry} --tag snapshot --no-git-tag`], fx.options),
			(error) => error.status === 73,
		)
		assert.ok(existsSync(fx.backup))
	})
})

it('facade clean preserves the installed CLI and the launcher does not print RPC arguments', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'tevm-facade-cli-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const { scripts } = JSON.parse(readFileSync(join(REPO_ROOT, 'tevm/package.json')))
	copyFileSync(join(REPO_ROOT, 'tevm/cli.js'), join(dir, 'cli.js'))
	execFileSync('sh', ['-c', scripts.clean], { cwd: dir })
	const cli = join(dir, 'node_modules/@tevm/cli')
	writeJson(join(cli, 'package.json'), { name: '@tevm/cli', main: './index.js' })
	writeFileSync(join(cli, 'index.js'), 'console.log("CLI loaded")')
	const result = spawnSync(process.execPath, ['cli.js', '--rpc', 'https://example.invalid/SENTINEL'], {
		cwd: dir,
		encoding: 'utf8',
	})
	assert.equal(result.status, 0)
	assert.equal(result.stdout.trim(), 'CLI loaded')
	assert.doesNotMatch(result.stderr, /SENTINEL/)
})
