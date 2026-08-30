#!/usr/bin/env node
// Materializes the pinned upstream conformance corpora declared in
// factory/policy.json `corpus` under //.cache/conformance-corpus:
// - ethereum/tests GeneralStateTests at a pinned revision (sparse, shallow)
// - execution-spec-tests release fixtures at a pinned sha256
// Idempotent: a stamp named by the pins skips all network work, so the
// //test:conformanceCorpus target is cheap once the corpus exists. The
// corpus stays outside every Filegroup glob; the runners default to these
// paths and TEVM_*_FIXTURES env vars still override them.
import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, readPolicy, repositoryRoot } from './lib.mjs'

const policy = await readPolicy()
const pins = policy.corpus
if (!pins) throw new Error('factory/policy.json has no corpus section')

const corpusRoot = resolve(repositoryRoot, '.cache/conformance-corpus')
const stamp = resolve(
	corpusRoot,
	`.stamp-${createHash('sha256').update(JSON.stringify(pins)).digest('hex').slice(0, 16)}`,
)
if (existsSync(stamp)) {
	console.log(`conformance corpus ok (stamp ${stamp})`)
	process.exit(0)
}
await mkdir(corpusRoot, { recursive: true })

const sha256File = (path) =>
	new Promise((resolvePromise, rejectPromise) => {
		const hash = createHash('sha256')
		createReadStream(path)
			.on('data', (chunk) => hash.update(chunk))
			.on('end', () => resolvePromise(hash.digest('hex')))
			.on('error', rejectPromise)
	})

// Each corpus is a pinned tarball verified by sha256, then extracted.
const materialize = async (name, pin) => {
	const final = resolve(corpusRoot, name)
	if (existsSync(resolve(final, pin.extractPath))) return final
	const tarball = resolve(corpusRoot, `${name}.tar.gz`)
	if (!existsSync(tarball) || (await sha256File(tarball)) !== pin.sha256) {
		console.log(`downloading ${pin.url}`)
		command('curl', ['-fsSL', '--retry', '3', '-o', tarball, pin.url])
	}
	const digest = await sha256File(tarball)
	if (digest !== pin.sha256) {
		await rm(tarball, { force: true })
		throw new Error(`${pin.url} sha256 ${digest}, policy pins ${pin.sha256}`)
	}
	const work = `${final}.tmp`
	await rm(work, { recursive: true, force: true })
	await mkdir(work, { recursive: true })
	command('tar', ['-xzf', tarball, '-C', work, pin.extractPath])
	await rm(final, { recursive: true, force: true })
	await rename(work, final)
	await rm(tarball, { force: true })
	return final
}

const gstFinal = await materialize('ethereum-tests', pins.ethereumTests)
const estFinal = await materialize('execution-spec-tests', pins.executionSpecTests)

await writeFile(stamp, `${new Date().toISOString()}\n`)
console.log(
	`conformance corpus ok: ${resolve(gstFinal, pins.ethereumTests.extractPath)} and ${resolve(estFinal, pins.executionSpecTests.extractPath)}`,
)
