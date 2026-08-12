import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as viemChains from 'viem/chains'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

/** `tevmDefault` is ours rather than a viem chain, so it is hand-written and excluded here. */
const TEVM_ONLY = new Set(['tevmDefault'])

/**
 * Deliberately static: the preset files are read as text and never imported.
 *
 * Importing them would pull in `createCommon` and its native `@evmts/zevm` dependency, so this guard
 * would then depend on a Zig build to tell you whether an import statement names a chain that exists.
 * Reading the import line answers that directly, in milliseconds, anywhere.
 */
const presetFiles = readdirSync(here)
	.filter((file) => file.endsWith('.js') && !file.startsWith('__'))
	.map((file) => file.replace(/\.js$/, ''))

/** The chain each preset imports from `viem/chains`, from its own import statement. */
const importedChainOf = (preset: string): string | undefined =>
	/import \{\s*(\w+) as _\w+\s*\} from 'viem\/chains'/.exec(readFileSync(join(here, `${preset}.js`), 'utf8'))?.[1]

const viemChainNames = new Set(
	Object.entries(viemChains)
		.filter(([, chain]) => typeof chain === 'object' && chain !== null && 'id' in chain)
		.map(([name]) => name),
)

describe('chain presets', () => {
	/**
	 * The guard for #2097.
	 *
	 * Every generated preset does `import { <chain> } from 'viem/chains'` — a *named* import — so a chain
	 * viem retires becomes an uncatchable `SyntaxError` at ESM link time for everyone importing
	 * `@tevm/common`, whether or not they use that chain:
	 *
	 *     SyntaxError: The requested module 'viem/chains' does not provide an export named 'ekta'
	 *
	 * That shipped. `@tevm/common@1.0.0-next.148` kept presets for `ekta`, `ektaTestnet`, `seiDevnet` and
	 * `zircuitTestnet` after viem removed them, so the published package could not be imported on any
	 * viem at or above 2.46.1 — and `viem` is a peer dependency, so a consumer cannot pin around it.
	 *
	 * `main` has since dropped those four, but nothing stops the next viem release doing it again: the
	 * preset list is hand-maintained in `__GENERATE_CHAIN_PRESETS__.js`. This turns a break that reached
	 * users after publish into a failing test on the viem bump that causes it.
	 *
	 * When it fails: delete the named presets and re-run `__GENERATE_CHAIN_PRESETS__.js`.
	 */
	it('does not import a chain viem no longer exports', () => {
		const orphaned = presetFiles
			.filter((preset) => !TEVM_ONLY.has(preset))
			.map((preset) => ({ preset, chain: importedChainOf(preset) }))
			.filter(({ chain }) => chain !== undefined && !viemChainNames.has(chain))
			.map(({ preset, chain }) => `${preset}.js imports '${chain}'`)

		expect(orphaned).toEqual([])
	})

	it('imports the chain matching its own filename', () => {
		// A preset named after one chain but spreading another would produce a `Common` that silently
		// describes the wrong network, which no type would catch.
		const mismatched = presetFiles
			.filter((preset) => !TEVM_ONLY.has(preset))
			.map((preset) => ({ preset, chain: importedChainOf(preset) }))
			.filter(({ preset, chain }) => chain !== preset)
			.map(({ preset, chain }) => `${preset}.js imports '${chain}'`)

		expect(mismatched).toEqual([])
	})

	it('exports every generated preset from index.ts, and nothing that has no file', () => {
		const index = readFileSync(join(here, 'index.ts'), 'utf8')
		const exported = [...index.matchAll(/export \{ (\w+) \} from '\.\/(\w+)\.js'/g)].map((match) => match[1])

		expect([...exported].sort()).toEqual([...presetFiles].sort())
	})
})
