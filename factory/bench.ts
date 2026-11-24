const S = Smithers

type BuildAttrs = Parameters<typeof S.Shell.Build>[0]

const vitestBenchRunner = S.file('//scripts/bench/run-vitest-bench.mjs')
const vitestBenchConfig = S.file('//configs/vitest.bench.config.ts')

const validateDirectory = (directory: string): void => {
	if (!/^[A-Za-z0-9._/-]+$/.test(directory) || directory.startsWith('/') || directory.includes('..')) {
		throw new TypeError(`invalid package shell directory: ${directory}`)
	}
}

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
 *
 * Scopes execution via `S.PackageManager.bin --dir <directory> exec node ...`
 * inline (matching `factory/scoped-shell.ts`) so `factory/bench.ts` stays
 * self-contained without relative `.ts` helper imports across pinned Flows
 * loaders.
 */
export const vitestBench = (
	directory: string,
	options: {
		readonly data: NonNullable<BuildAttrs['data']>
		readonly sandbox?: BuildAttrs['sandbox']
		readonly env?: BuildAttrs['env']
	},
) => {
	validateDirectory(directory)
	const prefix = rootPrefix(directory)
	return S.Shell.Build({
		bin: S.PackageManager.bin,
		args: ['--dir', directory, 'exec', 'node', `${prefix}/scripts/bench/run-vitest-bench.mjs`],
		data: [...options.data, vitestBenchRunner, vitestBenchConfig],
		outFiles: ['artifacts/bench.json'],
		...(options.sandbox === undefined ? {} : { sandbox: options.sandbox }),
		...(options.env === undefined ? {} : { env: options.env }),
	})
}
