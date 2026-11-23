import { describe, expect, it } from 'vitest'
import { createLogger } from './createLogger.js'

describe(createLogger.name, () => {
	it('creates a logger with the requested level and name', () => {
		const logger = createLogger({
			name: 'testLogger',
			level: 'fatal',
		})
		expect(logger).toBeDefined()
		expect(logger.level).toBe('fatal')
		expect(typeof logger.info).toBe('function')
		expect(typeof logger.error).toBe('function')
		expect(typeof logger.warn).toBe('function')
		expect(typeof logger.debug).toBe('function')
		expect(typeof logger.trace).toBe('function')
	})

	it('supports every standard pino log level', () => {
		for (const level of ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const) {
			const logger = createLogger({ name: `logger-${level}`, level })
			expect(logger.level).toBe(level)
		}
	})
})
