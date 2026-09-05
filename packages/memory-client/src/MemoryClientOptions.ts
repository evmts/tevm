import type { ZevmEngine, ZevmEngineOptions } from '@tevm/node'
import type { Account, Chain, Hex } from 'viem'

/** Native engine and viem client options. tevmClose also closes a supplied engine. */
export type MemoryClientOptions = ZevmEngineOptions & {
	engine?: ZevmEngine
	common?: Chain
	account?: Account | Hex
	name?: string
	key?: string
}
