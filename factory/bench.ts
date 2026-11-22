import { scopedShell } from './scoped-shell.js'

const S = Smithers

type BuildAttrs = Parameters<typeof S.Shell.Build>[0]

const vitestBenchRunner = S.file('//scripts/bench/run-vitest-bench.mjs')
const vitestBenchConfig = S.file('//configs/vitest.bench.config.ts')
const cargoBenchRunner = S.file('//scripts/bench/run-cargo-bench.mjs')

const rootPrefix = (directory: string): string =>
	directory
		.split('/')
		.filter(Boolean)
		.map(() => '..')
		.join('/')

/**
 * Declares an incremental, content-cached Vitest benchmark target for a
 * package. Captures `artifacts/bench.json` so downstream report targets can
 * combine cached and freshly re-run package benchmarks without re-executing
 * unaffected packages.
 */
export const vitestBench = (
	directory: string,
	options: {
		readonly data: NonNullable<BuildAttrs['data']>
		readonly sandbox?: BuildAttrs['sandbox']
		readonly env?: BuildAttrs['env']
	},
) => {
	const Shell = scopedShell(directory)
	const prefix = rootPrefix(directory)
	return Shell.Build({
		bin: S.Runtime.bin,
		args: [`${prefix}/scripts/bench/run-vitest-bench.mjs`],
		data: [...options.data, vitestBenchRunner, vitestBenchConfig],
		outFiles: ['artifacts/bench.json'],
		...(options.sandbox === undefined ? {} : { sandbox: options.sandbox }),
		...(options.env === undefined ? {} : { env: options.env }),
	})
}

/**
 * Declares an incremental, content-cached Cargo release benchmark target for a
 * Rust crate emitting `artifacts/bench.json`.
 */
export const cargoBench = (
	directory: string,
	options: {
		readonly cargoPackage: string
		readonly example?: string
		readonly data: NonNullable<BuildAttrs['data']>
	},
) => {
	const Shell = scopedShell(directory)
	const prefix = rootPrefix(directory)
	return Shell.Build({
		bin: S.Runtime.bin,
		args: [`${prefix}/scripts/bench/run-cargo-bench.mjs`, options.cargoPackage, options.example ?? 'bench_json'],
		data: [...options.data, cargoBenchRunner, S.file('//Cargo.toml'), S.file('//Cargo.lock')],
		outFiles: ['artifacts/bench.json'],
	})
}
