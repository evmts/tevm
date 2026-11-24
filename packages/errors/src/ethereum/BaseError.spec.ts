import { describe, expect, it } from 'vitest'
import manifest from '../../package.json' with { type: 'json' }
import { BaseError } from './BaseError.js'

describe('BaseError', () => {
	it('should not allow direct instantiation', () => {
		expect(() => {
			new BaseError('Error message', {}, 'BaseError')
		}).toThrow(TypeError)
	})

	it('should create an error with the correct properties', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const error = new CustomError('Short message', {
			docsBaseUrl: 'https://docs.example.com',
			docsPath: '/errors/custom-error',
			docsSlug: 'details',
			metaMessages: ['Meta message 1', 'Meta message 2'],
			cause: 'An internal cause',
			details: 'Detailed information about the error',
		})

		expect(error._tag).toBe('CustomError')
		expect(error.name).toBe('CustomError')
		expect(error.shortMessage).toBe('Short message')
		expect(error.docsPath).toBe('/errors/custom-error')
		expect(error.metaMessages).toEqual(['Meta message 1', 'Meta message 2'])
		expect(error.details).toBe('Detailed information about the error')
		expect(error.version).toBe(manifest.version)
		expect(error.message).toContain('Short message')
		expect(error.message).toContain('Meta message 1')
		expect(error.message).toContain('Meta message 2')
		expect(error.message).toContain('Docs: https://docs.example.com/errors/custom-error#details')
		expect(error.message).toContain('Details: Detailed information about the error')
		expect(error.message).toContain(`Version: ${manifest.version}`)
	})

	it('should handle cause as an instance of BaseError', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const cause = new CustomError('Cause message', {
			docsPath: '/errors/cause-error',
		})

		const error = new CustomError('Short message', {
			cause,
			docsPath: '/errors/custom-error',
		})

		expect(error._tag).toBe('CustomError')
		expect(error.name).toBe('CustomError')
		expect(error.shortMessage).toBe('Short message')
		expect(error.docsPath).toBe('/errors/cause-error')
		expect(error.details).toBe('Cause message')
		expect(error.message).toContain('Short message')
		expect(error.message).toContain('Docs: https://tevm.sh/errors/cause-error')
		expect(error.message).toContain('Details: Cause message')
		expect(error.message).toContain(`Version: ${manifest.version}`)
	})

	it('should handle cause as an instance of Error', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const cause = new Error('Standard error message')

		const error = new CustomError('Short message', {
			cause,
			docsPath: '/errors/custom-error',
		})

		expect(error._tag).toBe('CustomError')
		expect(error.name).toBe('CustomError')
		expect(error.shortMessage).toBe('Short message')
		expect(error.docsPath).toBe('/errors/custom-error')
		expect(error.details).toBe('Standard error message')
		expect(error.message).toContain('Short message')
		expect(error.message).toContain('Docs: https://tevm.sh/errors/custom-error')
		expect(error.message).toContain('Details: Standard error message')
		expect(error.message).toContain(`Version: ${manifest.version}`)
	})

	it('should handle cause as a string', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const error = new CustomError('Short message', {
			cause: 'String cause',
			docsPath: '/errors/custom-error',
		})

		expect(error._tag).toBe('CustomError')
		expect(error.name).toBe('CustomError')
		expect(error.shortMessage).toBe('Short message')
		expect(error.docsPath).toBe('/errors/custom-error')
		expect(error.details).toBe('String cause')
		expect(error.message).toContain('Short message')
		expect(error.message).toContain('Docs: https://tevm.sh/errors/custom-error')
		expect(error.message).toContain('Details: String cause')
		expect(error.message).toContain(`Version: ${manifest.version}`)
	})

	it('should handle cause as an unknown type', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const cause = { some: 'unknown object' }

		const error = new CustomError('Short message', {
			cause,
			docsPath: '/errors/custom-error',
		})

		expect(error._tag).toBe('CustomError')
		expect(error.name).toBe('CustomError')
		expect(error.shortMessage).toBe('Short message')
		expect(error.docsPath).toBe('/errors/custom-error')
		expect(error.details).toBe(JSON.stringify(cause))
		expect(error.message).toContain('Short message')
		expect(error.message).toContain('Docs: https://tevm.sh/errors/custom-error')
		expect(error.message).toContain('Details: {"some":"unknown object"}')
		expect(error.message).toContain(`Version: ${manifest.version}`)
	})

	it('should walk through the error chain', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const cause = new CustomError('Cause message', {
			docsPath: '/errors/cause-error',
		})

		const error = new CustomError('Short message', {
			cause,
			docsPath: '/errors/custom-error',
		})

		const result = error.walk((err: any) => err._tag === 'CustomError' && err.shortMessage === 'Cause message')

		expect(result).toBe(cause)
	})

	it('formats details and message consistently for null, falsy primitives, and circular object causes', () => {
		class CustomError extends BaseError {
			constructor(message: string, args: any) {
				super(message, args, 'CustomError')
			}
		}

		const circular: { label: string; self?: unknown } = { label: 'loop' }
		circular.self = circular

		const nullCause = new CustomError('Null cause', { cause: null })
		expect(nullCause.details).toBeUndefined()
		expect(nullCause.message).not.toContain('Details:')

		const emptyStringCause = new CustomError('Empty string cause', { cause: '' })
		expect(emptyStringCause.details).toBeUndefined()
		expect(emptyStringCause.message).not.toContain('Details:')

		const zeroArgs = { cause: 0 }
		const zeroCause = new CustomError('Zero cause', zeroArgs)
		expect(zeroCause.details).toBe('0')

		const falseArgs = { cause: false }
		const falseCause = new CustomError('False cause', falseArgs)
		expect(falseCause.details).toBe('false')

		const numberArgs = { cause: 42 }
		const numberCause = new CustomError('Number cause', numberArgs)
		expect(numberCause.details).toBe('42')

		const circularCause = new CustomError('Circular cause', { cause: circular })
		expect(circularCause.details).toBe('Unable to parse error details')
		expect(circularCause.message).toContain('Details: Unable to parse error details')
	})
})
