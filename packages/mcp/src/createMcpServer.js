import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { createSessionManager } from './createSessionManager.js'
import { executeTool } from './executeTool.js'
import { toJsonValue } from './toJsonValue.js'
import { toolDefinitions } from './toolDefinitions.js'

/**
 * Creates the Tevm MCP protocol server and its isolated session store.
 *
 * @param {{idleTtlMs?: number, maximumSessions?: number}} [options] - Session lifetime and capacity.
 * @returns {Server} An unconnected MCP server.
 *
 * @example
 * ```js
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
 * import { createMcpServer } from '@tevm/mcp'
 *
 * const server = createMcpServer()
 * await server.connect(new StdioServerTransport())
 * ```
 */
export const createMcpServer = (options = {}) => {
	const sessions = createSessionManager(options)
	const server = new Server(
		{ name: 'tevm-mcp', version: '1.0.0-rc.151' },
		{
			capabilities: { tools: {} },
			instructions:
				'Create or fork a session first, then pass its handle to every EVM tool. Sessions are isolated and expire after 30 idle minutes by default.',
		},
	)
	server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions }))
	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		try {
			const result = await executeTool(request.params.name, request.params.arguments, sessions)
			const structuredContent = /** @type {Record<string, unknown>} */ (
				result && typeof result === 'object' && !Array.isArray(result) ? result : { result }
			)
			return {
				content: [{ type: 'text', text: JSON.stringify(toJsonValue(result)) }],
				structuredContent,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			return {
				isError: true,
				content: [{ type: 'text', text: message }],
			}
		}
	})
	return server
}
