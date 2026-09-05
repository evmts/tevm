import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

test('scope lint checks the candidate tree including additions and deletions', () => {
	const directory = mkdtempSync(join(tmpdir(), 'tevm-scope-'))
	try {
		execFileSync('git', ['init', '-q', directory])
		mkdirSync(join(directory, 'old'))
		writeFileSync(join(directory, 'old/PACKAGE.ts'), 'S.Shell.Test({})')
		execFileSync('git', ['-C', directory, 'add', 'old/PACKAGE.ts'])
		unlinkSync(join(directory, 'old/PACKAGE.ts'))
		mkdirSync(join(directory, 'new'))
		writeFileSync(join(directory, 'new/PACKAGE.ts'), 'S.Shell.Test({})')
		const run = () =>
			spawnSync(process.execPath, [fileURLToPath(new URL('./scope-declarations.mjs', import.meta.url))], {
				cwd: directory,
				encoding: 'utf8',
			})
		const failing = run()
		assert.equal(failing.status, 1)
		assert.match(failing.stderr, /new\/PACKAGE.ts/)
		assert.doesNotMatch(failing.stderr, /ENOENT|old\/PACKAGE.ts/)
		writeFileSync(join(directory, 'new/PACKAGE.ts'), 'scopedShell("new").Test({})')
		const passing = run()
		assert.equal(passing.status, 0, passing.stderr)
		assert.match(passing.stdout, /scoping ok/)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})
