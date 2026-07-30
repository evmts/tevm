import { pino } from 'pino'

/**
 * Creates a tevm logger instance
 * Wraps [pino](https://github.com/pinojs/pino/blob/master/docs/api.md)
 * @param {import('./LogOptions.js').LogOptions} options - The logger options including the logger `name` and minimum `level`
 * @returns {import('./Logger.js').Logger} A logger instance
 * @throws {never}
 * @example
 * ```typescript
 * import { createLogger } from '@tevm/logger'
 *
 * const logger = createLogger({
 *   name: 'my-app',
 *   level: 'debug',
 * })
 *
 * logger.info('Hello world')
 * logger.debug({ some: 'context' }, 'Debugging with context')
 * ```
 */
export const createLogger = (options) => {
	const pinoLogger = pino({
		name: options.name,
		level: options.level,
	})
	return pinoLogger
}
