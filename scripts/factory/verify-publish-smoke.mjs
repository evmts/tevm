#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { globSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { repositoryRoot } from './lib.mjs'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const isFile = (path) => statSync(path, { throwIfNoEntry: false })?.isFile()
const isTevm = (name) => name === 'tevm' || name.startsWith('@tevm/')
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
		.filter(({ path }) => relative(root, path) !== '')
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
			const content = readFileSync(join(dir, config), 'utf8')
			const entry = /\bentry\s*:\s*\[([^\]]*)\]/.exec(content)
			const entries = entry ? [...entry[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]) : ['src/index.js']
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

const hasExportFile = (dir, target) =>
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

function inspectModules(packages, paths) {
	const findings = []
	const modules = new Map()
	const byName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]))
	const options = { allowJs: true, module: ts.ModuleKind.NodeNext, noLib: true, noResolve: true, types: [] }
	const text = (node) => (node && (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) ? node.text : undefined)

	function inspect(path) {
		if (modules.has(path)) return modules.get(path)
		const program = ts.createProgram([path], options)
		const source = program.getSourceFile(path)
		const checker = program.getTypeChecker()
		const symbol = source && checker.getSymbolAtLocation(source)
		const exports = symbol ? checker.getExportsOfModule(symbol) : []
		const references = []
		const info = { exports, references }
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
			const target = manifestTarget(pkg.manifest, subpath ? `.${subpath}` : '.', mode, types)
			if (!validTarget(target)) return
			const path = join(pkg.dir, target)
			return isFile(path) ? path : buildSource(pkg, target)
		}
		if (specifier.startsWith('.')) {
			const path = resolve(dirname(from), specifier)
			if (isFile(path) && !types) return path
			const stem = path.replace(/\.[cm]?js$/, '')
			return [`${stem}.ts`, `${stem}.d.ts`, `${stem}.tsx`, path, join(path, 'index.js')].find(isFile)
		}
		if (types) return ts.resolveModuleName(specifier, from, options, ts.sys).resolvedModule?.resolvedFileName
		try {
			return createRequire(from).resolve(specifier)
		} catch {
			return undefined
		}
	}

	function hasExport(path, ref, seen = new Set()) {
		if (seen.has(path)) return false
		seen.add(path)
		const info = inspect(path)
		const namedForward = info.references.find((forward) => forward.exported === ref.name)
		if (namedForward) {
			const target = resolveImport(path, namedForward)
			return (
				target && (ref.types || !namedForward.types) && hasExport(target, { ...ref, name: namedForward.name }, seen)
			)
		}
		if (
			info.exports.some(
				(symbol) =>
					symbol.name === ref.name &&
					(ref.types ||
						(symbol.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Alias) &&
							!symbol.declarations?.every(ts.isTypeOnlyImportOrExportDeclaration))),
			)
		)
			return true
		if (ref.name === 'default') return false
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
			findings.push({ path, message })
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
			...exportProblems(
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
	const problems = exportProblems({ manifest }, (target) => {
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
	const publishable = packages.filter(({ manifest }) => !manifest.private && isTevm(manifest.name))
	const missing = publishable.flatMap((pkg) => exportProblems(pkg, (target) => hasExportFile(pkg.dir, target)))
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
					if (isTevm(dependency) || dependency === zevmName) pending.push(dependency)
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
