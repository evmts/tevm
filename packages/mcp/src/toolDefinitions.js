import { z } from 'zod'
import { toolSchemas } from './toolSchemas.js'

/** @type {Record<string, string>} */
const descriptions = {
	evm_create_session:
		'Create a fresh local in-process EVM. Use this before compiling, deploying, or testing contracts without a fork. Returns an isolated session handle.',
	evm_fork_chain:
		'Fork an EVM chain from a public HTTP RPC URL, optionally at an exact block. Use this to inspect or modify real mainnet, Optimism, or Base state locally. Returns an isolated session handle.',
	evm_close_session:
		'Close an EVM session when its state is no longer needed. Use this to release memory before creating more sessions.',
	evm_call_contract:
		'Read a contract without changing state. Use an ABI or one human-readable function signature. Returns decoded output, raw output, and a gas estimate.',
	evm_send_transaction:
		'Execute a state-changing contract function and add it to the session txpool. Use evm_mine afterward to commit it. Returns a gas estimate and transaction hash. Read the mined receipt for actual gas use and logs.',
	evm_deploy_contract:
		'Deploy EVM bytecode or compile and deploy Solidity source into a session. The deployment enters the txpool, so use evm_mine to commit it. Returns the predicted address, gas limit, and transaction hash. Confirm creation in the mined receipt.',
	evm_get_account:
		'Inspect account balance, nonce, code, and an optional exact storage slot. Use this for debugging local overrides or reading forked contract storage.',
	evm_set_account:
		'Directly overwrite balance, nonce, code, or storage without a transaction. Use this cheatcode surface to construct otherwise difficult debugging states.',
	evm_mine:
		'Mine pending transactions and advance time in an EVM session. Use after writes or deployments, or to test block-dependent behavior.',
	evm_get_block:
		'Query the latest block or a block by number or hash from an EVM session. Optionally include full transactions.',
	evm_get_transaction_receipt:
		'Fetch a mined transaction receipt by hash. Use after evm_mine to verify status, gas, logs, and contract creation.',
	evm_get_txpool:
		'Inspect pending and queued transactions plus txpool counts. Use before mining to reason about writes waiting for inclusion.',
	evm_trace_call:
		'Trace a contract call at opcode-step level. Use for control-flow and gas debugging, including calls that revert: a failing call still returns its trace plus the decoded error instead of throwing. The trace returns a bounded head and tail so it remains useful in an agent context window.',
	evm_compile_solidity:
		'Compile one Solidity source file to ABI, creation bytecode, and runtime bytecode. Use this before deployment or when starting from a contract snippet.',
}

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
export const toolDefinitions = Object.entries(toolSchemas).map(([name, schema]) => ({
	name,
	description: descriptions[name] ?? `Execute the ${name} Tevm EVM operation.`,
	inputSchema: z.toJSONSchema(schema),
}))
