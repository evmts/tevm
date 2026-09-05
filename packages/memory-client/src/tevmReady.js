/** Await native engine initialization.
 * @param {{transport: {tevm: import('@tevm/node').ZevmEngine}}} client
 * @returns {Promise<void>}
 */
export function tevmReady(client) {
	return client.transport.tevm.ready()
}
