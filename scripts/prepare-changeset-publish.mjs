import { existsSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
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
 * Minimal glob matcher for npm `files` entries and pnpm workspace patterns.
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
		const line = rawLine.replace(/#.*$/, '')
		if (/^packages\s*:/.test(line)) {
			inPackages = true
			continue
		}
		if (inPackages && /^\S/.test(line)) {
			inPackages = false
			continue
		}
		if (!inPackages) continue
		const m = line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/)
		if (!m) continue
		const pattern = m[1].trim()
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
	const excludeRes = exclude.map((p) => globToRegExp(p))
	/** @type {Map<string, WorkspacePackage>} */
	const seen = new Map()

	for (const pattern of include) {
		const manifestPattern = pattern.endsWith('/') ? `${pattern}package.json` : `${pattern}/package.json`
		for (const match of globSync(manifestPattern, { cwd: repoRoot })) {
			const manifestPath = resolve(repoRoot, match)
			const dir = dirname(manifestPath)
			const relDir = relative(repoRoot, dir).replace(/\\/g, '/')
			if (relDir.includes('node_modules')) continue
			if (excludeRes.some((re) => re.test(relDir))) continue
			if (seen.has(manifestPath)) continue
			const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'))
			seen.set(manifestPath, { dir, manifestPath, relDir, pkg })
		}
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
	const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/)
	if (!m) return null
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease: m[4] ?? null }
}

/**
 * Minimal semver satisfaction check for exact, `^`, and `~` ranges.
 * @param {string} version
 * @param {string} range
 * @returns {boolean}
 */
export function satisfiesRange(version, range) {
	const v = parseSemver(version)
	if (!v) return false
	if (range.startsWith('^')) {
		const r = parseSemver(range.slice(1))
		if (!r) return false
		if (v.prerelease && (v.major !== r.major || v.minor !== r.minor || v.patch !== r.patch)) return false
		if (r.major > 0) return v.major === r.major && (v.minor > r.minor || (v.minor === r.minor && v.patch >= r.patch))
		if (r.minor > 0) return v.major === 0 && v.minor === r.minor && v.patch >= r.patch
		return v.major === 0 && v.minor === 0 && v.patch === r.patch
	}
	if (range.startsWith('~')) {
		const r = parseSemver(range.slice(1))
		if (!r) return false
		if (v.prerelease && (v.major !== r.major || v.minor !== r.minor || v.patch !== r.patch)) return false
		return v.major === r.major && v.minor === r.minor && v.patch >= r.patch
	}
	return version === range
}

/**
 * Resolve a workspace specifier (`workspace:*`, `workspace:^`, `workspace:~`) into a published range.
 * @param {string} spec
 * @param {string} targetVersion
 * @returns {string}
 */
export function resolveWorkspaceRange(spec, targetVersion) {
	if (spec === 'workspace:*' || spec === 'workspace:^') return `^${targetVersion}`
	if (spec === 'workspace:~') return `~${targetVersion}`
	const explicit = spec.slice('workspace:'.length)
	return explicit || `^${targetVersion}`
}

/**
 * Enforce lockstep (`fixed`) versioning in `.changeset/config.json` to prevent #2097 skew.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function validateChangesetLockstep(repoRoot) {
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
		(group) => Array.isArray(group) && group.includes('@tevm/*') && group.includes('tevm'),
	)
	if (!hasCoreLockstep) {
		errors.push('.changeset/config.json: "fixed" must lockstep ["@tevm/*", "tevm", ...] together')
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
		if (!node || typeof node !== 'object' || Array.isArray(node)) return
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
	}

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

		if (typeof pkg.version !== 'string' || !SEMVER_RE.test(pkg.version)) {
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
			if (checkDist && !existsSync(join(dir, target))) {
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
				if (FORBIDDEN_PROTOCOL_RE.test(spec) || spec.endsWith('.tgz')) {
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
	// Check every explicit named import/re-export from 'viem/chains'
	const namedRe = /(?:import|export)\s*\{([^}]+)\}\s*from\s*['"]viem\/chains['"]/g
	for (const match of src.matchAll(namedRe)) {
		for (const rawPart of match[1].split(',')) {
			const cleaned = rawPart.replace(/^\s*type\s+/, '').trim()
			if (!cleaned) continue
			const importedName = cleaned.split(/\s+as\s+/)[0].trim()
			if (!chainKeys.has(importedName)) {
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

/** Strip block and line comments so JSDoc `@example` snippets are never misread as live imports. */
/** @param {string} src */
function stripComments(src) {
	return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
}

/**
 * Collect exported runtime symbol names from a package's source tree (recursive barrel walk).
 * @param {string} entryFile
 * @param {Set<string>} [visited]
 * @returns {{ symbols: Set<string>, hasExternalStar: boolean }}
 */
function collectSourceExports(entryFile, visited = new Set()) {
	/** @type {Set<string>} */
	const symbols = new Set()
	let hasExternalStar = false
	const abs = resolve(entryFile)
	if (visited.has(abs) || !existsSync(abs)) return { symbols, hasExternalStar }
	visited.add(abs)
	const src = stripComments(readFileSync(abs, 'utf8'))

	// export const/let/var/function/class Name
	for (const m of src.matchAll(/\bexport\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
		symbols.add(m[1])
	}
	// export { a, b as c } [from '...']
	for (const m of src.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
		for (const part of m[1].split(',')) {
			const trimmed = part.trim()
			if (!trimmed || /^type\s+/.test(trimmed)) continue
			const asMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/)
			symbols.add(asMatch ? asMatch[2] : trimmed)
		}
	}
	// export * from '...'
	for (const m of src.matchAll(/\bexport\s+\*\s+from\s*['"]([^'"]+)['"]/g)) {
		const spec = m[1]
		if (!spec.startsWith('.')) {
			hasExternalStar = true
			continue
		}
		const base = resolve(dirname(abs), spec.replace(/\.(?:js|mjs|cjs)$/, ''))
		for (const candidate of [`${base}.ts`, `${base}.js`, join(base, 'index.ts'), join(base, 'index.js')]) {
			if (existsSync(candidate)) {
				const child = collectSourceExports(candidate, visited)
				for (const name of child.symbols) symbols.add(name)
				if (child.hasExternalStar) hasExternalStar = true
				break
			}
		}
	}
	return { symbols, hasExternalStar }
}

/**
 * Static Issue #2097 regression guard: verify runtime named imports between `@tevm/*` packages
 * actually exist in the target package's source exports (e.g. `NoSignerAvailableError` in `@tevm/errors`).
 * @param {WorkspacePackage[]} allPackages
 * @returns {string[]}
 */
export function validateCrossPackageSymbols(allPackages) {
	/** @type {string[]} */
	const errors = []
	const publishable = allPackages.filter((p) => !p.pkg.private && !p.relDir.startsWith('..'))
	/** @type {Map<string, { symbols: Set<string>, hasExternalStar: boolean }>} */
	const exportCache = new Map()

	for (const pkg of publishable) {
		const entry = [join(pkg.dir, 'src', 'index.ts'), join(pkg.dir, 'src', 'index.js')].find((p) => existsSync(p))
		if (entry) exportCache.set(pkg.pkg.name, collectSourceExports(entry))
	}

	const importRe = /\bimport\s+(?!type\b)\{([^}]+)\}\s*from\s*['"](@tevm\/[^'"/]+)['"]/g
	for (const pkg of publishable) {
		const srcDir = join(pkg.dir, 'src')
		if (!existsSync(srcDir)) continue
		for (const relFile of globSync('**/*.{js,ts}', { cwd: srcDir })) {
			if (/\.(?:spec|test|d)\.[jt]s$/.test(relFile)) continue
			const content = stripComments(readFileSync(join(srcDir, relFile), 'utf8'))
			for (const match of content.matchAll(importRe)) {
				const targetName = match[2]
				if (targetName === pkg.pkg.name) continue
				const targetInfo = exportCache.get(targetName)
				if (!targetInfo || targetInfo.hasExternalStar || targetInfo.symbols.size === 0) continue
				for (const rawPart of match[1].split(',')) {
					const trimmed = rawPart.trim()
					if (!trimmed || /^type\s+/.test(trimmed)) continue
					const imported = trimmed.split(/\s+as\s+/)[0].trim()
					if (!targetInfo.symbols.has(imported)) {
						errors.push(
							`${pkg.pkg.name} (${pkg.relDir}/src/${relFile}): imports "${imported}" from "${targetName}", which does not export it`,
						)
					}
				}
			}
		}
	}
	return errors
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
	return globSync('**/*.tgz', { cwd: repoRoot }).filter(
		(rel) => !/(?:^|\/)(?:node_modules|\.git|\.jj|\.nx|vendor|artifacts)\//.test(rel),
	)
}

/**
 * Plan `@evmts/*` sibling resolution rewrites (`workspace:*` -> `^0.1.0`) and mark sibling manifests private.
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
				if (typeof sibling.pkg.version !== 'string' || !SEMVER_RE.test(sibling.pkg.version)) {
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
 * Verify rewritten external dependencies (such as `@evmts/zevm@^0.1.0`) actually exist on npm.
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
	writeFileSync(backupPath, `${JSON.stringify({ version: 1, files: originals }, null, 2)}\n`)
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
		...validateChangesetLockstep(repoRoot),
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
	/** @type {'dry-run' | 'apply' | 'restore'} */
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
