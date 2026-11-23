import type { ConsoleLogHandler, ZevmEngine, ZevmEngineOptions } from '@tevm/node'
import type { Account, Chain, Hex } from 'viem'

/** ZEVM engine (native or pluggable WASM backend) and viem client options. tevmClose also closes a supplied engine. */
export type MemoryClientOptions = ZevmEngineOptions & {
	engine?: ZevmEngine
	/**
	 * Chain reported as `client.chain`. Defaults to Foundry's chain (ID 31337, or `chainId`).
	 * With an injected `backend` or `engine` and neither `common` nor `chainId`, `client.chain`
	 * is `undefined`. Read the chain ID with `client.getChainId()`.
	 */
	common?: Chain
	account?: Account | Hex
	name?: string
	key?: string
	/**
	 * Print Hardhat `console.log` output from Solidity. `true` writes each message with
	 * `console.log`; a function receives each message with its raw calldata and decoded
	 * arguments. Forwarded to `createZevmEngine`; ignored when `engine` is supplied, so
	 * configure that engine directly. Decoded messages are also emitted as `consoleLog`
	 * events on `client.transport.tevm.events`.
	 * @example
	 * import { createMemoryClient } from '@tevm/memory-client'
	 * const client = createMemoryClient({ consoleLog: (message) => console.log(`[sol] ${message}`) })
	 * await client.tevmClose()
	 */
	consoleLog?: boolean | ConsoleLogHandler
}
