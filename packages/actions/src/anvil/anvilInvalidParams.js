/**
 * Creates an Anvil-compatible invalid-parameters response.
 *
 * @param {{jsonrpc: '2.0', method: string, id?: string | number | null}} request
 * @param {string} message
 * @returns {{jsonrpc: '2.0', method: string, error: {code: -32602, message: string}, id?: string | number | null}}
 */
export const anvilInvalidParams = (request, message) => ({
	jsonrpc: '2.0',
	method: request.method,
	error: {
		code: -32602,
		message,
	},
	...(request.id !== undefined ? { id: request.id } : {}),
})
