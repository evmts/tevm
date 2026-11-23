import { describe, expect, it, spyOn } from 'bun:test'
import { configPath } from './configPath.js'
import { run } from './run.js'
import { runArgs } from './runArgs.js'

describe(runArgs.name, () => {
	it('builds the bun arguments once, without --bun', () => {
		expect(runArgs('./s.ts', ['a', 'b c'])).toEqual([
			'run',
			`--config=${configPath}`,
			'--install=fallback',
			'./s.ts',
			'a',
			'b c',
		])
	})

	it('logs only the script path when positional arguments are supplied', async () => {
		const log = spyOn(console, 'log')
		try {
			await run(['./example/vanilla.ts', 'private-positional'])
			expect(log.mock.calls).toEqual([['[tevm-run] ./example/vanilla.ts']])
		} finally {
			log.mockRestore()
		}
	})
})
