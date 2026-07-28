import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from './createMcpServer.js'

/**
 * Starts the Tevm MCP server over standard input and output.
 *
 * @param {{idleTtlMs?: number, maximumSessions?: number}} [options] - Session lifetime and capacity.
 * @returns {Promise<void>} Resolves after the stdio transport is connected.
 *
 * @example
 * ```js
 * import { startMcpServer } from '@tevm/mcp'
 *
 * await startMcpServer()
 * ```
 */
export const startMcpServer = async (options = {}) => {
	const server = createMcpServer(options)
	await server.connect(new StdioServerTransport())
}
