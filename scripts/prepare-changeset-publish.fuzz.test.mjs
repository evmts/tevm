import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { Worker } from 'node:worker_threads'
import {
	applyPublishPrep,
	discoverWorkspacePackages,
	findStrayTarballs,
	globToRegExp,
	isCoveredByNpmFiles,
	parseWorkspacePatterns,
	planZevmPublishResolution,
	restorePublishPrep,
	satisfiesRange,
	validateCommonAgainstViem,
	validatePackageManifests,
} from './prepare-changeset-publish.mjs'
import { property, sandbox, write } from './test-support/publish-fuzz.mjs'

const fields = ['dependencies', 'optionalDependencies', 'peerDependencies']
const wrapper = join(import.meta.dirname, 'pnpm-publish-wrapper/pnpm')

function workspaceEntry(root, relDir, pkg) {
	const dir = join(root, relDir)
	return { dir, relDir, manifestPath: join(dir, 'package.json'), pkg }
}

function workspaceCase({ int, pick }) {
	const parent = Array.from({ length: int(4) + 1 }, () => pick(['abc', 'x.y', 'group-2', 'a#b'])).join('/')
	const chosen = `pkg${int(10)}`
	const paths = [chosen, 'pkgx', 'nested/pkgx', 'my_node_modules_tools', 'node_modules', 'bower_components/z', '.']
	const rules = [
		{ glob: '**', hits: paths },
		{ glob: 'pkg?', hits: paths.slice(0, 2) },
		{ glob: 'nested/*', hits: [paths[2]] },
		{ glob: chosen, hits: [chosen] },
		{ glob: 'my_node_modules_tools', hits: [paths[3]] },
	]
	const patterns = Array.from({ length: 2 + int(7) }, () => ({
		...pick(rules),
		negative: int(3) === 0,
		suffix: pick(['', '/', '//']),
		quote: pick(["'", '"']),
	}))
	patterns.push(patterns[int(patterns.length)])
	const occupied = Array.from({ length: 1 + int(3) }, () => pick(paths))
	return { parent, paths: [...new Set(occupied)], patterns }
}

function checkWorkspace(cases) {
	sandbox((root) => {
		const rules = []
		const expected = []
		for (const [i, { parent, paths, patterns }] of cases.entries()) {
			// Disjoint roots let one real discovery check many independent pattern lists.
			const prefix = join(`tree-${i}`, parent)
			for (const path of paths) {
				const dir = join(prefix, path)
				write(join(root, dir, 'package.json'), '{}')
				if (path.split('/').some((s) => ['node_modules', 'bower_components'].includes(s))) continue
				const matches = patterns.filter((rule) => rule.hits.includes(path))
				if (matches.some((r) => !r.negative) && !matches.some((r) => r.negative)) expected.push(dir)
			}
			for (const r of patterns) rules.push({ ...r, pattern: `${prefix}/${r.glob}${r.suffix}` })
		}
		for (const ordered of [rules, [...rules].reverse()]) {
			const yaml = [
				'packages:',
				...ordered.map((r) => `  - ${r.quote}${r.negative ? '!' : ''}${r.pattern}${r.quote} # rule`),
				'overrides:',
				'  - ignored',
			].join('\r\n')
			write(join(root, 'pnpm-workspace.yaml'), yaml)
			assert.deepEqual(parseWorkspacePatterns(yaml), {
				include: ordered.filter((r) => !r.negative).map((r) => r.pattern),
				exclude: ordered.filter((r) => r.negative).map((r) => r.pattern),
			})
			assert.deepEqual(
				discoverWorkspacePackages(root)
					.map((p) => p.relDir)
					.sort(),
				expected.sort(),
			)
		}
	})
}

property(
	'workspace exclusions win in either order and duplicate matches name one package',
	workspaceCase,
	checkWorkspace,
	12,
)

test('workspace discovery preserves quoted hashes and excludes whole dependency directory names only', () => {
	sandbox((root) => {
		write(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'a#b/**' # comment\n  - '!a#b/pkg?'\n")
		for (const p of ['my_node_modules_tools', 'pkg1', 'node_modules/p', 'bower_components/p'])
			write(join(root, 'a#b', p, 'package.json'), '{}')
		assert.deepEqual(
			discoverWorkspacePackages(root).map((p) => p.relDir),
			['a#b/my_node_modules_tools'],
		)
	})
})

property(
	'semver exact, caret and tilde respect lower bounds, prerelease ordering and build metadata',
	({ int, pick }) => ({ major: int(4), minor: int(5), patch: int(9), rc: int(20) + 1, op: pick(['', '^', '~']) }),
	([{ major, minor, patch, rc, op }]) => {
		const base = `${major}.${minor}.${patch}`
		const pre = `${base}-rc.${rc}`
		assert.equal(satisfiesRange(`${pre}+one`, `${op}${pre}+two`), true)
		assert.equal(satisfiesRange(`${base}-rc.${rc - 1}`, op + pre), false)
		assert.equal(satisfiesRange(pre, op + base), false)
		assert.equal(satisfiesRange(base, op + pre), op !== '')
		assert.equal(satisfiesRange(`${base}-rc.${rc + 1}`, op + pre), op !== '')
		assert.equal(satisfiesRange(`${major}.${minor}.${patch + 1}-rc.1`, op + pre), false)
		assert.equal(
			satisfiesRange(`${major}.${minor}.${patch + 1}`, op + base),
			op === '~' || (op === '^' && (major > 0 || minor > 0)),
		)
		assert.equal(satisfiesRange(`${major}.${minor + 1}.0`, op + base), op === '^' && major > 0)
		assert.equal(satisfiesRange(`${major + 1}.0.0`, op + base), false)
		for (const invalid of [`0${base}`, `${base}-0${rc}`, `${base}+`, `${base}-a..b`]) {
			const entry = workspaceEntry('.', 'member', { name: 'member', version: invalid })
			assert.equal(validatePackageManifests([entry], { repoRoot: '.' }).length, 1, invalid)
		}
	},
)

test('a prerelease below the registry range cannot authorize publish', () => {
	assert.equal(satisfiesRange('1.0.0-rc.9', '^1.0.0-rc.10'), false)
	assert.equal(satisfiesRange('1.0.0-rc.1', '~1.0.0'), false)
	assert.equal(satisfiesRange('1.0.0+x', '1.0.0+y'), true)
})

function leakCase({ int, pick }) {
	const protocol = pick(['workspace:*', 'workspace:^', 'link:', 'file:', 'portal:'])
	const spec = protocol.endsWith(':') ? `${protocol}../local-${int(200)}` : protocol
	return {
		field: pick(fields),
		spec: pick(['', ' ', '\t']) + spec,
		version: `${int(3)}.${int(9)}.${int(17)}`,
		depth: int(4) + 1,
	}
}

function checkLeaks(cases) {
	sandbox((root) => {
		const packed = { name: 'packed', version: '1.0.0', devDependencies: { tooling: 'workspace:*' } }
		const expected = []
		const dirty = structuredClone(packed)
		for (const [i, { field, spec, version, depth }] of cases.entries()) {
			const dep = `dep-${i}`
			const pkg = {
				name: `pkg-${i}`,
				version,
				[field]: { safe: `^${version}`, [dep]: spec },
				devDependencies: { build: 'link:tool' },
			}
			const member = workspaceEntry(root, `packages/${'group/'.repeat(depth)}${i}`, pkg)
			const findings = validatePackageManifests([member], { repoRoot: root })
			assert.equal(findings.length, 1)
			assert.ok(findings[0].includes(`${field}.${dep}`) && findings[0].includes(`"${spec}"`), findings[0])
			const clean = { ...member, pkg: { ...pkg, [field]: { [dep]: `~${version}`, safe: `^${version}` } } }
			assert.deepEqual(validatePackageManifests([clean], { repoRoot: root }), [])
			if (spec.startsWith('workspace:')) {
				const target = workspaceEntry(root, dep, { name: dep, version })
				assert.deepEqual(validatePackageManifests([member, target], { repoRoot: root }), [])
				target.pkg.private = true
				assert.match(validatePackageManifests([member, target], { repoRoot: root })[0], /private workspace package/)
			}
			packed[field] ??= {}
			dirty[field] ??= {}
			packed[field][dep] = `^${version}`
			dirty[field][dep] = spec
			expected.push(`${field}.${dep}=${spec}`)
		}
		// Exercise the executable wrapper with real tar/gzip bytes. Batch entries
		// and compare *every* diagnostic, so one rejection cannot hide another leak.
		const pack = join(root, 'bin/pnpm')
		const npm = join(root, 'bin/npm')
		write(pack, '#!/bin/sh\nprintf "%s" "$3" > last-pack-dir\nexec tar -czf "$3/pkg.tgz" package/package.json\n')
		write(npm, '#!/bin/sh\nprintf "%s" "$1" >> "$PWD/called"\n')
		chmodSync(pack, 0o755)
		chmodSync(npm, 0o755)
		const invoke = (pkg) => {
			write(join(root, 'package/package.json'), JSON.stringify(pkg))
			const proc = spawnSync(wrapper, ['publish'], {
				cwd: root,
				env: { ...process.env, TMPDIR: root, TEVM_REAL_PNPM: pack, PATH: `${root}/bin:${process.env.PATH}` },
				encoding: 'utf8',
			})
			assert.ifError(proc.error)
			return proc
		}
		const result = invoke(dirty)
		assert.equal(result.status, 1, result.stderr)
		assert.equal(existsSync(join(root, 'called')), false)
		assert.deepEqual(result.stderr.trimEnd().split('leaked specifier(s): ')[1]?.split(', ').sort(), expected.sort())
		const clean = invoke(packed)
		assert.equal(clean.status, 0, clean.stderr)
		assert.equal(readFileSync(join(root, 'called'), 'utf8'), 'publish')
		assert.equal(
			existsSync(readFileSync(join(root, 'last-pack-dir'), 'utf8')),
			false,
			'wrapper left its packed tarball on disk',
		)
	})
}
property(
	'prepare and the real publish wrapper account for each injected protocol in every runtime field',
	leakCase,
	checkLeaks,
	256,
)
test('leading whitespace cannot hide a local runtime dependency in either guard', () => {
	checkLeaks([{ field: 'peerDependencies', spec: ' file:../dep', version: '1.0.0', depth: 1 }])
})

property(
	'multi-manifest preparation preserves the first backup and restores every original byte',
	({ int, pick }) =>
		Array.from({ length: 2 + int(3) }, () => ({
			indent: pick([0, 1, 2, 4, '\t']),
			newline: pick(['\r\n', '\n']),
			tail: pick(['', '\n', '\r\n', '\n\n']),
			field: pick(fields),
			spec: pick(['workspace:*', 'workspace:^', 'workspace:~']),
			suffix: int(1000),
		})),
	([styles]) => {
		sandbox((root) => {
			const repo = join(root, 'tevm')
			const backup = join(repo, '.changeset/back.json')
			const sibling = workspaceEntry(repo, '../zevm/npm/lib', { name: '@evmts/lib', version: '2.1.0' })
			const entries = styles.map(({ field, spec, suffix }, i) =>
				workspaceEntry(repo, `packages/member-${i}-${suffix}`, {
					name: `pkg${i}`,
					version: '1.0.0',
					description: 'λ ⛓',
					[field]: { '@evmts/lib': spec },
				}),
			)
			const originals = new Map()
			for (const [i, p] of [...entries, sibling].entries()) {
				const { indent, newline, tail } = styles[i % styles.length]
				const bytes = Buffer.from(JSON.stringify(p.pkg, null, indent).replaceAll('\n', newline) + tail)
				write(p.manifestPath, bytes)
				originals.set(p.manifestPath, bytes)
			}
			const plan = planZevmPublishResolution([...entries, sibling], repo)
			assert.deepEqual(plan.errors, [])
			assert.equal(plan.edits.length, entries.length + 1)
			// Failure while collecting the last original must leave *all* files alone.
			assert.throws(() => applyPublishPrep([...plan.edits, { path: join(repo, 'absent'), nextContent: '' }], backup), {
				code: 'ENOENT',
			})
			assert.equal(existsSync(backup), false)
			for (const [path, bytes] of originals) assert.deepEqual(readFileSync(path), bytes)
			applyPublishPrep(plan.edits, backup)
			const saved = readFileSync(backup)
			assert.throws(() => applyPublishPrep(plan.edits, backup), /Backup file already exists/)
			assert.deepEqual(readFileSync(backup), saved)
			for (const [i, entry] of entries.entries()) {
				const { field, spec } = styles[i]
				assert.equal(
					JSON.parse(readFileSync(entry.manifestPath))[field]['@evmts/lib'],
					{ 'workspace:*': '2.1.0', 'workspace:~': '~2.1.0', 'workspace:^': '^2.1.0' }[spec],
				)
			}
			assert.equal(JSON.parse(readFileSync(sibling.manifestPath)).private, true)
			assert.equal(restorePublishPrep(backup), originals.size)
			assert.equal(restorePublishPrep(backup), 0)
			assert.equal(existsSync(backup), false)
			for (const [path, bytes] of originals) assert.deepEqual(readFileSync(path), bytes)
		})
	},
)

property(
	'tarballs, ordered files rules and missing export targets give exact findings',
	({ int, pick }) => ({
		path: [
			'dist',
			...Array.from({ length: 1 + int(4) }, () => pick(['x', 'xy', 'a.b', 'level-2'])),
			`entry${int(10)}.js`,
		].join('/'),
		tarDir: pick(['nested', '.artifacts', 'nested/.out', 'node_modules_copy']),
		ignored: pick(['.git', '.jj', 'node_modules', 'vendor', 'artifacts', '.nx']),
		rules: Array.from({ length: 1 + int(8) }, () => ({ kind: int(5), negative: !!int(2) })),
		kind: pick(['file', 'directory', 'missing']),
		array: !!int(2),
	}),
	([{ path, tarDir, ignored, rules, kind, array }]) => {
		sandbox((root) => {
			const rule = ['dist/', 'dist/**/entry?.js', path, 'types/**', 'dist/*.css']
			const files = rules.map(({ kind, negative }) => (negative ? '!' : '') + rule[kind])
			const covered = rules.filter(({ kind }) => kind < 3).at(-1)?.negative === false
			assert.equal(globToRegExp('dist/**/entry?.js/').test(path), true)
			assert.equal(isCoveredByNpmFiles(`./${path}`, files), covered)
			assert.equal(isCoveredByNpmFiles('./package.json', files), true)
			const pkg = {
				name: 'member',
				version: '1.0.0',
				files,
				exports: { './package.json': './package.json', '.': array ? [`./${path}`] : `./${path}` },
			}
			const member = workspaceEntry(root, 'pkg', pkg)
			write(member.manifestPath, JSON.stringify(pkg))
			if (kind === 'file') write(join(member.dir, path), '')
			if (kind === 'directory') mkdirSync(join(member.dir, path), { recursive: true })
			const expected = []
			if (!covered) expected.push(`member (pkg/package.json): entry target "./${path}" is not covered by files[]`)
			if (kind !== 'file')
				expected.push(`member (pkg/package.json): built entry target "./${path}" does not exist on disk`)
			assert.deepEqual(validatePackageManifests([member], { repoRoot: root, checkDist: true }), expected)
			const stray = `${tarDir}/p.tgz`
			write(join(root, stray), '')
			write(join(root, ignored, 'nested/p.tgz'), '')
			write(join(root, tarDir, 'p.tgz.map'), '')
			assert.deepEqual(findStrayTarballs(root), [stray])
		})
	},
)

test('hidden tarballs, single-character files globs and array exports are checked', () => {
	sandbox((root) => {
		write(join(root, '.out/x.tgz'), '')
		mkdirSync(join(root, 'pkg/absent.js'), { recursive: true })
		assert.deepEqual(findStrayTarballs(root), ['.out/x.tgz'])
		assert.equal(isCoveredByNpmFiles('./dist/a.js', ['dist/?.js']), true)
		const member = workspaceEntry(root, 'pkg', { name: 'member', version: '1.0.0', exports: ['./absent.js'] })
		assert.deepEqual(validatePackageManifests([member], { repoRoot: root, checkDist: true }), [
			'member (pkg/package.json): built entry target "./absent.js" does not exist on disk',
		])
	})
})

test('two simultaneous applies elect one writer and preserve the pre-race bytes', async (t) => {
	const root = mkdtempSync(join(tmpdir(), 'tevm-racing-prepare-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const backup = join(root, 'backup.json')
	const edits = Array.from({ length: 12 }, (_, i) => ({ path: join(root, `${i}/package.json`), nextContent: '{}' }))
	for (const edit of edits) write(edit.path, '{"original":true}\r\n')
	const start = new SharedArrayBuffer(4)
	const workerCode = `
		import { parentPort, workerData } from 'node:worker_threads'
		import { applyPublishPrep } from ${JSON.stringify(new URL('./prepare-changeset-publish.mjs', import.meta.url).href)}
		const { start, edits, backup } = workerData
		parentPort.postMessage('ready')
		Atomics.wait(new Int32Array(start), 0, 0)
		try {
			applyPublishPrep(edits, backup)
			parentPort.postMessage('applied')
		} catch (err) {
			parentPort.postMessage(err.message)
		}
	`
	const workers = Array.from(
		{ length: 2 },
		() =>
			new Worker(new URL(`data:text/javascript,${encodeURIComponent(workerCode)}`), {
				workerData: { start, edits, backup },
			}),
	)
	t.after(() => Promise.all(workers.map((worker) => worker.terminate())))
	await Promise.all(workers.map((worker) => once(worker, 'message')))
	const results = Promise.all(workers.map((worker) => once(worker, 'message')))
	Atomics.store(new Int32Array(start), 0, 1)
	Atomics.notify(new Int32Array(start), 0)
	const [loser, winner] = (await results).flat().sort()
	assert.equal(winner, 'applied')
	assert.match(loser, /^Backup file already exists/)
	assert.equal(restorePublishPrep(backup), edits.length)
	for (const { path } of edits) assert.equal(readFileSync(path, 'utf8'), '{"original":true}\r\n')
})

test('viem validation reads runtime re-exports and ignores type-only bindings and example text', async (t) => {
	const root = mkdtempSync(join(tmpdir(), 'tevm-chains-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const source = join(root, 'packages/common/src/index.ts')
	write(
		join(root, 'node_modules/viem/package.json'),
		JSON.stringify({
			name: 'viem',
			version: '1.0.0',
			type: 'module',
			exports: { './package.json': './package.json', './chains': './chains.js' },
		}),
	)
	write(join(root, 'node_modules/viem/chains.js'), 'export const foundry = 1')
	const decoys = [
		"// export { ghost } from 'viem/chains'",
		`const docs = "import { example } from 'viem/chains'";`,
		"export { type Chain, foundry as tevmDefault } from 'viem/chains';",
	].join('\n')
	write(source, decoys)
	assert.deepEqual((await validateCommonAgainstViem(root)).errors, [])
	write(source, `${decoys}\nexport /* checked */ { gone as removed } from 'viem/chains';`)
	assert.deepEqual((await validateCommonAgainstViem(root)).errors, [
		'@tevm/common: imports/re-exports "gone" from viem/chains, which is missing in viem@1.0.0',
	])
})

property(
	'files rules agree with the actual pnpm packlist for nested and hidden outputs',
	({ int, pick }) => ({
		folders: Array.from({ length: int(4) }, () => pick(['build', '.chunks', 'private', 'public'])),
		file: pick(['mod1.js', 'modx.js', '.mod1.js', 'mod24.js', 'mod1.css']),
	}),
	(cases) => {
		sandbox((root) => {
			const files = ['payload/**/mod?.js', '!payload/**/private/**']
			write(join(root, 'package.json'), JSON.stringify({ name: 'allowlist-probe', version: '1.0.0', files }))
			const targets = cases.map(({ folders, file }, i) => join('payload', String(i), ...folders, file))
			for (const target of targets) write(join(root, target), '')
			const proc = spawnSync('pnpm', ['pack', '--json', '--out', join(root, 'packed.tgz')], {
				cwd: root,
				encoding: 'utf8',
			})
			assert.ifError(proc.error)
			assert.equal(proc.status, 0, proc.stderr)
			const packed = new Set(JSON.parse(proc.stdout).files.map(({ path }) => path))
			for (const target of targets) assert.equal(isCoveredByNpmFiles(target, files), packed.has(target), target)
		})
	},
	256,
)

test('an npm files glob includes dot directories when pnpm packs them', () => {
	assert.equal(isCoveredByNpmFiles('dist/.chunks/a.js', ['dist/**/*.js']), true)
})
