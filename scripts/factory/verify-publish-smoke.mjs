#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import {
	globSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { repositoryRoot } from './lib.mjs'

/** @typedef {{ dir: string, manifest: Record<string, any> }} SmokePackage */

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const isFile = (path) => statSync(path, { throwIfNoEntry: false })?.isFile()
// Sibling ZEVM packages have their own release train. Pack its native dependency on demand.
function isPublishable(root, pkg) {
	const path = relative(realpathSync(root), realpathSync(pkg.dir))
	return !pkg.manifest.private && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}
const declaration = /\.d\.[cm]?ts$/
const emitted = /\.(?:[cm]?js|d\.[cm]?ts)$/
const env = { ...process.env, npm_config_ignore_scripts: 'true', npm_config_update_notifier: 'false' }
delete env.NODE_PATH
delete env.ZEVM_NATIVE_PATH

function run(bin, args, cwd, check) {
	try {
		return execFileSync(bin, args, {
			cwd,
			env,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			timeout: 300_000,
		}).trim()
	} catch (error) {
		const output = [error.stdout?.trim(), error.stderr?.trim()].filter(Boolean).join('\n')
		throw new Error(`${check}: ${output || error.message}`)
	}
}

export function workspacePackages(root) {
	const entries = JSON.parse(
		run('pnpm', ['list', '-r', '--depth', '-1', '--json'], root, 'discover workspace packages'),
	)
	return entries
		.filter(({ path }) => realpathSync(root) !== realpathSync(path))
		.map(({ path }) => ({ dir: path, manifest: readJson(join(path, 'package.json')) }))
}

function* filesIn(dir, workspaceDirs) {
	for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const path = join(dir, item.name)
		if (item.isDirectory()) {
			if (item.name !== 'node_modules' && item.name !== '.git' && !workspaceDirs.has(path)) {
				yield* filesIn(path, workspaceDirs)
			}
		} else {
			yield path
		}
	}
}

function exportEntries(exports) {
	if (exports === undefined) return []
	if (exports && Object.keys(exports).some((key) => key.startsWith('.'))) return Object.entries(exports)
	return [['.', exports]]
}

function* exportLeaves(value, conditions = []) {
	if (typeof value === 'string') yield { target: value, conditions }
	else if (Array.isArray(value)) {
		for (const entry of value) yield* exportLeaves(entry, conditions)
	} else if (value !== null && typeof value === 'object') {
		for (const [key, entry] of Object.entries(value)) yield* exportLeaves(entry, [...conditions, key])
	} else if (value !== null) {
		yield { target: value, conditions }
	}
}

function validTarget(target) {
	return (
		typeof target === 'string' &&
		target.startsWith('./') &&
		!target
			.slice(2)
			.split('/')
			.some((part) => ['.', '..', 'node_modules'].includes(part)) &&
		!/[\\%]/.test(target)
	)
}

// Read the exported configuration without evaluating package build scripts.
function tsupEntries(config) {
	const source = ts.createSourceFile(config, readFileSync(config, 'utf8'), ts.ScriptTarget.Latest)
	const bindings = new Map()
	function entries(node, seen = new Set()) {
		if (!node || seen.has(node)) return
		seen.add(node)
		if (ts.isIdentifier(node)) return entries(bindings.get(node.text), seen)
		if (ts.isCallExpression(node)) return entries(node.arguments[0], seen)
		if (!ts.isObjectLiteralExpression(node)) return
		// Later properties (including spreads) override earlier ones.
		for (const item of [...node.properties].reverse()) {
			if (ts.isPropertyAssignment(item) && item.name.text === 'entry') {
				return ts.isArrayLiteralExpression(item.initializer)
					? item.initializer.elements.filter(ts.isStringLiteralLike).map((element) => element.text)
					: []
			}
			if (ts.isSpreadAssignment(item)) {
				const inherited = entries(item.expression, seen)
				if (inherited) return inherited
			}
		}
	}
	let exported
	for (const node of source.statements) {
		if (ts.isVariableStatement(node)) {
			for (const decl of node.declarationList.declarations) {
				if (ts.isIdentifier(decl.name)) bindings.set(decl.name.text, decl.initializer)
			}
		} else if (ts.isExportAssignment(node)) exported = node.expression
		else if (
			ts.isExpressionStatement(node) &&
			ts.isBinaryExpression(node.expression) &&
			node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			node.expression.left.getText(source) === 'module.exports'
		) {
			exported = node.expression.right
		}
	}
	return entries(exported) ?? ['src/index.js']
}

// Map missing outputs back to the configured tsup entry or tsc source.
// An arbitrary file under dist/ or types/ is insufficient evidence.
function buildSource({ dir, manifest }, target) {
	const path = target.replace(/^\.\//, '')
	const stem = path.replace(/(?:\.d)?\.[cm]?js$|\.d\.[cm]?ts$/, '')
	if (stem === path) return
	const tsupExtensions =
		manifest.type === 'module' ? ['.js', '.cjs', '.d.ts', '.d.cts'] : ['.js', '.mjs', '.d.ts', '.d.mts']
	if (stem.startsWith('dist/') && tsupExtensions.includes(path.slice(stem.length))) {
		const name = stem.slice('dist/'.length)
		const config = globSync('tsup.config.{ts,js,mjs,cjs}', { cwd: dir })[0]
		if (config) {
			const entries = tsupEntries(join(dir, config))
			const source = entries.find(
				(file) =>
					file
						.replace(/^\.\//, '')
						.replace(/^src\//, '')
						.replace(/\.[^.]+$/, '') === name,
			)
			if (source && isFile(join(dir, source))) return join(dir, source)
		}
	}
	const config = ts.readConfigFile(join(dir, 'tsconfig.json'), ts.sys.readFile).config?.compilerOptions
	if (config?.outDir && stem.startsWith(`${config.outDir.replace(/^\.\//, '')}/`)) {
		if (declaration.test(path) && config.declaration === false && !config.composite) return
		const source = join(dir, config.rootDir ?? '.', stem.slice(config.outDir.replace(/^\.\//, '').length + 1))
		const suffix = path.slice(stem.length).replace(/^\.d/, '')
		const extensions = suffix.startsWith('.m')
			? ['.mts', '.mjs']
			: suffix.startsWith('.c')
				? ['.cts', '.cjs']
				: ['.ts', '.tsx', '.js', '.jsx']
		return extensions.map((ext) => source + ext).find(isFile)
	}
}

function isWasiBuildOutput(pkg, target, packagesByDir) {
	const parent = packagesByDir.get(dirname(dirname(pkg.dir)))?.manifest
	return (
		parent?.napi?.targets?.includes('wasm32-wasip1-threads') &&
		pkg.manifest.files?.includes(target.slice(2)) &&
		[`./${parent.napi.binaryName}.wasi.cjs`, `./${parent.napi.binaryName}.wasi-browser.js`].includes(target)
	)
}

/** Check a literal or wildcard export target for at least one regular file.
 * @param {string} dir
 * @param {string} target
 * @returns {boolean}
 */
export const hasExportFile = (dir, target) =>
	target.includes('*')
		? globSync(target, { cwd: dir }).some((path) => isFile(join(dir, path)))
		: isFile(join(dir, target))

function exportProblems(pkg, hasTarget) {
	return exportEntries(pkg.manifest.exports).flatMap(([key, value]) =>
		[...exportLeaves(value)].flatMap(({ target, conditions }) => {
			const label = `${pkg.manifest.name} exports ${key}${conditions.length ? ` (${conditions.join('/')})` : ''}`
			if (!validTarget(target)) return [`${label}: invalid target ${JSON.stringify(target)}`]
			return hasTarget(target) ? [] : [`${label}: missing target ${target}`]
		}),
	)
}

function entryProblems(pkg, hasTarget) {
	const { manifest } = pkg
	const problems = exportProblems(pkg, hasTarget)
	const entries = ['main', 'module', 'types'].filter((key) => key in manifest).map((key) => [key, manifest[key]])
	if (typeof manifest.bin === 'string') entries.push(['bin', manifest.bin])
	else for (const [name, target] of Object.entries(manifest.bin ?? {})) entries.push([`bin.${name}`, target])
	for (const [field, path] of entries) {
		const target = typeof path === 'string' && `./${path.replace(/^\.\//, '')}`
		if (!target || target.includes('*') || target.includes('//') || !validTarget(target) || !hasTarget(target)) {
			problems.push(`${manifest.name} ${field}: invalid or missing target ${JSON.stringify(path)}`)
		}
	}
	return problems
}

function selectCondition(value, conditions) {
	if (typeof value === 'string' || value === null) return value
	if (Array.isArray(value))
		return value.map((entry) => selectCondition(entry, conditions)).find((entry) => entry != null)
	if (value && typeof value === 'object') {
		for (const [key, entry] of Object.entries(value)) {
			if (key === 'default' || conditions.has(key)) {
				const target = selectCondition(entry, conditions)
				if (target !== undefined) return target
			}
		}
	}
}

function manifestTarget(manifest, subpath, mode, types) {
	if (manifest.exports === undefined) {
		if (subpath !== '.') return subpath
		const legacy = (types && manifest.types) || manifest.main || 'index.js'
		return `./${legacy.replace(/^\.\//, '')}`
	}
	const entries = exportEntries(manifest.exports)
	const conditions = new Set(['node', 'node-addons', mode, ...(types ? ['types'] : [])])
	const exact = entries.find(([key]) => key === subpath)
	if (exact) return selectCondition(exact[1], conditions)
	const patterns = entries
		.filter(([key]) => key.includes('*'))
		.sort(([a], [b]) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)
	for (const [key, entry] of patterns) {
		const [prefix, suffix] = key.split('*')
		if (subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= prefix.length + suffix.length) {
			return selectCondition(entry, conditions)?.replaceAll(
				'*',
				subpath.slice(prefix.length, subpath.length - suffix.length),
			)
		}
	}
}

/**
 * Map an exported runtime condition to its source before preparing a release.
 * @param {SmokePackage} pkg
 * @param {'import' | 'require'} mode
 * @returns {string | undefined}
 */
export function sourcePackageEntry(pkg, mode) {
	const target = manifestTarget(pkg.manifest, '.', mode, false)
	if (validTarget(target)) {
		const path = join(pkg.dir, target)
		if (target.startsWith('./src/') && isFile(path)) return path
		const source = buildSource(pkg, target)
		if (source) return source
	}
	const exts = mode === 'require' ? ['cts', 'cjs', 'ts', 'js', 'mts', 'mjs'] : ['mts', 'mjs', 'ts', 'js', 'cts', 'cjs']
	return exts.map((ext) => join(pkg.dir, 'src', `index.${ext}`)).find(isFile)
}

/**
 * Check statically named workspace imports, following the selected module condition and barrel bindings.
 * @template {SmokePackage} P
 * @param {P[]} packages
 * @param {string[] | Set<string>} paths
 * @param {(pkg: P, mode: 'import' | 'require') => string | undefined} [sourceEntry] Source resolver before dist exists.
 * @returns {{ path: string, message: string, name?: string, specifier: string }[]}
 */
export function inspectModules(packages, paths, sourceEntry) {
	const findings = []
	const modules = new Map()
	const byName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]))
	const options = { allowJs: true, module: ts.ModuleKind.NodeNext, noLib: true, noResolve: true, types: [] }
	const text = (node) => (node && (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) ? node.text : undefined)

	const program = ts.createProgram([...paths], options)
	function inspect(path) {
		if (modules.has(path)) return modules.get(path)
		const owner = program.getSourceFile(path) ? program : ts.createProgram([path], options)
		const source = owner.getSourceFile(path)
		const checker = owner.getTypeChecker()
		const symbol = source && checker.getSymbolAtLocation(source)
		const exports = new Map()
		for (const exported of symbol ? checker.getExportsOfModule(symbol) : []) {
			const local = exported.declarations?.find(
				(decl) => ts.isExportSpecifier(decl) && !decl.parent.parent.moduleSpecifier,
			)
			const binding = local ? checker.getExportSpecifierLocalTargetSymbol(local) : exported
			if (!binding?.declarations?.length) continue
			const runtime =
				binding.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Alias) &&
				!exported.declarations?.every(ts.isTypeOnlyImportOrExportDeclaration)
			exports.set(exported.name, Boolean(runtime))
		}
		const references = []
		const commonJS =
			/\.c[jt]s$/.test(path) ||
			(path.endsWith('.js') &&
				source?.impliedNodeFormat === ts.ModuleKind.CommonJS &&
				!source.statements.some(
					(node) =>
						ts.isImportDeclaration(node) ||
						ts.isExportDeclaration(node) ||
						ts.isExportAssignment(node) ||
						node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
				))
		const info = { exports, references, commonJS }
		modules.set(path, info)
		if (!source) return info

		const defaultMode = /\.[c]([jt])s$/.test(path) ? 'require' : 'import'
		const add = (specifier, mode = defaultMode, name, types = false, star = false, exported) => {
			if (specifier)
				references.push({ specifier, name, mode, types: types || source.isDeclarationFile, star, exported })
		}
		const requiredModule = (node) =>
			node &&
			ts.isCallExpression(node) &&
			text(node.expression) === 'require' &&
			node.arguments[0] &&
			ts.isStringLiteralLike(node.arguments[0])
				? node.arguments[0].text
				: undefined
		const addNamespaceUse = (node, name, star = false) => {
			const binding = node && ts.isIdentifier(node) && checker.getSymbolAtLocation(node)?.declarations?.[0]
			if (binding && ts.isNamespaceImport(binding)) {
				add(text(binding.parent.parent.moduleSpecifier), defaultMode, name, binding.parent.isTypeOnly, star)
				return
			}
			let initializer = binding && ts.isVariableDeclaration(binding) ? binding.initializer : node
			if (initializer && ts.isAwaitExpression(initializer)) initializer = initializer.expression
			if (
				initializer &&
				ts.isCallExpression(initializer) &&
				initializer.expression.kind === ts.SyntaxKind.ImportKeyword
			) {
				add(text(initializer.arguments[0]), 'import', name, false, star)
			} else {
				add(requiredModule(initializer), 'require', name, false, star)
			}
		}

		function visit(node) {
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
				const specifier = text(node.moduleSpecifier)
				const clause = ts.isImportDeclaration(node) ? node.importClause : node
				const bindings = ts.isImportDeclaration(node) ? clause?.namedBindings : node.exportClause
				const star = ts.isExportDeclaration(node) && !bindings
				add(specifier, defaultMode, undefined, clause?.isTypeOnly, star)
				if (clause?.name) add(specifier, defaultMode, 'default', clause.isTypeOnly)
				for (const item of bindings?.elements ?? []) {
					if (!specifier && ts.isExportSpecifier(item)) {
						const local = checker.getExportSpecifierLocalTargetSymbol(item)?.declarations?.[0]
						if (local && ts.isImportSpecifier(local)) {
							const clause = local.parent.parent
							add(
								text(clause.parent.moduleSpecifier),
								defaultMode,
								text(local.propertyName ?? local.name),
								clause.isTypeOnly || local.isTypeOnly || item.isTypeOnly,
								false,
								text(item.name),
							)
						} else if (local && ts.isImportClause(local)) {
							add(
								text(local.parent.moduleSpecifier),
								defaultMode,
								'default',
								local.isTypeOnly || item.isTypeOnly,
								false,
								text(item.name),
							)
						}
					}
					add(
						specifier,
						defaultMode,
						text(item.propertyName ?? item.name),
						clause?.isTypeOnly || item.isTypeOnly,
						false,
						ts.isExportDeclaration(node) ? text(item.name) : undefined,
					)
				}
			} else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
				let qualifier = node.qualifier
				while (qualifier && ts.isQualifiedName(qualifier)) qualifier = qualifier.left
				add(text(node.argument.literal), defaultMode, text(qualifier), true)
			} else if (ts.isExternalModuleReference(node)) {
				add(text(node.expression), 'require')
			} else if (ts.isCallExpression(node)) {
				if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(text(node.arguments[0]), 'import')
				add(requiredModule(node), 'require')
				// Rollup and esbuild write CommonJS star re-exports in these forms.
				if (ts.isPropertyAccessExpression(node.expression) && node.expression.getText() === 'Object.keys') {
					const loop = node.parent
					if (
						ts.isPropertyAccessExpression(loop) &&
						loop.name.text === 'forEach' &&
						/defineProperty\(exports,/.test(loop.parent.getText())
					) {
						addNamespaceUse(node.arguments[0], undefined, true)
					}
				} else if (text(node.expression) === '__reExport' && text(node.arguments[0]) === 'exports') {
					addNamespaceUse(node.arguments[1], undefined, true)
				}
			} else if (
				ts.isBinaryExpression(node) &&
				node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				node.left.getText() === 'module.exports'
			) {
				addNamespaceUse(node.right, undefined, true)
			} else if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
				const property = ts.isPropertyAccessExpression(node)
					? text(node.name)
					: node.argumentExpression && ts.isStringLiteralLike(node.argumentExpression) && node.argumentExpression.text
				if (property) addNamespaceUse(node.expression, property)
			} else if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
				for (const item of node.name.elements) {
					if (!item.dotDotDotToken) addNamespaceUse(node.initializer, text(item.propertyName ?? item.name))
				}
			}
			ts.forEachChild(node, visit)
		}
		visit(source)
		return info
	}

	function resolveImport(from, { specifier, mode, types }) {
		const [, name, subpath = ''] = /^(@tevm\/[^/]+)(\/.*)?$/.exec(specifier) ?? []
		if (name) {
			const pkg = byName.get(name)
			if (!pkg) return
			if (sourceEntry && !subpath) return sourceEntry(pkg, mode)
			const target = manifestTarget(pkg.manifest, subpath ? `.${subpath}` : '.', mode, types)
			if (!validTarget(target)) return
			const path = join(pkg.dir, target)
			return isFile(path) ? path : buildSource(pkg, target)
		}
		if (specifier.startsWith('.')) {
			const path = resolve(dirname(from), specifier)
			if (isFile(path) && !types) return path
			const stem = path.replace(/\.[cm]?js$/, '')
			const extensions = path.endsWith('.mjs')
				? ['.mts', '.d.mts']
				: path.endsWith('.cjs')
					? ['.cts', '.d.cts']
					: ['.ts', '.d.ts', '.tsx']
			return [...extensions.map((ext) => stem + ext), path, join(path, 'index.js')].find(isFile)
		}
		if (types) return ts.resolveModuleName(specifier, from, options, ts.sys).resolvedModule?.resolvedFileName
		try {
			return createRequire(from).resolve(specifier)
		} catch {
			return undefined
		}
	}

	function hasExport(path, ref, seen = new Set()) {
		const binding = JSON.stringify([path, ref.name])
		if (seen.has(binding)) return false
		seen.add(binding)
		const info = inspect(path)
		const namedForward = info.references.find((forward) => forward.exported === ref.name)
		if (namedForward) {
			const target = resolveImport(path, namedForward)
			// Source preflight can run before third-party dependencies have been
			// linked. Their explicit named re-exports are checked again by smoke.
			if (
				!target &&
				sourceEntry &&
				!namedForward.specifier.startsWith('.') &&
				!namedForward.specifier.startsWith('@tevm/')
			) {
				return ref.types || !namedForward.types
			}
			return (
				target && (ref.types || !namedForward.types) && hasExport(target, { ...ref, name: namedForward.name }, seen)
			)
		}
		if (info.exports.has(ref.name) && (ref.types || info.exports.get(ref.name))) return true
		// ESM import of a CommonJS module always exposes module.exports as its default.
		if (ref.name === 'default') return !ref.types && ref.mode === 'import' && info.commonJS
		return info.references.some((forward) => {
			if (!forward.star || (forward.types && !ref.types)) return false
			const target = resolveImport(path, forward)
			return target && hasExport(target, ref, new Set(seen))
		})
	}

	for (const path of paths) {
		const seen = new Set()
		for (const ref of inspect(path).references) {
			if (!ref.specifier.startsWith('@tevm/')) continue
			// Source preflight checks runtime bindings for package roots with a source entry.
			if (sourceEntry && (ref.types || !ref.name || !byName.has(ref.specifier))) continue
			const target = resolveImport(path, ref)
			const problem = !target
				? 'cannot resolve workspace export'
				: ref.name && !hasExport(target, ref)
					? `missing export ${JSON.stringify(ref.name)}`
					: undefined
			if (!problem) continue
			const message = `${ref.mode}${ref.types ? ' types' : ''} ${ref.specifier}: ${problem}`
			if (seen.has(message)) continue
			seen.add(message)
			findings.push({ path, message, name: ref.name, specifier: ref.specifier })
		}
	}
	return findings
}

export function verifyStatic(root, packages = workspacePackages(root)) {
	const findings = []
	const packagesByDir = new Map(packages.map((pkg) => [pkg.dir, pkg]))
	const built = new Set()
	for (const pkg of packages) {
		const paths = [...filesIn(pkg.dir, packagesByDir)]
		findings.push(
			...paths.filter((path) => path.endsWith('.tgz')).map((path) => `${relative(root, path)}: stray tarball`),
		)
		const dist = join(pkg.dir, 'dist', '/')
		for (const path of paths) if (path.startsWith(dist) && emitted.test(path)) built.add(path)

		findings.push(
			...(isPublishable(root, pkg) ? entryProblems : exportProblems)(
				pkg,
				(target) =>
					hasExportFile(pkg.dir, target) || buildSource(pkg, target) || isWasiBuildOutput(pkg, target, packagesByDir),
			),
		)
		// The tevm facade emits beside its source. Check its runtime files too.
		if (pkg.manifest.name === 'tevm') {
			for (const [, value] of exportEntries(pkg.manifest.exports)) {
				for (const { target } of exportLeaves(value)) {
					if (!validTarget(target) || !/\.[cm]?js$/.test(target)) continue
					const path = join(pkg.dir, target)
					if (isFile(path)) built.add(path)
				}
			}
		}
	}
	findings.push(...inspectModules(packages, built).map(({ path, message }) => `${relative(root, path)}: ${message}`))

	const common = packages.find(({ manifest }) => manifest.name === '@tevm/common')
	let commonEntry
	let viemVersion
	try {
		if (!common) throw new Error('@tevm/common is missing from the workspace')
		const target = manifestTarget(common.manifest, '.', 'import', false)
		if (!validTarget(target)) throw new Error('missing ESM export')
		const builtEntry = isFile(join(common.dir, target))
		const source = buildSource(common, target)
		commonEntry = builtEntry ? join(common.dir, target) : source
		if (!commonEntry) throw new Error(`missing ESM entry ${target}`)
		viemVersion = createRequire(join(common.dir, 'package.json'))('viem/package.json').version
		const specifiers = builtEntry ? ['@tevm/common'] : []
		if (source) specifiers.push(pathToFileURL(source).href)
		for (const specifier of specifiers) {
			run(
				process.execPath,
				['--input-type=module', '--eval', `await import(${JSON.stringify(specifier)})`],
				common.dir,
				`ESM import ${specifier}`,
			)
		}
	} catch (error) {
		findings.push(`@tevm/common against installed viem${viemVersion ? ` ${viemVersion}` : ''}: ${error.message}`)
	}
	return { findings, builtCount: built.size, commonEntry: commonEntry && relative(root, commonEntry), viemVersion }
}

const dependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies']
const zevmName = '@evmts/zevm'

function packPackage(pkg, scratch) {
	const label = `pack ${pkg.manifest.name}`
	const archive = join(scratch, `${pkg.manifest.name.replace(/^@/, '').replace('/', '-')}.tgz`)
	const result = JSON.parse(run('pnpm', ['pack', '--json', '--out', archive], pkg.dir, label))
	const manifest = JSON.parse(run('tar', ['-xOzf', archive, 'package/package.json'], scratch, `${label} manifest`))
	const files = result.files.map(({ path }) => path)
	const problems = entryProblems({ manifest }, (target) => {
		if (!target.includes('*')) return files.includes(target.slice(2))
		const pattern = new RegExp(`^${target.slice(2).split('*').map(RegExp.escape).join('.*')}$`)
		return files.some((path) => pattern.test(path))
	})
	if (manifest.name === zevmName && !files.includes('native/zevm.node')) {
		problems.push(`${zevmName}: build native/zevm.node before --pack`)
	}
	for (const field of [...dependencyFields, 'devDependencies']) {
		for (const [name, version] of Object.entries(manifest[field] ?? {})) {
			if (version.includes('workspace:'))
				problems.push(`${manifest.name} ${field}.${name}: packed workspace protocol ${version}`)
		}
	}
	if (problems.length) throw new Error(problems.join('\n'))
	return { archive, manifest }
}

export function verifyPack(root, packages = workspacePackages(root), tempRoot = tmpdir()) {
	const publishable = packages.filter((pkg) => isPublishable(root, pkg))
	const missing = publishable.flatMap((pkg) => entryProblems(pkg, (target) => hasExportFile(pkg.dir, target)))
	if (missing.length) throw new Error(`Build runtime and type outputs before --pack:\n${missing.join('\n')}`)

	const scratch = mkdtempSync(join(tempRoot, 'tevm-publish-smoke-'))
	try {
		const archives = new Map(publishable.map((pkg) => [pkg.manifest.name, packPackage(pkg, scratch)]))
		if (!archives.has('tevm')) throw new Error('The publishable tevm facade is missing')
		const dependencies = {}
		const pending = ['tevm']
		for (const name of pending) {
			if (Object.hasOwn(dependencies, name)) continue
			if (name === zevmName && !archives.has(name)) {
				const dir = resolve(root, '../zevm/npm/zevm')
				const native =
					packages.find(({ manifest }) => manifest.name === zevmName) ??
					(isFile(join(dir, 'package.json')) ? { dir, manifest: readJson(join(dir, 'package.json')) } : undefined)
				if (native) archives.set(name, packPackage(native, scratch))
			}
			const pkg = archives.get(name)
			if (!pkg) throw new Error(`The tevm consumer needs a local tarball for ${name}`)
			dependencies[name] = `file:./${relative(scratch, pkg.archive)}`
			for (const field of dependencyFields) {
				for (const dependency of Object.keys(pkg.manifest[field] ?? {})) {
					if (archives.has(dependency) || dependency === zevmName) pending.push(dependency)
				}
			}
		}
		const overrides = Object.fromEntries(Object.keys(dependencies).map((name) => [name, `$${name}`]))
		writeFileSync(
			join(scratch, 'package.json'),
			JSON.stringify({
				name: 'tevm-publish-smoke-consumer',
				version: '0.0.0',
				private: true,
				type: 'module',
				dependencies,
				overrides,
			}),
		)
		run(
			'npm',
			['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', join(scratch, 'npm-cache')],
			scratch,
			'install isolated consumer',
		)

		const runtime = `
const client = createMemoryClient();
try {
	const block = await client.getBlockNumber();
	assert.equal(typeof block, 'bigint');
} finally {
	if (typeof client.close === 'function') await client.close();
	else await client.tevmClose?.();
}`
		writeFileSync(
			join(scratch, 'smoke.mjs'),
			`import assert from 'node:assert/strict';\nimport '@tevm/common';\nimport { createMemoryClient } from 'tevm';\n${runtime}`,
		)
		writeFileSync(
			join(scratch, 'smoke.cjs'),
			`const assert = require('node:assert/strict');\nrequire('@tevm/common');\nconst { createMemoryClient } = require('tevm');\n(async () => {${runtime}\n})().catch(error => { console.error(error); process.exitCode = 1; });\n`,
		)
		run(process.execPath, ['smoke.mjs'], scratch, 'packed ESM runtime smoke')
		run(process.execPath, ['smoke.cjs'], scratch, 'packed CJS runtime smoke')

		const typeSmoke = `const block = createMemoryClient().getBlockNumber();
const _number: Promise<bigint> = block;
type IsAny<T> = 0 extends (1 & T) ? true : false;
const _typed: IsAny<Awaited<typeof block>> = false;
`
		writeFileSync(join(scratch, 'smoke.mts'), `import { createMemoryClient } from 'tevm';\n${typeSmoke}`)
		writeFileSync(
			join(scratch, 'smoke.cts'),
			`import tevm = require('tevm');\nconst { createMemoryClient } = tevm;\n${typeSmoke}`,
		)
		run(
			process.execPath,
			[
				createRequire(import.meta.url).resolve('typescript/bin/tsc'),
				'--ignoreConfig',
				'--noEmit',
				'--strict',
				'--skipLibCheck',
				'--module',
				'nodenext',
				'--target',
				'es2022',
				'smoke.mts',
				'smoke.cts',
			],
			scratch,
			'packed ESM and CJS type resolution',
		)
		return archives.size
	} finally {
		rmSync(scratch, { recursive: true, force: true })
	}
}

function main([mode, ...rest]) {
	if (!['--static', '--pack'].includes(mode) || rest.length)
		throw new Error('Usage: node scripts/factory/verify-publish-smoke.mjs --static|--pack')
	const packages = workspacePackages(repositoryRoot)
	const result = verifyStatic(repositoryRoot, packages)
	if (result.findings.length) throw new Error(result.findings.join('\n'))
	console.log(
		`publish smoke static passed (${packages.length} packages, ${result.builtCount} emitted files, ${result.commonEntry} with viem ${result.viemVersion})`,
	)
	if (mode === '--pack') {
		const count = verifyPack(repositoryRoot, packages)
		console.log(`publish smoke pack passed (${count} tarballs, ESM and CJS types and getBlockNumber)`)
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
		main(process.argv.slice(2))
	} catch (error) {
		console.error(`publish smoke failed:\n${error.message}`)
		process.exitCode = 1
	}
}
