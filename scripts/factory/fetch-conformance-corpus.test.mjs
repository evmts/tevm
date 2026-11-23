import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

test('a corpus pin change refreshes fixtures at the same extraction path', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'tevm-corpus-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))

	const scripts = join(root, 'scripts/factory')
	const corpus = join(root, '.cache/conformance-corpus')
	const staging = join(root, 'staging')
	for (const path of [scripts, corpus, join(root, 'factory')]) mkdirSync(path, { recursive: true })
	for (const file of ['fetch-conformance-corpus.mjs', 'lib.mjs']) {
		copyFileSync(new URL(file, import.meta.url), join(scripts, file))
	}

	const archive = (name, extractPath, version) => {
		mkdirSync(join(staging, extractPath), { recursive: true })
		writeFileSync(join(staging, extractPath, 'fixture.json'), JSON.stringify({ version }))
		const tarball = join(corpus, `${name}.tar.gz`)
		execFileSync('tar', ['-czf', tarball, '-C', staging, extractPath])
		return {
			url: `file://${tarball}`,
			sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
			extractPath,
		}
	}
	const fetchCorpus = (pins) => {
		writeFileSync(join(root, 'factory/policy.json'), JSON.stringify({ corpus: pins }))
		execFileSync(process.execPath, [join(scripts, 'fetch-conformance-corpus.mjs')])
	}

	const ethereumTests = archive('ethereum-tests', 'GeneralStateTests', 'unchanged')
	const executionPath = 'fixtures/state_tests'
	const fixture = join(corpus, 'execution-spec-tests', executionPath, 'fixture.json')
	const oldPin = archive('execution-spec-tests', executionPath, 'old')
	fetchCorpus({ ethereumTests, executionSpecTests: oldPin })
	assert.deepEqual(JSON.parse(readFileSync(fixture, 'utf8')), { version: 'old' })

	const newPin = archive('execution-spec-tests', executionPath, 'new')
	fetchCorpus({ ethereumTests, executionSpecTests: newPin })
	assert.deepEqual(JSON.parse(readFileSync(fixture, 'utf8')), { version: 'new' })
})
