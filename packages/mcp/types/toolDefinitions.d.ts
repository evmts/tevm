/**
 * MCP tool metadata with agent-oriented names, descriptions, and JSON Schemas.
 *
 * @type {Array<{name: string, description: string, inputSchema: Record<string, unknown>}>}
 *
 * @example
 * ```js
 * import { toolDefinitions } from '@tevm/mcp'
 *
 * console.log(toolDefinitions.map((tool) => tool.name))
 * ```
 */
export const toolDefinitions: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}>;
//# sourceMappingURL=toolDefinitions.d.ts.map