// Shared setup for the four Lean differential suites: where the repository and its sibling
// Voltaire checkout live, and how a suite builds its compiled Lean oracle.
//
// Nothing here names a machine. Paths derive from this file's location and from
// environment variables:
//
//   VOLTAIRE_DIR      Voltaire checkout. Default: `../voltaire` beside this repository.
//   LEAN_SKIP_BUILD   `1` skips `lake build` and trusts the oracle already on disk.
//   ELAN_HOME         elan installation. Default: `~/.elan`. Used only when `lake` is not
//                     already on PATH.

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'

/** The TEVM repository root. */
export const REPO_ROOT = resolve(import.meta.dirname, '../..')

/** The sibling Voltaire checkout. */
export const VOLTAIRE_DIR = resolve(process.env.VOLTAIRE_DIR ?? join(REPO_ROOT, '../voltaire'))

/** Voltaire's TypeScript package inside the checkout. */
export const VOLTAIRE_TS = join(VOLTAIRE_DIR, 'packages/voltaire-ts')

/**
 * Build one Lean oracle and return the path of its executable.
 *
 * `lake build` always runs. It is incremental: with unchanged sources it only checks
 * traces, and after an edit to a `.lean` file it rebuilds, so a suite never compares the
 * implementation with a stale oracle. `LEAN_SKIP_BUILD=1` is the only way to skip it.
 * @param {string} specDir Directory that holds the suite's `lakefile.toml`.
 * @param {string} executable The `lean_exe` name in that lakefile.
 * @returns {string}
 */
export const buildOracle = (specDir, executable) => {
	const binary = join(specDir, '.lake/build/bin', executable)
	if (process.env.LEAN_SKIP_BUILD === '1') {
		assert.ok(existsSync(binary), `LEAN_SKIP_BUILD=1 but ${binary} does not exist; run \`lake build\` in ${specDir}`)
		return binary
	}
	// PATH wins. elan's default install directory is the fallback, so a fresh shell works.
	const elanBin = join(process.env.ELAN_HOME ?? join(homedir(), '.elan'), 'bin')
	const env = { ...process.env, PATH: [process.env.PATH, elanBin].filter(Boolean).join(delimiter) }
	const build = spawnSync('lake', ['build'], { cwd: specDir, env, encoding: 'utf8' })
	assert.ok(
		!build.error,
		`cannot run \`lake\` (${build.error?.message}); install elan or put the Lean toolchain on PATH`,
	)
	assert.equal(build.status, 0, `lake build failed in ${specDir}:\n${build.stdout}\n${build.stderr}`)
	assert.ok(existsSync(binary), `lake build did not produce ${binary}`)
	return binary
}
