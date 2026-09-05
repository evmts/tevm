import type { ZevmEngine } from '@tevm/node'
/** A client carrying the native engine transport. */
export type Client = { transport: { tevm: ZevmEngine } }
