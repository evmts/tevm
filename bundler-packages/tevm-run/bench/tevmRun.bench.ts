import { bench, describe } from 'vitest'
import { parseArgs } from '../src/parseArgs.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const sampleArgs = ['bun', 'tevm-run.js', './scripts/deploy.ts']

describe('tevm-run', () => {
	bench(
		'parseArgs (script + flags)',
		() => {
			const parsed = parseArgs(sampleArgs)
			if (parsed.positionals[0] !== './scripts/deploy.ts') throw new Error('unexpected')
		},
		benchOpts,
	)
})
