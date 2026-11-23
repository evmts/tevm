import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { validateCrossPackageSymbols } from '../prepare-changeset-publish.mjs'
import { property, sandbox, write } from '../test-support/publish-fuzz.mjs'
import { verifyStatic } from './verify-publish-smoke.mjs'

function graph({ int, pick }) {
	const width = 1 + int(5)
	const names = Array.from({ length: width }, (_, i) => `symbol_${i}_${int(10000)}`)
	return {
		names,
		drop: int(width),
		depth: int(4),
		cjs: !!int(2),
		forward: pick(['star', 'remote alias', 'local alias', 'default', 'default declaration', 'local declaration']),
		diamond: !!int(2),
		consumer: int(3),
	}
}

function commonFixture(root) {
	const dir = join(root, 'common')
	const manifest = { name: '@tevm/common', type: 'module', exports: './dist/index.js' }
	write(join(dir, 'package.json'), JSON.stringify(manifest))
	write(join(dir, 'dist/index.js'), 'export {}')
	write(join(dir, 'node_modules/viem/package.json'), '{"version":"1.0.0"}')
	return { dir, manifest, pkg: manifest, relDir: 'common' }
}

function checkGraphs(cases) {
	sandbox((root) => {
		const packages = [commonFixture(root)]
		function pkg(dir, name, ext) {
			const manifest = { name, version: '1.0.0', type: 'module', exports: `./dist/index.${ext}` }
			write(join(root, dir, 'package.json'), JSON.stringify(manifest))
			packages.push({ dir: join(root, dir), relDir: dir, manifest, pkg: manifest })
		}
		const edits = []
		const expectedSmoke = []
		const expectedPrepare = []
		for (const [id, { names, drop, depth, cjs, forward, diamond, consumer }] of cases.entries()) {
			const ext = cjs ? 'cjs' : 'js'
			const provider = `provider-${id}`
			const name = `@tevm/${provider}`
			const client = `client-${id}`
			pkg(provider, name, ext)
			pkg(client, `@tevm/${client}`, ext)
			// All fixtures use both layouts. The prepare guard reads source and
			// the static smoke guard reads exactly what will be shipped in dist.
			function module(dir, file, body) {
				for (const tree of ['src', 'dist']) write(join(root, dir, tree, `${file}.${ext}`), body)
			}
			const noise = `// import { ghost } from '${name}'\nconst text = "export const ${names[drop]} = 42; import { ghost } from '${name}'";\n`
			const directDefault = !cjs && forward === 'default declaration'
			const declarations = names.map((n, i) => {
				if (cjs) return `exports.${n} = 1;`
				if (forward === 'local declaration') return `const internal_${n} = 1;`
				return directDefault && i === drop ? 'export default 1;' : `export const ${n} = 1;`
			})
			const exports =
				!cjs && forward === 'local declaration'
					? `\nexport { ${names.map((n) => `internal_${n} as ${n}`).join(', ')} };`
					: ''
			module(provider, 'leaf', noise + declarations.join('\n') + exports)
			edits.push(() => module(provider, 'leaf', noise + declarations.filter((_, i) => i !== drop).join('\n') + exports))
			let previous = 'leaf'
			for (let i = 0; i < depth; i++) {
				const target = `./${previous}.${ext}`
				const star = `export * from '${target}';`
				const lines = [star]
				if (directDefault) lines.push(`export { default } from '${target}';`)
				if (diamond && !cjs) {
					module(provider, `branch${i}`, `${star} export * from './barrel${i}.${ext}';`)
					lines.push(`export * from './branch${i}.${ext}';`)
				}
				module(provider, `barrel${i}`, cjs ? `module.exports = require('${target}');` : lines.join('\n'))
				previous = `barrel${i}`
			}
			const target = `./${previous}.${ext}`
			let visible = names
			let entry
			if (cjs) entry = `module.exports = require('${target}');`
			else if (directDefault) {
				visible = names.map((n, i) => (i === drop ? 'default' : n))
				entry = `export * from '${target}'; export { default } from '${target}';`
			} else if (forward === 'star') entry = `export * from '${target}';`
			else {
				visible = names.map((n, i) => (forward === 'default' && i === drop ? 'default' : `public_${n}`))
				const aliases = names.map((n, i) => `${n} as ${visible[i]}`).join(',\n')
				entry =
					forward === 'local alias'
						? `import { ${names.join(',\n')} } from '${target}';\nexport { ${aliases} };`
						: `export /* from the barrel */ { ${aliases} } from '${target}';`
			}
			module(provider, 'index', entry)
			const uses = visible.map((n, i) => {
				if (cjs) {
					if (consumer === 0) return `const { ${n}: local${i} } = require('${name}');`
					return consumer === 1 ? `ns.${n};` : `ns['${n}'];`
				}
				if (consumer === 1) return `ns.${n};`
				if (consumer === 2) return `export { ${n} as local${i} } from '${name}';`
				return n === 'default'
					? `import local${i} from '${name}';`
					: `import /* kept */ {\n ${n} as local${i},\n} from '${name}';`
			})
			const namespace = cjs ? `const ns = require('${name}');` : `import * as ns from '${name}';`
			module(client, 'index', [noise, namespace, ...uses].join('\n'))
			expectedSmoke.push(
				`${client}/dist/index.${ext}: ${cjs ? 'require' : 'import'} ${name}: missing export "${visible[drop]}"`,
			)
			expectedPrepare.push(
				`@tevm/${client} (${client}/src/index.${ext}): imports "${visible[drop]}" from "${name}", which does not export it`,
			)
		}
		assert.deepEqual(verifyStatic(root, packages).findings, [])
		assert.deepEqual(validateCrossPackageSymbols(packages), [])
		for (const edit of edits) edit()
		assert.deepEqual(verifyStatic(root, packages).findings.sort(), expectedSmoke.sort())
		assert.deepEqual(validateCrossPackageSymbols(packages).sort(), expectedPrepare.sort())
	})
}

property(
	'both release guards identify precisely the deleted public binding in ESM and CJS graphs',
	graph,
	checkGraphs,
	100,
)

test('an imported binding re-exported under a local alias tracks its missing leaf', () => {
	checkGraphs([{ names: ['gone'], drop: 0, depth: 0, cjs: false, forward: 'local alias', consumer: 0 }])
})

test('a quoted export cannot satisfy an import, even when a star barrel becomes empty', () => {
	checkGraphs([{ names: ['gone'], drop: 0, depth: 1, cjs: false, forward: 'star', consumer: 0 }])
})

test('a local export alias cannot survive deletion of its declaration', () => {
	checkGraphs([{ names: ['gone'], drop: 0, depth: 0, cjs: false, forward: 'local declaration', consumer: 0 }])
})

test('CommonJS destructuring follows module.exports through a relative barrel', () => {
	checkGraphs([{ names: ['gone'], drop: 0, depth: 0, cjs: true, forward: 'star', consumer: 0 }])
})

function artifactCase({ int, pick }) {
	const folder = Array.from({ length: 1 + int(3) }, () => pick(['nested', '.out', 'my_node_modules'])).join('/')
	return {
		folder,
		stem: `bundle${int(20)}`,
		built: !!int(2),
		configured: !!int(2),
		configNoise: pick(['//', 'string']),
		stray: !!int(2),
	}
}

function checkArtifacts(cases) {
	sandbox((root) => {
		const common = commonFixture(root)
		const packages = [common]
		const expected = []
		for (const [i, { folder, stem, built, configured, configNoise, stray }] of cases.entries()) {
			const dir = join(root, `p${i}`)
			const target = `./dist/${stem}.js`
			const manifest = { name: `@tevm/p${i}`, type: 'module', exports: { '.': { import: [target] } } }
			packages.push({ dir, manifest })
			write(join(dir, 'package.json'), JSON.stringify(manifest))
			write(join(dir, 'src', `${stem}.js`), 'export {}')
			const fake = `entry: ['src/${stem}.js']`
			const decoy = configNoise === '//' ? `// ${fake}` : `const example = "${fake}";`
			write(
				join(dir, 'tsup.config.ts'),
				`${decoy}\nexport default { entry: ['src/${configured ? stem : 'other'}.js'] }`,
			)
			if (built) write(join(dir, target), 'export {}')
			if (stray) {
				write(join(dir, folder, 'stale.tgz'), '')
				expected.push(`p${i}/${folder}/stale.tgz: stray tarball`)
			}
			write(join(dir, 'node_modules/ignored.tgz'), '')
			if (!built && !configured) expected.push(`${manifest.name} exports . (import): missing target ${target}`)
		}
		assert.deepEqual(verifyStatic(root, packages).findings.sort(), expected.sort())
	})
}
property(
	'static smoke reports only stray archives and outputs lacking a real build entry',
	artifactCase,
	checkArtifacts,
	100,
)

test('an entry in a config comment cannot stand in for a missing dist target', () => {
	checkArtifacts([{ folder: 'p', stem: 'missing', built: false, configured: false, configNoise: '//', stray: false }])
})

for (const extension of ['js', 'cjs'])
	test(`ESM default and dropped named imports from a CommonJS .${extension} file`, () => {
		sandbox((root) => {
			const packages = [commonFixture(root)]
			for (const [dir, ext] of [
				['provider', extension],
				['client', 'mjs'],
			]) {
				const manifest = {
					name: `@tevm/${dir}`,
					type: dir === 'provider' ? 'commonjs' : 'module',
					exports: `./dist/index.${ext}`,
				}
				write(join(root, dir, 'package.json'), JSON.stringify(manifest))
				packages.push({ dir: join(root, dir), relDir: dir, manifest, pkg: manifest })
			}
			for (const tree of ['dist', 'src']) {
				write(join(root, 'client', tree, 'index.mjs'), "import lib, { removed } from '@tevm/provider';")
				write(join(root, 'provider', tree, `index.${extension}`), 'exports.removed = 1;')
			}
			assert.deepEqual(verifyStatic(root, packages).findings, [])
			assert.deepEqual(validateCrossPackageSymbols(packages), [])
			for (const tree of ['dist', 'src'])
				write(join(root, 'provider', tree, `index.${extension}`), 'module.exports = {};')
			assert.deepEqual(verifyStatic(root, packages).findings, [
				'client/dist/index.mjs: import @tevm/provider: missing export "removed"',
			])
			assert.deepEqual(validateCrossPackageSymbols(packages), [
				'@tevm/client (client/src/index.mjs): imports "removed" from "@tevm/provider", which does not export it',
			])
		})
	})

test('a cyclic alias chain can revisit a barrel under another name in .mts source and .mjs output', () => {
	sandbox((root) => {
		const packages = [commonFixture(root)]
		for (const dir of ['lib', 'app']) {
			const manifest = { name: `@tevm/${dir}`, type: 'module', exports: './dist/index.mjs' }
			write(join(root, dir, 'package.json'), JSON.stringify(manifest))
			packages.push({ dir: join(root, dir), relDir: dir, manifest, pkg: manifest })
		}
		const barrel = "export { value as publicName } from './alias.mjs';"
		for (const [tree, ext] of [
			['dist', 'mjs'],
			['src', 'mts'],
		]) {
			write(join(root, 'lib', tree, `index.${ext}`), `${barrel}\nexport const original = 1;`)
			write(join(root, 'lib', tree, `alias.${ext}`), "export { original as value } from './index.mjs';")
			write(join(root, 'app', tree, `index.${ext}`), "import { publicName } from '@tevm/lib';")
		}
		assert.deepEqual(verifyStatic(root, packages).findings, [])
		assert.deepEqual(validateCrossPackageSymbols(packages), [])
		write(join(root, 'lib', 'dist/index.mjs'), barrel)
		write(join(root, 'lib', 'src/index.mts'), barrel)
		assert.deepEqual(verifyStatic(root, packages).findings, [
			'app/dist/index.mjs: import @tevm/lib: missing export "publicName"',
		])
		assert.deepEqual(validateCrossPackageSymbols(packages), [
			'@tevm/app (app/src/index.mts): imports "publicName" from "@tevm/lib", which does not export it',
		])
	})
})
