import {
	existsSync,
	globSync,
	linkSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, matchesGlob, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { hasExportFile, inspectModules, sourcePackageEntry } from './factory/verify-publish-smoke.mjs'

const SEMVER_RE =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const FORBIDDEN_PROTOCOL_RE = /^(?:file:|link:|portal:)/
const RUNTIME_DEP_FIELDS = /** @type {const} */ (['dependencies', 'peerDependencies', 'optionalDependencies'])
const RETIRED_PACKAGES = [
	'@tevm/client-types',
	'@tevm/state',
	'@tevm/decorators',
	'@tevm/precompiles',
	'@tevm/sync-storage-persister',
]
const DEFAULT_BACKUP_REL = '.changeset/.publish-prep-backup.json'
const DEFAULT_REGISTRY_URL = 'https://registry.npmjs.org'

/**
 * @typedef {{ dir: string, manifestPath: string, relDir: string, pkg: Record<string, any> }} WorkspacePackage
 * @typedef {{ path: string, nextContent: string, description: string }} PlannedFileEdit
 * @typedef {{ pkgName: string, depName: string, from: string, to: string, targetVersion: string }} ExternalRewrite
 */

/** @param {string} str */
function escapeRegex(str) {
	return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Compile a simple path glob supporting single stars, globstars and question marks.
 * @param {string} pattern
 * @returns {RegExp}
 */
export function globToRegExp(pattern) {
	const clean = pattern.replace(/^\.\//, '').replace(/\/+$/, '')
	let out = '^'
	for (let i = 0; i < clean.length; i++) {
		const ch = clean[i]
		if (ch === '*' && clean[i + 1] === '*') {
			if (clean[i + 2] === '/') {
				out += '(?:.*/)?'
				i += 2
			} else {
				out += '.*'
				i += 1
			}
		} else if (ch === '*') {
			out += '[^/]*'
		} else if (ch === '?') {
			out += '[^/]'
		} else {
			out += escapeRegex(ch)
		}
	}
	return new RegExp(`${out}$`)
}

/**
 * Parse `packages:` patterns from `pnpm-workspace.yaml` without external YAML deps.
 * @param {string} yamlText
 * @returns {{ include: string[], exclude: string[] }}
 */
export function parseWorkspacePatterns(yamlText) {
	/** @type {string[]} */
	const include = []
	/** @type {string[]} */
	const exclude = []
	let inPackages = false
	for (const rawLine of yamlText.split(/\r?\n/)) {
		if (/^packages\s*:/.test(rawLine)) {
			inPackages = true
			continue
		}
		if (!inPackages || /^\s*(?:#|$)/.test(rawLine)) continue
		const item = /^\s*-\s+(.+?)\s*$/.exec(rawLine)
		if (!item) {
			if (/^\S/.test(rawLine)) inPackages = false
			continue
		}
		const quoted = /^(?:'((?:[^']|'')*)'|"((?:[^"\\]|\\.)*)")\s*(?:#.*)?$/.exec(item[1])
		const pattern = quoted
			? (quoted[1]?.replaceAll("''", "'") ?? JSON.parse(`"${quoted[2]}"`))
			: item[1].replace(/\s+#.*$/, '').trim()
		if (pattern.startsWith('!')) exclude.push(pattern.slice(1))
		else include.push(pattern)
	}
	return { include, exclude }
}

/**
 * Discover all workspace packages listed in `pnpm-workspace.yaml`.
 * @param {string} repoRoot
 * @returns {WorkspacePackage[]}
 */
export function discoverWorkspacePackages(repoRoot) {
	const wsPath = join(repoRoot, 'pnpm-workspace.yaml')
	if (!existsSync(wsPath)) throw new Error(`Missing pnpm-workspace.yaml at ${wsPath}`)
	const { include, exclude } = parseWorkspacePatterns(readFileSync(wsPath, 'utf8'))
	const normalize = (pattern) => pattern.replace(/^\.\//, '').replace(/\/+$/, '')
	const negatives = exclude.map((pattern) => `${normalize(pattern)}/package.json`)
	const manifests = [...new Set(include.map((pattern) => `${normalize(pattern)}/package.json`))]
	const seen = new Map()
	const dependencyDir = (name) => name === 'node_modules' || name === 'bower_components'
	for (const match of globSync(manifests, { cwd: repoRoot, exclude: (path) => path.split('/').some(dependencyDir) })) {
		const manifestPath = resolve(repoRoot, match)
		const dir = dirname(manifestPath)
		const relDir = relative(repoRoot, dir).replace(/\\/g, '/')
		if (negatives.some((pattern) => matchesGlob(`${relDir}/package.json`, pattern)) || seen.has(manifestPath)) continue
		const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'))
		seen.set(manifestPath, { dir, manifestPath, relDir, pkg })
	}
	return [...seen.values()].sort((a, b) => a.relDir.localeCompare(b.relDir))
}

/**
 * Check whether a target path (e.g. `./dist/index.js`) is included by npm's `files` array.
 * @param {string} targetRel
 * @param {string[] | undefined} filesField
 * @returns {boolean}
 */
export function isCoveredByNpmFiles(targetRel, filesField) {
	const normalized = targetRel.replace(/^\.\//, '')
	if (normalized === 'package.json') return true
	if (!Array.isArray(filesField)) return true
	let included = false
	for (const rawEntry of filesField) {
		const isNegated = rawEntry.startsWith('!')
		const entry = (isNegated ? rawEntry.slice(1) : rawEntry).replace(/^\.\//, '').replace(/\/+$/, '')
		const matched =
			entry === normalized ||
			normalized.startsWith(`${entry}/`) ||
			globToRegExp(entry).test(normalized) ||
			globToRegExp(`${entry}/**`).test(normalized)
		if (matched) included = !isNegated
	}
	return included
}

/**
 * Parse a basic `major.minor.patch` semver tuple (ignores build metadata).
 * @param {string} version
 * @returns {{ major: number, minor: number, patch: number, prerelease: string | null } | null}
 */
export function parseSemver(version) {
	const m = SEMVER_RE.exec(version)
	if (!m || m[0] !== version || [m[1], m[2], m[3]].some((n) => !Number.isSafeInteger(Number(n)))) return null
	if (m[4]?.split('.').some((id) => /^0\d+$/.test(id))) return null
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease: m[4] ?? null }
}

/** Compare dot-separated prerelease identifiers according to SemVer precedence. */
function comparePrerelease(a, b) {
	if (a === b) return 0
	if (a === null) return 1
	if (b === null) return -1
	const left = a.split('.')
	const right = b.split('.')
	for (let i = 0; i < Math.min(left.length, right.length); i++) {
		const x = left[i]
		const y = right[i]
		if (x === y) continue
		const numericX = /^\d+$/.test(x)
		const numericY = /^\d+$/.test(y)
		if (numericX !== numericY) return numericX ? -1 : 1
		if (numericX && x.length !== y.length) return x.length - y.length
		return x < y ? -1 : 1
	}
	return left.length - right.length
}

/**
 * Minimal semver satisfaction check for exact, `^`, and `~` ranges.
 * @param {string} version
 * @param {string} range
 * @returns {boolean}
 */
export function satisfiesRange(version, range) {
	const op = /^[~^]/.exec(range)?.[0] ?? ''
	const v = parseSemver(version)
	const r = parseSemver(range.slice(op.length))
	if (!v || !r || v.major !== r.major) return false
	if (v.minor === r.minor && v.patch === r.patch) {
		if (v.prerelease && !r.prerelease) return false
		const cmp = comparePrerelease(v.prerelease, r.prerelease)
		return op ? cmp >= 0 : cmp === 0
	}
	if (!op || v.prerelease || v.minor < r.minor || (v.minor === r.minor && v.patch < r.patch)) return false
	if (op === '~') return v.minor === r.minor
	return r.major > 0 || (r.minor > 0 && v.minor === r.minor)
}

/**
 * Resolve a workspace specifier (`workspace:*`, `workspace:^`, `workspace:~`) into a published range.
 * @param {string} spec
 * @param {string} targetVersion
 * @returns {string}
 */
export function resolveWorkspaceRange(spec, targetVersion) {
	if (spec === 'workspace:*') return targetVersion
	if (spec === 'workspace:^') return `^${targetVersion}`
	if (spec === 'workspace:~') return `~${targetVersion}`
	const explicit = spec.slice('workspace:'.length)
	return explicit || `^${targetVersion}`
}

/**
 * Enforce lockstep (`fixed`) versioning in `.changeset/config.json` to prevent #2097 skew.
 * @param {string} repoRoot
 * @param {WorkspacePackage[]} [packages]
 * @returns {string[]}
 */
export function validateChangesetLockstep(repoRoot, packages) {
	const configPath = join(repoRoot, '.changeset', 'config.json')
	if (!existsSync(configPath)) return ['Missing .changeset/config.json']
	const config = JSON.parse(readFileSync(configPath, 'utf8'))
	/** @type {string[]} */
	const errors = []
	const fixed = /** @type {unknown[]} */ (Array.isArray(config.fixed) ? config.fixed : [])
	const linked = /** @type {unknown[]} */ (Array.isArray(config.linked) ? config.linked : [])
	if (linked.length > 0) {
		errors.push('.changeset/config.json: "linked" groups allow partial releases and version skew (#2097); use "fixed"')
	}
	const hasCoreLockstep = fixed.some(
		(group) => Array.isArray(group) && ['@tevm/*', 'tevm', 'tevm-run'].every((name) => group.includes(name)),
	)
	if (!hasCoreLockstep) {
		errors.push('.changeset/config.json: "fixed" must lockstep ["@tevm/*", "tevm", "tevm-run"] together')
	}
	const publicPackages = (packages ?? discoverWorkspacePackages(repoRoot)).filter(
		({ pkg, relDir }) => !pkg.private && !relDir.startsWith('..'),
	)
	for (const group of fixed) {
		if (!Array.isArray(group)) continue
		const members = publicPackages.filter(
			({ pkg }) => typeof pkg.name === 'string' && group.some((pattern) => matchesGlob(pkg.name, pattern)),
		)
		if (new Set(members.map(({ pkg }) => pkg.version)).size > 1) {
			errors.push(`Fixed group version skew: ${members.map(({ pkg }) => `${pkg.name}@${pkg.version}`).join(', ')}`)
		}
	}
	return errors
}

/**
 * Collect declared entry target paths and check `exports` condition ordering (`types` before `default`).
 * @param {Record<string, any>} pkg
 * @param {string} label
 * @returns {{ targets: string[], errors: string[] }}
 */
function inspectEntryTargets(pkg, label) {
	/** @type {string[]} */
	const targets = []
	/** @type {string[]} */
	const errors = []

	for (const key of ['main', 'module', 'types']) {
		if (typeof pkg[key] === 'string') targets.push(pkg[key])
	}
	if (typeof pkg.bin === 'string') targets.push(pkg.bin)
	else if (pkg.bin && typeof pkg.bin === 'object') {
		for (const binPath of Object.values(pkg.bin)) {
			if (typeof binPath === 'string') targets.push(binPath)
		}
	}

	/** @param {unknown} node @param {string} ctx */
	const walkExports = (node, ctx) => {
		if (typeof node === 'string') {
			targets.push(node)
			return
		}
		if (!node || typeof node !== 'object') return
		if (Array.isArray(node)) {
			for (const item of node) walkExports(item, ctx)
			return
		}
		const keys = Object.keys(node)
		const typesIdx = keys.indexOf('types')
		const defaultIdx = keys.indexOf('default')
		if (typesIdx !== -1 && defaultIdx !== -1 && typesIdx > defaultIdx) {
			errors.push(`${label}: exports[${ctx}] places "types" after "default"`)
		}
		if (defaultIdx !== -1 && defaultIdx !== keys.length - 1) {
			errors.push(`${label}: exports[${ctx}] must place "default" last`)
		}
		for (const [k, v] of Object.entries(node)) walkExports(v, `${ctx}.${k}`)
	}

	if (pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)) {
		const isNapiPlatform = /\/npm\/[^/]+\/package\.json\)$/.test(label)
		if (!isNapiPlatform && !('./package.json' in pkg.exports)) {
			errors.push(`${label}: exports is missing "./package.json"`)
		}
		for (const [subpath, value] of Object.entries(pkg.exports)) {
			walkExports(value, subpath)
		}
		const dot = pkg.exports['.']
		const importTypes = typeof dot === 'object' && dot !== null ? (dot.import?.types ?? dot.types) : undefined
		if (
			typeof pkg.types === 'string' &&
			typeof importTypes === 'string' &&
			pkg.types.replace(/^\.\//, '') !== importTypes.replace(/^\.\//, '')
		) {
			errors.push(`${label}: top-level "types" (${pkg.types}) disagrees with exports["."] types (${importTypes})`)
		}
	} else if (pkg.exports) walkExports(pkg.exports, '.')

	return { targets, errors }
}

/**
 * Validate all publishable workspace package manifests.
 * @param {WorkspacePackage[]} allPackages
 * @param {{ repoRoot: string, checkDist?: boolean, expectedViemRange?: string }} options
 * @returns {string[]}
 */
export function validatePackageManifests(allPackages, { repoRoot, checkDist = false, expectedViemRange }) {
	/** @type {string[]} */
	const errors = []
	const byName = new Map(allPackages.map((p) => [p.pkg.name, p]))
	const publishable = allPackages.filter((p) => !p.pkg.private && !p.relDir.startsWith('..'))

	for (const entry of publishable) {
		const { pkg, dir, relDir } = entry
		const label = `${pkg.name ?? relDir} (${relDir}/package.json)`

		if (typeof pkg.version !== 'string' || !parseSemver(pkg.version)) {
			errors.push(`${label}: invalid semver version "${pkg.version}"`)
		}
		const isNapiPlatform = /\/npm\/[^/]+$/.test(relDir)
		if (
			!isNapiPlatform &&
			typeof pkg.name === 'string' &&
			pkg.name.startsWith('@') &&
			pkg.publishConfig?.access !== 'public'
		) {
			errors.push(`${label}: scoped public package missing publishConfig.access="public"`)
		}

		const { targets, errors: exportErrors } = inspectEntryTargets(pkg, label)
		errors.push(...exportErrors)

		for (const target of targets) {
			if (!isCoveredByNpmFiles(target, pkg.files)) {
				errors.push(`${label}: entry target "${target}" is not covered by files[]`)
			}
			if (checkDist && !hasExportFile(dir, target)) {
				errors.push(`${label}: built entry target "${target}" does not exist on disk`)
			}
		}

		if (pkg.dependencies?.viem && pkg.peerDependencies?.viem && pkg.dependencies.viem !== pkg.peerDependencies.viem) {
			errors.push(
				`${label}: dependencies.viem (${pkg.dependencies.viem}) !== peerDependencies.viem (${pkg.peerDependencies.viem})`,
			)
		}

		for (const field of RUNTIME_DEP_FIELDS) {
			const deps = pkg[field]
			if (!deps || typeof deps !== 'object') continue
			for (const [depName, spec] of Object.entries(deps)) {
				if (typeof spec !== 'string') continue
				const trimmed = spec.trim()
				if (
					FORBIDDEN_PROTOCOL_RE.test(trimmed) ||
					trimmed.endsWith('.tgz') ||
					(spec !== trimmed && trimmed.startsWith('workspace:'))
				) {
					errors.push(`${label}: ${field}.${depName} uses unpublishable specifier "${spec}"`)
				}
				if (spec.startsWith('workspace:')) {
					const target = byName.get(depName)
					if (!target) {
						errors.push(`${label}: ${field}.${depName} uses "${spec}" but "${depName}" is not a workspace member`)
					} else if (target.pkg.private && !target.relDir.startsWith('..')) {
						errors.push(`${label}: ${field}.${depName} depends on private workspace package "${depName}"`)
					}
				}
				if (depName === 'viem' && expectedViemRange && spec !== expectedViemRange) {
					errors.push(`${label}: ${field}.viem is "${spec}", expected "${expectedViemRange}"`)
				}
			}
		}
	}

	// Also verify root devDependencies.viem aligns if present
	const rootPkgPath = join(repoRoot, 'package.json')
	if (expectedViemRange && existsSync(rootPkgPath)) {
		const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'))
		if (rootPkg.devDependencies?.viem && rootPkg.devDependencies.viem !== expectedViemRange) {
			errors.push(
				`package.json: devDependencies.viem is "${rootPkg.devDependencies.viem}", expected "${expectedViemRange}"`,
			)
		}
	}

	return errors
}

/**
 * Verify `@tevm/common` re-exports resolve cleanly against the installed `viem/chains`.
 * @param {string} repoRoot
 * @returns {Promise<{ errors: string[], chainCount: number, viemVersion: string | null }>}
 */
export async function validateCommonAgainstViem(repoRoot) {
	const commonIndexPath = join(repoRoot, 'packages', 'common', 'src', 'index.ts')
	if (!existsSync(commonIndexPath)) return { errors: [], chainCount: 0, viemVersion: null }
	/** @type {string[]} */
	const errors = []
	const src = readFileSync(commonIndexPath, 'utf8')
	const req = createRequire(join(repoRoot, 'package.json'))
	let viemVersion = null
	/** @type {Record<string, unknown>} */
	let chainsMod
	try {
		viemVersion = req('viem/package.json').version
		const chainsPath = req.resolve('viem/chains')
		chainsMod = await import(pathToFileURL(chainsPath).href)
	} catch (error) {
		return {
			errors: [`@tevm/common: unable to load installed viem/chains (${/** @type {Error} */ (error).message})`],
			chainCount: 0,
			viemVersion,
		}
	}

	const chainKeys = new Set(Object.keys(chainsMod))
	const source = ts.createSourceFile(commonIndexPath, src, ts.ScriptTarget.Latest)
	for (const statement of source.statements) {
		if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))) continue
		if (statement.moduleSpecifier?.text !== 'viem/chains') continue
		const clause = ts.isImportDeclaration(statement) ? statement.importClause : statement
		if (clause?.isTypeOnly) continue
		const bindings = ts.isImportDeclaration(statement) ? clause?.namedBindings : statement.exportClause
		for (const item of bindings?.elements ?? []) {
			const importedName = (item.propertyName ?? item.name).text
			if (!item.isTypeOnly && !chainKeys.has(importedName)) {
				errors.push(
					`@tevm/common: imports/re-exports "${importedName}" from viem/chains, which is missing in viem@${viemVersion}`,
				)
			}
		}
	}
	if (!chainKeys.has('foundry')) {
		errors.push(`@tevm/common: viem@${viemVersion} is missing "foundry" required for tevmDefault`)
	}
	return { errors, chainCount: chainKeys.size, viemVersion }
}

/**
 * Verify runtime references between workspace source packages before dist exists.
 * @param {WorkspacePackage[]} allPackages
 * @returns {string[]}
 */
export function validateCrossPackageSymbols(allPackages) {
	const packages = []
	const owners = new Map()
	for (const pkg of allPackages) {
		if (pkg.pkg.private || pkg.relDir.startsWith('..')) continue
		const src = join(pkg.dir, 'src')
		if (!existsSync(src)) continue
		const files = globSync('**/*.{js,ts,cjs,cts,mjs,mts}', { cwd: src })
		const workspace = { dir: pkg.dir, manifest: pkg.pkg }
		const entries = {
			import: sourcePackageEntry(workspace, 'import'),
			require: sourcePackageEntry(workspace, 'require'),
		}
		if (entries.import || entries.require) packages.push({ ...workspace, entries })
		for (const file of files) {
			if (/\.(?:spec|test|d)\.[cm]?[jt]s$/.test(file)) continue
			const path = join(src, file)
			// Some workspaces keep both a JS and TS root barrel. Only the one
			// selected by the build can provide package-root re-exports.
			if (/^index\.[cm]?[jt]s$/.test(file) && !Object.values(entries).includes(path)) continue
			owners.set(path, pkg)
		}
	}
	const sourceEntry = (pkg, mode) => pkg.entries[mode]
	return inspectModules(packages, [...owners.keys()], sourceEntry).map(({ path, name, specifier }) => {
		const pkg = owners.get(path)
		return `${pkg.pkg.name} (${pkg.relDir}/${relative(pkg.dir, path)}): imports "${name}" from "${specifier}", which does not export it`
	})
}

/** Derive the JSR import map from the facade's npm dependency ranges. */
function jsrImports(pkg) {
	return Object.fromEntries(
		Object.entries({ ...pkg.peerDependencies, ...pkg.dependencies })
			.filter(([name]) => name.startsWith('@tevm/') || name === 'viem')
			.map(([name, spec]) => [
				name,
				`npm:${name}@${spec.startsWith('workspace:') ? resolveWorkspaceRange(spec, pkg.version) : spec}`,
			]),
	)
}

/** Refresh release metadata while retaining non-TEVM import aliases. */
export function syncJsr(repoRoot) {
	const path = join(repoRoot, 'tevm/jsr.json')
	const pkg = JSON.parse(readFileSync(join(repoRoot, 'tevm/package.json'), 'utf8'))
	const jsr = JSON.parse(readFileSync(path, 'utf8'))
	jsr.version = pkg.version
	jsr.imports = {
		...Object.fromEntries(Object.entries(jsr.imports ?? {}).filter(([name]) => !name.startsWith('@tevm/'))),
		...jsrImports(pkg),
	}
	writeFileSync(path, `${JSON.stringify(jsr, null, 2)}\n`)
}

/**
 * Validate `tevm` facade parity across `package.json`, `jsr.json`, `index.d.{ts,cts}`, and `typedoc.json`.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function validateTevmFacade(repoRoot) {
	const tevmDir = join(repoRoot, 'tevm')
	if (!existsSync(join(tevmDir, 'package.json'))) return []
	/** @type {string[]} */
	const errors = []
	const pkg = JSON.parse(readFileSync(join(tevmDir, 'package.json'), 'utf8'))

	if (existsSync(join(tevmDir, 'jsr.json'))) {
		const jsr = JSON.parse(readFileSync(join(tevmDir, 'jsr.json'), 'utf8'))
		if (jsr.version !== pkg.version) {
			errors.push(`tevm/jsr.json: version "${jsr.version}" !== tevm/package.json "${pkg.version}"`)
		}
		const expectedImports = jsrImports(pkg)
		for (const name of new Set([
			...Object.keys(expectedImports),
			...Object.keys(jsr.imports ?? {}).filter((key) => key.startsWith('@tevm/')),
		])) {
			if (jsr.imports?.[name] !== expectedImports[name])
				errors.push(`tevm/jsr.json: stale import for ${name}; run --sync-jsr`)
		}
		const pkgSubpaths = Object.keys(pkg.exports ?? {})
			.filter((k) => k !== './package.json')
			.sort()
		const jsrSubpaths = Object.keys(jsr.exports ?? {}).sort()
		for (const sp of pkgSubpaths) {
			if (!jsrSubpaths.includes(sp)) errors.push(`tevm/jsr.json: missing export subpath "${sp}"`)
		}
		for (const sp of jsrSubpaths) {
			if (!pkgSubpaths.includes(sp)) errors.push(`tevm/jsr.json: unexpected export subpath "${sp}" not in package.json`)
		}
	}

	for (const dtsFile of ['index.d.ts', 'index.d.cts']) {
		const fullPath = join(tevmDir, dtsFile)
		if (!existsSync(fullPath)) {
			errors.push(`tevm/${dtsFile}: missing root declaration file`)
			continue
		}
		const content = readFileSync(fullPath, 'utf8')
		for (const retired of RETIRED_PACKAGES) {
			if (content.includes(retired)) {
				errors.push(`tevm/${dtsFile}: references retired pre-ZEVM package "${retired}"`)
			}
		}
	}

	const typedocPath = join(tevmDir, 'typedoc.json')
	if (existsSync(typedocPath)) {
		const typedoc = JSON.parse(readFileSync(typedocPath, 'utf8'))
		for (const ep of typedoc.entryPoints ?? []) {
			if (!existsSync(join(tevmDir, ep))) {
				errors.push(`tevm/typedoc.json: entryPoint "${ep}" does not exist`)
			}
		}
	}

	return errors
}

/**
 * Find any stray `.tgz` tarballs that could be accidentally packed or published.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function findStrayTarballs(repoRoot) {
	const ignored = new Set(['node_modules', '.git', '.jj', '.nx', 'vendor', 'artifacts'])
	const found = []
	function walk(dir) {
		for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
			const path = join(dir, entry.name)
			if (entry.isDirectory()) {
				if (!ignored.has(entry.name)) walk(path)
			} else if (entry.name.endsWith('.tgz')) found.push(path)
		}
	}
	walk('')
	return found.sort()
}

/**
 * Plan `@evmts/*` sibling resolution rewrites (`workspace:*` -> `0.1.0`) and mark sibling manifests private.
 * @param {WorkspacePackage[]} allPackages
 * @param {string} repoRoot
 * @returns {{ edits: PlannedFileEdit[], rewrites: ExternalRewrite[], errors: string[] }}
 */
export function planZevmPublishResolution(allPackages, repoRoot) {
	/** @type {PlannedFileEdit[]} */
	const edits = []
	/** @type {ExternalRewrite[]} */
	const rewrites = []
	/** @type {string[]} */
	const errors = []

	const publishable = allPackages.filter((p) => !p.pkg.private && !p.relDir.startsWith('..'))
	const zevmPackages = allPackages.filter(
		(p) => p.relDir.startsWith('..') && typeof p.pkg.name === 'string' && p.pkg.name.startsWith('@evmts/'),
	)
	const zevmByName = new Map(zevmPackages.map((p) => [p.pkg.name, p]))

	// Rewrite workspace: references to @evmts/* in publishable TEVM packages
	for (const entry of publishable) {
		let mutated = false
		const nextPkg = structuredClone(entry.pkg)
		for (const field of RUNTIME_DEP_FIELDS) {
			const deps = nextPkg[field]
			if (!deps || typeof deps !== 'object') continue
			for (const [depName, spec] of Object.entries(deps)) {
				if (!depName.startsWith('@evmts/') || typeof spec !== 'string' || !spec.startsWith('workspace:')) continue
				const sibling = zevmByName.get(depName)
				if (!sibling) {
					errors.push(`${entry.pkg.name}: depends on "${depName}" (${spec}) but sibling ../zevm checkout is missing`)
					continue
				}
				if (typeof sibling.pkg.version !== 'string' || !parseSemver(sibling.pkg.version)) {
					errors.push(`${depName}: invalid sibling version "${sibling.pkg.version}"`)
					continue
				}
				const resolved = resolveWorkspaceRange(spec, sibling.pkg.version)
				deps[depName] = resolved
				mutated = true
				rewrites.push({
					pkgName: entry.pkg.name,
					depName,
					from: spec,
					to: resolved,
					targetVersion: sibling.pkg.version,
				})
			}
		}
		if (mutated) {
			edits.push({
				path: entry.manifestPath,
				nextContent: `${JSON.stringify(nextPkg, null, '\t')}\n`,
				description: `${entry.pkg.name}: rewrite @evmts/* workspace dep for publish`,
			})
		}
	}

	// Mark sibling ../zevm/npm/**/package.json @evmts/* packages private so Changesets skips them
	const zevmRoot = resolve(repoRoot, '..', 'zevm', 'npm')
	if (existsSync(zevmRoot)) {
		for (const rel of globSync('**/package.json', { cwd: zevmRoot }).sort()) {
			const fullPath = join(zevmRoot, rel)
			const pkg = JSON.parse(readFileSync(fullPath, 'utf8'))
			if (typeof pkg.name === 'string' && pkg.name.startsWith('@evmts/') && pkg.private !== true) {
				const nextPkg = { ...pkg, private: true }
				edits.push({
					path: fullPath,
					nextContent: `${JSON.stringify(nextPkg, null, 2)}\n`,
					description: `${pkg.name}: mark private for Changesets publish`,
				})
			}
		}
	}

	return { edits, rewrites, errors }
}

/**
 * Verify rewritten external dependencies (such as `@evmts/zevm@0.1.0`) actually exist on npm.
 * @param {ExternalRewrite[]} rewrites
 * @param {{ registryUrl?: string, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<string[]>}
 */
export async function verifyExternalRegistryAvailability(
	rewrites,
	{ registryUrl = DEFAULT_REGISTRY_URL, fetchImpl = fetch } = {},
) {
	/** @type {string[]} */
	const errors = []
	/** @type {Map<string, string[]>} */
	const versionsCache = new Map()

	for (const rw of rewrites) {
		let versions = versionsCache.get(rw.depName)
		if (!versions) {
			const encoded = rw.depName.replace('/', '%2F')
			const url = `${registryUrl.replace(/\/+$/, '')}/${encoded}`
			try {
				const res = await fetchImpl(url, { headers: { accept: 'application/vnd.npm.install-v1+json' } })
				if (!res.ok) {
					errors.push(`${rw.pkgName}: registry lookup for ${rw.depName} failed with HTTP ${res.status}`)
					versionsCache.set(rw.depName, [])
					continue
				}
				const data = /** @type {{ versions?: Record<string, unknown> }} */ (await res.json())
				versions = Object.keys(data.versions ?? {})
				versionsCache.set(rw.depName, versions)
			} catch (error) {
				errors.push(
					`${rw.pkgName}: registry lookup for ${rw.depName} errored (${/** @type {Error} */ (error).message})`,
				)
				versionsCache.set(rw.depName, [])
				continue
			}
		}
		if (!versions.some((v) => satisfiesRange(v, rw.to))) {
			errors.push(
				`${rw.pkgName}: ${rw.depName}@${rw.to} is not published on npm (available: ${versions.join(', ') || 'none'})`,
			)
		}
	}
	return errors
}

/**
 * Atomically back up original file bytes and apply planned manifest edits.
 * @param {PlannedFileEdit[]} edits
 * @param {string} backupPath
 */
export function applyPublishPrep(edits, backupPath) {
	if (existsSync(backupPath)) {
		throw new Error(`Backup file already exists at ${backupPath}; run --restore before applying again`)
	}
	/** @type {Record<string, string>} */
	const originals = {}
	for (const edit of edits) {
		originals[edit.path] = readFileSync(edit.path, 'utf8')
	}
	mkdirSync(dirname(backupPath), { recursive: true })
	// Publish a complete backup without replacing an existing one, even if
	// another prepare process passed the existence check at the same time.
	const staging = mkdtempSync(join(dirname(backupPath), '.publish-backup-'))
	try {
		const staged = join(staging, 'originals')
		writeFileSync(staged, `${JSON.stringify({ version: 1, files: originals }, null, 2)}\n`)
		try {
			linkSync(staged, backupPath)
		} catch (error) {
			if (error.code === 'EEXIST')
				throw new Error(`Backup file already exists at ${backupPath}; run --restore before applying again`)
			throw error
		}
	} finally {
		rmSync(staging, { recursive: true, force: true })
	}
	for (const edit of edits) {
		writeFileSync(edit.path, edit.nextContent)
	}
}

/**
 * Restore original manifest bytes from backup and remove the backup file (idempotent).
 * @param {string} backupPath
 * @returns {number}
 */
export function restorePublishPrep(backupPath) {
	if (!existsSync(backupPath)) return 0
	const payload = /** @type {{ files: Record<string, string> }} */ (JSON.parse(readFileSync(backupPath, 'utf8')))
	const entries = Object.entries(payload.files ?? {})
	for (const [filePath, originalContent] of entries) {
		writeFileSync(filePath, originalContent)
	}
	rmSync(backupPath, { force: true })
	return entries.length
}

/**
 * Run the full pre-publish validation and optional apply/restore workflow.
 * @param {{
 *   repoRoot: string,
 *   mode: 'dry-run' | 'apply' | 'restore',
 *   checkDist?: boolean,
 *   checkRegistry?: boolean,
 *   backupPath?: string,
 *   registryUrl?: string,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export async function runPublishPrep({
	repoRoot,
	mode,
	checkDist = false,
	checkRegistry = false,
	backupPath = join(repoRoot, DEFAULT_BACKUP_REL),
	registryUrl = DEFAULT_REGISTRY_URL,
	fetchImpl = fetch,
}) {
	if (mode === 'restore') {
		const restored = restorePublishPrep(backupPath)
		return {
			ok: true,
			restored,
			errors: [],
			edits: [],
			rewrites: [],
			publishableCount: 0,
			chainCount: 0,
			viemVersion: null,
		}
	}

	const allPackages = discoverWorkspacePackages(repoRoot)
	const publishable = allPackages.filter((p) => !p.pkg.private && !p.relDir.startsWith('..'))
	const rootPkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
	const expectedViemRange = rootPkg.devDependencies?.viem

	const commonResult = await validateCommonAgainstViem(repoRoot)
	const zevmPlan = planZevmPublishResolution(allPackages, repoRoot)
	const strayTarballs = findStrayTarballs(repoRoot).map((f) => `Stray tarball in repo: ${f}`)

	/** @type {string[]} */
	const errors = [
		...validateChangesetLockstep(repoRoot, allPackages),
		...validatePackageManifests(allPackages, { repoRoot, checkDist, expectedViemRange }),
		...commonResult.errors,
		...validateCrossPackageSymbols(allPackages),
		...validateTevmFacade(repoRoot),
		...strayTarballs,
		...zevmPlan.errors,
	]

	if (checkRegistry && zevmPlan.rewrites.length > 0) {
		errors.push(...(await verifyExternalRegistryAvailability(zevmPlan.rewrites, { registryUrl, fetchImpl })))
	}

	if (errors.length > 0) {
		return {
			ok: false,
			restored: 0,
			errors,
			edits: zevmPlan.edits,
			rewrites: zevmPlan.rewrites,
			publishableCount: publishable.length,
			chainCount: commonResult.chainCount,
			viemVersion: commonResult.viemVersion,
		}
	}

	if (mode === 'apply') {
		if (existsSync(backupPath)) {
			throw new Error(`Backup file already exists at ${backupPath}; run --restore before applying again`)
		}
		if (zevmPlan.edits.length > 0) {
			applyPublishPrep(zevmPlan.edits, backupPath)
		}
	}

	return {
		ok: true,
		restored: 0,
		errors: [],
		edits: zevmPlan.edits,
		rewrites: zevmPlan.rewrites,
		publishableCount: publishable.length,
		chainCount: commonResult.chainCount,
		viemVersion: commonResult.viemVersion,
	}
}

/**
 * Parse CLI arguments. Defaults to `--dry-run` locally and `--apply --check-registry` in GitHub Actions.
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} [env]
 */
export function parseCliArgs(argv, env = process.env) {
	const isCi = env.GITHUB_ACTIONS === 'true'
	/** @type {'dry-run' | 'apply' | 'restore' | 'sync-jsr'} */
	let mode = isCi ? 'apply' : 'dry-run'
	let checkDist = isCi
	let checkRegistry = isCi
	let repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
	/** @type {string | undefined} */
	let backupPath
	let registryUrl = env.npm_config_registry || DEFAULT_REGISTRY_URL

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === '--dry-run') mode = 'dry-run'
		else if (arg === '--sync-jsr') mode = 'sync-jsr'
		else if (arg === '--apply') mode = 'apply'
		else if (arg === '--restore') mode = 'restore'
		else if (arg === '--check-dist') checkDist = true
		else if (arg === '--skip-dist-check') checkDist = false
		else if (arg === '--check-registry') checkRegistry = true
		else if (arg === '--skip-registry') checkRegistry = false
		else if (arg === '--repo-root' && argv[i + 1]) repoRoot = resolve(argv[++i])
		else if (arg === '--backup-file' && argv[i + 1]) backupPath = resolve(argv[++i])
		else if (arg === '--registry-url' && argv[i + 1]) registryUrl = argv[++i]
		else throw new Error(`Unknown argument: ${arg}`)
	}
	return { mode, checkDist, checkRegistry, repoRoot, backupPath, registryUrl }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isDirectRun) {
	const opts = parseCliArgs(process.argv.slice(2))
	if (opts.mode === 'sync-jsr') {
		syncJsr(opts.repoRoot)
		process.exit(0)
	}
	const result = await runPublishPrep(opts)
	if (opts.mode === 'restore') {
		console.log(`Restored ${result.restored} manifest(s).`)
		process.exit(0)
	}
	if (!result.ok) {
		console.error(`Publish preflight FAILED (${result.errors.length} error(s); nothing written):`)
		for (const err of result.errors) console.error(`  - ${err}`)
		process.exit(1)
	}
	console.log(
		`Publish preflight OK (${opts.mode}): ${result.publishableCount} publishable package(s), viem@${result.viemVersion ?? 'unknown'} (${result.chainCount} chains verified), ${result.edits.length} planned manifest update(s).`,
	)
	for (const rw of result.rewrites) {
		console.log(`  rewrite: ${rw.pkgName} ${rw.depName}: ${rw.from} -> ${rw.to}`)
	}
}
