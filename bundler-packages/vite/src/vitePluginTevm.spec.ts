import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Rollup } from 'vite'
import { describe, expect, it } from 'vitest'
import { vitePluginTevm } from './index.js'

const fixtureDirectory = fileURLToPath(new URL('./fixtures', import.meta.url))

describe('vitePluginTevm', () => {
	it('compiles a real Solidity import into a Vite module', async () => {
		const result = await build({
			root: fixtureDirectory,
			logLevel: 'silent',
			plugins: [vitePluginTevm()],
			build: {
				write: false,
				rolldownOptions: {
					external: ['tevm/contract'],
				},
				lib: {
					entry: path.join(fixtureDirectory, 'entry.ts'),
					formats: ['es'],
				},
			},
		})
		const outputs = (Array.isArray(result) ? result : [result]) as Rollup.RollupOutput[]
		const code = outputs.flatMap((output) => output.output).find((item) => item.type === 'chunk')?.code
		expect(code).toContain('createContract')
		expect(code).toContain('increment')
		expect(code).toContain('number')
		expect(code).toMatch(/bytecode:\s*"0x[0-9a-f]+"/)
	}, 30_000)
})
