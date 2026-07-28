import { z } from 'zod'

const handle = z.string().uuid().describe('Session handle returned by evm_create_session or evm_fork_chain')
const address = z
	.string()
	.regex(/^0x[0-9a-fA-F]{40}$/)
	.describe('20-byte EVM address')
const hex = z
	.string()
	.regex(/^0x(?:[0-9a-fA-F]{2})*$/)
	.describe('0x-prefixed, even-length hexadecimal bytes')
const quantity = z
	.string()
	.regex(/^(0|[1-9][0-9]*)$/)
	.describe('Non-negative base-10 integer encoded as a string')
const abi = z.array(z.record(z.string(), z.unknown())).min(1).describe('JSON ABI array')
const jsonArgs = z.array(z.unknown()).default([])
const signature = z
	.string()
	.regex(
		/^(?:function\s+)?[A-Za-z_$][A-Za-z0-9_$]*\s*\(.*\)/s,
		'Signature must name a function and its parameter list, for example "balanceOf(address)"',
	)
	.describe('Human-readable function signature, for example "balanceOf(address) view returns (uint256)"')

const contractTarget = {
	session: handle,
	address,
	abi: abi.optional(),
	signature: signature.optional(),
	functionName: z.string().min(1).optional(),
	args: jsonArgs,
	from: address.optional(),
	value: quantity.optional(),
	gasLimit: quantity.optional(),
}

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
export const toolSchemas = {
	evm_create_session: z.object({}).strict(),
	evm_fork_chain: z
		.object({
			url: z
				.string()
				.url()
				.refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
					message: 'Fork URL must use http or https',
				}),
			blockNumber: quantity.optional(),
			chain: z.enum(['auto', 'mainnet', 'optimism', 'base']).default('auto'),
		})
		.strict(),
	evm_close_session: z.object({ session: handle }).strict(),
	evm_call_contract: z
		.object(contractTarget)
		.strict()
		.refine((input) => input.abi || input.signature, { message: 'Provide abi or signature' }),
	evm_send_transaction: z
		.object(contractTarget)
		.strict()
		.refine((input) => input.abi || input.signature, { message: 'Provide abi or signature' }),
	evm_deploy_contract: z
		.object({
			session: handle,
			bytecode: hex.optional(),
			source: z.string().min(1).optional(),
			contractName: z.string().min(1).optional(),
			abi: abi.optional(),
			args: jsonArgs,
			from: address.optional(),
			gasLimit: quantity.optional(),
			optimize: z.boolean().default(true),
		})
		.strict()
		.refine((input) => input.bytecode || input.source, { message: 'Provide bytecode or Solidity source' }),
	evm_get_account: z
		.object({
			session: handle,
			address,
			storageSlot: hex.optional(),
			includeCachedStorage: z.boolean().default(false),
		})
		.strict(),
	evm_set_account: z
		.object({
			session: handle,
			address,
			balance: quantity.optional(),
			nonce: quantity.optional(),
			code: hex.optional(),
			storage: z.record(hex, hex).optional(),
		})
		.strict()
		.refine((input) => input.balance || input.nonce || input.code || input.storage, {
			message: 'Provide at least one state field to write',
		}),
	evm_mine: z
		.object({
			session: handle,
			blockCount: z.number().int().min(1).max(100).default(1),
			intervalSeconds: z.number().int().min(0).max(86400).optional(),
		})
		.strict(),
	evm_get_block: z
		.object({
			session: handle,
			blockNumber: quantity.optional(),
			blockHash: hex.optional(),
			includeTransactions: z.boolean().default(false),
		})
		.strict()
		.refine((input) => !(input.blockNumber && input.blockHash), {
			message: 'Provide only one of blockNumber or blockHash',
		}),
	evm_get_transaction_receipt: z.object({ session: handle, transactionHash: hex }).strict(),
	evm_get_txpool: z.object({ session: handle }).strict(),
	evm_trace_call: z
		.object({
			session: handle,
			address,
			data: hex.optional(),
			abi: abi.optional(),
			signature: signature.optional(),
			functionName: z.string().min(1).optional(),
			args: jsonArgs,
			from: address.optional(),
			value: quantity.optional(),
			gasLimit: quantity.optional(),
			maxSteps: z.number().int().min(10).max(2000).default(200),
		})
		.strict()
		.refine((input) => input.data || input.abi || input.signature, {
			message: 'Provide data, abi, or signature',
		}),
	evm_compile_solidity: z
		.object({
			source: z.string().min(1),
			contractName: z.string().min(1).optional(),
			optimize: z.boolean().default(true),
		})
		.strict(),
}
