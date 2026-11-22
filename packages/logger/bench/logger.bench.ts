import { bench, describe } from 'vitest'
import { createLogger } from '../src/index.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }
const silentLogger = createLogger({ name: 'bench', level: 'silent' })
const errorLogger = createLogger({ name: 'bench', level: 'error' })

describe('@tevm/logger', () => {
	bench(
		'createLogger instantiation',
		() => {
			const logger = createLogger({ name: 'tevm-bench', level: 'silent' })
			if (!logger) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'silent logger info/debug calls (suppressed fast path)',
		() => {
			silentLogger.debug({ method: 'eth_call', gas: 21000 }, 'executing call')
			silentLogger.info({ blockNumber: 42 }, 'mined block')
		},
		benchOpts,
	)

	bench(
		'error-level logger suppressed trace/debug/info calls',
		() => {
			errorLogger.trace('trace msg')
			errorLogger.debug({ txHash: '0x1234' }, 'debug msg')
			errorLogger.info({ status: 'ok' }, 'info msg')
		},
		benchOpts,
	)
})
