#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import { parseArgs } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const write = args.has('write')
const excluded = new Set(['PACKAGE.ts', 'factory/PACKAGE.ts', 'scripts/PACKAGE.ts', 'test/PACKAGE.ts'])
let output = ''
try {
	output = execFileSync('rg', ['-l', 'S\\.Shell\\.', '--glob', 'PACKAGE.ts', '--glob', '!node_modules/**', '.'], {
		encoding: 'utf8',
	})
} catch (error) {
	if (error?.status !== 1) throw error
}
const files = output
	.trim()
	.split('\n')
	.filter(Boolean)
	.map((file) => file.replace(/^\.\//, ''))
	.filter((file) => !excluded.has(file))

if (!write) {
	if (files.length > 0) {
		console.error(`${files.length} package declaration(s) bypass scopedShell:\n${files.join('\n')}`)
		process.exitCode = 1
	} else {
		console.log('package shell scoping ok')
	}
} else {
	for (const file of files) {
		let source = await readFile(file, 'utf8')
		if (source.includes('scopedShell')) throw new Error(`${file} mixes scoped and unscoped Shell calls`)
		const lines = source.split('\n')
		const smithers = lines.indexOf("import { Smithers as S } from '@smthrs/targets'")
		if (smithers < 0) throw new Error(`${file}: Smithers import not found`)
		let helper = relative(dirname(file), 'factory/scoped-shell.js')
		if (!helper.startsWith('.')) helper = `./${helper}`
		lines.splice(smithers + 1, 0, `import { scopedShell } from '${helper}'`)
		let lastImport = -1
		for (let index = 0; index < Math.min(lines.length, 30); index += 1) {
			if (lines[index].startsWith('import ')) lastImport = index
		}
		lines.splice(lastImport + 1, 0, '', `const Shell = scopedShell('${dirname(file)}')`)
		source = lines.join('\n').replaceAll('S.Shell.', 'Shell.')
		await writeFile(file, source)
	}
	console.log(`scoped ${files.length} PACKAGE.ts file(s)`)
}
