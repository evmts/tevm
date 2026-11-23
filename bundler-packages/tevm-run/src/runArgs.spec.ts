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

	it('logs exactly the command that run executes', async () => {
		const log = spyOn(console, 'log')
		try {
			await run(['./example/vanilla.ts'])
			expect(log).toHaveBeenCalledWith(`[tevm-run] bun ${runArgs('./example/vanilla.ts', []).join(' ')}`)
			expect(log.mock.calls.flat().join('\n')).not.toContain('--bun')
		} finally {
			log.mockRestore()
		}
	})
})
