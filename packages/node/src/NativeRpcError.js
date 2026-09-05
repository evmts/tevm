import { BaseError } from '@tevm/errors'

/** A native JSON-RPC failure, retaining the exact code and optional error data. */
export class NativeRpcError extends BaseError {
	/**
	 * @param {{code: number; message: string; data?: import('./ZevmEngine.js').JsonValue}} error
	 */
	constructor(error) {
		super(error.message, {}, 'NativeRpcError', error.code)
		/** @type {import('./ZevmEngine.js').JsonValue | undefined} */
		this.data = error.data
	}
}
