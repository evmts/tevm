import manifest from '../../package.json' with { type: 'json' }

// Originally adapted from viem.
/**
 * @typedef {Object} BaseErrorParameters
 * @property {string} [docsBaseUrl]
 * @property {string} [docsPath]
 * @property {string} [docsSlug]
 * @property {string[]} [metaMessages]
 * @property {BaseError|Error|Error|unknown} [cause]
 * @property {string} [details]
 */

/**
 * @typedef {Object} BaseErrorType
 * @property {string} _tag - Internal tag for the error.
 * @property {string} details - Details of the error.
 * @property {string} shortMessage - Short message describing the error.
 * @property {string} version - The version of the library.
 * @property {Function} walk - Function to walk through the error chain.
 */

/**
 * Base class for custom errors in TEVM.
 * This class is abstract and should be extended by other error classes.
 * @abstract
 * @extends {Error}
 * @implements {BaseErrorType}
 */
export class BaseError extends Error {
	/**
	 * @param {string} shortMessage - A short, human-readable summary of the error.
	 * @param {BaseErrorParameters | undefined} args - Additional parameters for the error.
	 * @param {string} _tag - Internal tag for the error.
	 * @param {number} [code] - Error code analogous to the code in JSON RPC error.
	 */
	constructor(shortMessage, args = {}, _tag, code = 0) {
		if (new.target === BaseError) {
			throw new TypeError('Cannot construct BaseError instances directly')
		}
		super()

		const details =
			args.details ??
			(() => {
				if (args.cause === null || args.cause === undefined) {
					return ''
				}
				if (args.cause instanceof BaseError) {
					return args.cause.details ?? args.cause.shortMessage
				}
				if (typeof args.cause === 'string') {
					return args.cause
				}
				if (typeof args.cause !== 'object') {
					return String(args.cause)
				}
				if ('message' in args.cause) {
					return /** @type {string}*/ (args.cause.message)
				}
				if (args.cause instanceof Error) {
					if ('errorType' in args.cause) {
						return args.cause.errorType
					}
				}
				try {
					return JSON.stringify(args.cause)
				} catch (_e) {
					return 'Unable to parse error details'
				}
			})()
		const docsPath = args.cause instanceof BaseError ? args.cause.docsPath || args.docsPath : args.docsPath
		/**
		 * @type {string}
		 */
		this._tag = _tag
		/**
		 * @type {string}
		 */
		this.name = _tag
		if (details) {
			/**
			 * @type {string}
			 */
			this.details = /** @type {string}*/ (details)
		}
		/**
		 * @type {string|undefined}
		 */
		this.docsPath = docsPath
		/**
		 * @type {string[]|undefined}
		 */
		this.metaMessages = args.metaMessages
		/**
		 * @type {string}
		 */
		this.shortMessage = shortMessage
		/**
		 * @type {string}
		 */
		this.version = manifest.version
		/**
		 * @type {number}
		 */
		this.code = code
		if (args.cause !== undefined && args.cause !== null) {
			this.cause = /**@type {any} */ (args.cause)
		}

		let message = `${shortMessage || 'An error occurred.'}\n`
		if (args.metaMessages) {
			for (let i = 0; i < args.metaMessages.length; i++) {
				message += `\n${args.metaMessages[i]}`
			}
			message += '\n'
		}
		if (docsPath) {
			message += `\nDocs: ${args.docsBaseUrl ?? 'https://tevm.sh'}${docsPath}${args.docsSlug ? `#${args.docsSlug}` : ''}`
		}
		if (details) {
			message += `\nDetails: ${details}`
		}
		message += `\nVersion: ${this.version}`
		/**
		 * @type {string}
		 */
		this.message = message
	}

	/**
	 * Return the enumerable error fields as JSON diagnostics. Bigints use decimal strings
	 * and references back to an ancestor use `[Circular]`. Live causes and data retain their types.
	 * @returns {Record<string, unknown>} A serializable snapshot including subclass fields.
	 */
	toJSON() {
		const ancestors = new WeakSet([this])
		return Object.fromEntries(Object.entries(this).map(([key, value]) => [key, snapshot(value, ancestors, key)]))
	}

	/**
	 * Walks through the error chain.
	 * @param {Function} [fn] - A function to execute on each error in the chain.
	 * @returns {Error|unknown} The first match, or null if none matches. Without a predicate, returns the terminal or first repeated cause.
	 */
	walk(fn) {
		return walk(this, fn)
	}
}

/**
 * Helper function to walk through the error chain.
 * @param {unknown} err - The error to walk through.
 * @param {Function} [fn] - A function to execute on each error in the chain.
 * @returns {unknown} The first match, or null if none matches. Without a predicate, returns the terminal or first repeated cause.
 */
function walk(err, fn) {
	const visited = new Set()
	while (!visited.has(err)) {
		if (fn?.(err)) return err
		if (!err || typeof err !== 'object' || !('cause' in err)) break
		visited.add(err)
		err = err.cause
	}
	return fn ? null : err
}

/** @param {unknown} value @param {WeakSet<object>} ancestors @param {string} key @returns {unknown} */
function snapshot(value, ancestors, key) {
	if (typeof value === 'bigint') return value.toString()
	if (value === null || typeof value !== 'object') return value
	if (ancestors.has(value)) return '[Circular]'
	if (value instanceof Number || value instanceof String || value instanceof Boolean) return value.valueOf()
	if (value instanceof BigInt) return value.toString()
	ancestors.add(value)
	try {
		if ('toJSON' in value && typeof value.toJSON === 'function' && value.toJSON !== BaseError.prototype.toJSON) {
			const json = value.toJSON(key)
			if (json !== value) return snapshot(json, ancestors, key)
		}
		if (Array.isArray(value)) return value.map((item, index) => snapshot(item, ancestors, String(index)))
		const fields = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors, key)]))
		if (value instanceof Error) {
			fields['name'] = value.name
			fields['message'] = value.message
			if ('cause' in value && !Object.hasOwn(fields, 'cause'))
				fields['cause'] = snapshot(value.cause, ancestors, 'cause')
		}
		return fields
	} finally {
		ancestors.delete(value)
	}
}
