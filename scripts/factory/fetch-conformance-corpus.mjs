#!/usr/bin/env node
// Materializes the pinned upstream conformance corpora declared in
// factory/policy.json `corpus` under //.cache/conformance-corpus:
// - ethereum/tests GeneralStateTests and execution-specs release fixtures
// Idempotent: each extracted corpus carries a stamp for its pin, so the
// //test:conformanceCorpus target is cheap once the corpus exists. The
// corpus stays outside every Filegroup glob; the runners default to these
// paths and TEVM_*_FIXTURES env vars still override them.
import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, mkdtemp, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, readPolicy, repositoryRoot } from './lib.mjs'

const policy = await readPolicy()
const pins = policy.corpus
if (!pins) throw new Error('factory/policy.json has no corpus section')

const corpusRoot = resolve(repositoryRoot, '.cache/conformance-corpus')
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
	const digest = createHash('sha256').update(JSON.stringify(pin)).digest('hex')
	const stamp = `.stamp-${digest.slice(0, 16)}`
	const complete = (dir) => existsSync(resolve(dir, stamp)) && existsSync(resolve(dir, pin.extractPath))
	if (complete(final)) return final

	const version = `.${name}-${digest}`
	const destination = resolve(corpusRoot, version)
	const stage = await mkdtemp(resolve(corpusRoot, `.${name}-${process.pid}-`))
	try {
		if (!complete(destination)) {
			const tarball = resolve(stage, 'download.tar.gz')
			command('curl', ['-fsSL', '--retry', '3', '-o', tarball, pin.url])
			const actual = await sha256File(tarball)
			if (actual !== pin.sha256) throw new Error(`${pin.url} sha256 ${actual}, policy pins ${pin.sha256}`)
			const tree = resolve(stage, 'tree')
			await mkdir(tree)
			command('tar', ['-xzf', tarball, '-C', tree, pin.extractPath])
			await writeFile(resolve(tree, stamp), '')
			if (!complete(tree)) throw new Error(`Incomplete corpus at ${pin.extractPath}`)
			try {
				await rename(tree, destination)
			} catch (error) {
				// A concurrent fetch may have published the same verified version.
				if (!['ENOTEMPTY', 'EEXIST'].includes(error.code) || !complete(destination)) throw error
			}
		}
		const link = resolve(stage, 'current')
		await symlink(version, link)
		try {
			await rename(link, final)
		} catch (error) {
			// Older releases used a real directory. Migrate it once, retaining it
			// until the new pointer is installed. Later pin switches are atomic.
			if (!['EISDIR', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error
			const legacy = resolve(stage, 'legacy')
			try {
				await rename(final, legacy)
			} catch (moved) {
				if (moved.code !== 'ENOENT') throw moved
			}
			try {
				await rename(link, final)
			} catch (failed) {
				if (existsSync(legacy) && !existsSync(final)) await rename(legacy, final)
				throw failed
			}
		}
		return final
	} finally {
		await rm(stage, { recursive: true, force: true })
	}
}

const gstFinal = await materialize('ethereum-tests', pins.ethereumTests)
const estFinal = await materialize('execution-spec-tests', pins.executionSpecTests)

console.log(
	`conformance corpus ok: ${resolve(gstFinal, pins.ethereumTests.extractPath)} and ${resolve(estFinal, pins.executionSpecTests.extractPath)}`,
)
