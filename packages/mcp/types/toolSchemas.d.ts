/**
 * Runtime Zod schemas for every exposed MCP tool.
 *
 * @type {Record<string, z.ZodType>}
 *
 * @example
 * ```js
 * import { toolSchemas } from '@tevm/mcp'
 *
 * const input = toolSchemas.evm_mine.parse({ session: crypto.randomUUID() })
 * console.log(input.blockCount)
 * ```
 */
export const toolSchemas: Record<string, z.ZodType>;
import { z } from 'zod';
//# sourceMappingURL=toolSchemas.d.ts.map