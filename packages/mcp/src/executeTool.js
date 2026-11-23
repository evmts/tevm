import {
	decodeErrorResult,
	decodeFunctionResult,
	encodeFunctionData,
	getContractAddress,
	keccak256,
	parseAbi,
	toFunctionSignature,
	toHex,
} from 'viem'
import { compileSolidity } from './compileSolidity.js'
import { toJsonValue } from './toJsonValue.js'
import { toolSchemas } from './toolSchemas.js'

/**
 * @param {unknown} value
 * @param {{type: string, name?: string, components?: Array<{type: string, name?: string, components?: any[]}>}} parameter
 * @returns {unknown}
 */
const coerceAbiValue = (value, parameter) => {
	if (parameter.type.endsWith(']') && Array.isArray(value)) {
		const elementType = parameter.type.replace(/\[[0-9]*\]$/, '')
		return value.map((item) => coerceAbiValue(item, { ...parameter, type: elementType }))
	}
	if (parameter.type === 'tuple' && parameter.components) {
		if (Array.isArray(value) && value.length === parameter.components.length)
			return parameter.components.map((field, i) => coerceAbiValue(value[i], field))
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return parameter.components.map((field) => {
				if (!field.name || !Object.hasOwn(value, field.name)) throw new Error(`Missing tuple field: ${field.name}`)
				return coerceAbiValue(/** @type {Record<string, unknown>} */ (value)[field.name], field)
			})
		}
		throw new Error('Expected a tuple with all ABI components')
	}
	if (/^u?int[0-9]*$/.test(parameter.type)) {
		if (typeof value === 'string' && /^(?:-?[0-9]+|0x[0-9a-f]+)$/i.test(value)) return BigInt(value)
		if (typeof value !== 'bigint' && !Number.isSafeInteger(value)) throw new Error(`Invalid ${parameter.type} integer`)
	}
	if (parameter.type === 'string' && typeof value !== 'string') throw new Error('Expected a string')
	return value
}

/**
 * Resolve one ABI overload against the JSON arguments before encoding or decoding.
 * @param {Array<any> | undefined} suppliedAbi
 * @param {string | undefined} signature
 * @param {string | undefined} suppliedName
 * @param {unknown[]} args
 */
const resolveFunction = (suppliedAbi, signature, suppliedName, args) => {
	/** @type {import('viem').Abi} */
	const parsed = signature ? parseAbi([signature.startsWith('function ') ? signature : `function ${signature}`]) : []
	const abi = suppliedAbi ?? parsed
	const functions = abi.filter((item) => item.type === 'function')
	const names = new Set(functions.map((item) => item.name))
	const signed = /** @type {import('viem').AbiFunction | undefined} */ (parsed[0])
	const functionName = suppliedName ?? signed?.name ?? (names.size === 1 ? functions[0].name : undefined)
	if (!functionName) throw new Error('functionName is required when the ABI contains more than one function')
	const candidates = functions.filter(
		(item) => item.name === functionName && (!signed || toFunctionSignature(item) === toFunctionSignature(signed)),
	)
	if (!candidates.length) throw new Error(`Function "${functionName}" was not found in the supplied ABI`)
	const matches = []
	for (const entry of candidates) {
		if (entry.inputs.length !== args.length) continue
		try {
			const values = args.map((value, index) => coerceAbiValue(value, entry.inputs[index]))
			const data = encodeFunctionData({ abi: [entry], functionName, args: values })
			matches.push({ abi: [entry], functionName, data })
		} catch (error) {
			if (candidates.length === 1) throw error
		}
	}
	if (matches.length > 1) throw new Error(`Ambiguous overload for ${functionName}. Provide its exact signature.`)
	const match = matches[0]
	if (!match) throw new Error(`No overload of ${functionName} accepts the supplied arguments`)
	return match
}

/**
 * @param {ReadonlyArray<any>} abi
 * @param {unknown[]} args
 * @returns {unknown[]}
 */
const coerceConstructorArgs = (abi, args) => {
	const entry = abi.find((item) => item.type === 'constructor')
	return args.map((value, index) => coerceAbiValue(value, entry?.inputs?.[index] ?? { type: '' }))
}

/**
 * Decodes a standard Solidity `Error(string)` or `Panic(uint256)` revert payload.
 *
 * @param {unknown} returnValue - Raw return data from a failed call.
 * @param {ReadonlyArray<any>} [abi] - Optional ABI carrying custom errors.
 * @returns {string | undefined} A human-readable reason, or undefined when the payload is not decodable.
 */
const decodeRevertReason = (returnValue, abi = []) => {
	if (typeof returnValue !== 'string' || returnValue.length < 10) {
		return undefined
	}
	try {
		const decoded = decodeErrorResult({ abi, data: /** @type {`0x${string}`} */ (returnValue) })
		const args = (decoded.args ?? []).map((value) => String(value))
		return args.length > 0 ? `${decoded.errorName}: ${args.join(', ')}` : decoded.errorName
	} catch {
		return undefined
	}
}

/**
 * Executes one validated Tevm MCP tool against an isolated session manager.
 *
 * @param {string} name - MCP tool name.
 * @param {unknown} input - Untrusted MCP tool arguments.
 * @param {ReturnType<import('./createSessionManager.js').createSessionManager>} sessions - Session manager.
 * @returns {Promise<unknown>} A JSON-safe tool result.
 *
 * @example
 * ```js
 * import { createSessionManager, executeTool } from '@tevm/mcp'
 *
 * const sessions = createSessionManager()
 * const result = await executeTool('evm_create_session', {}, sessions)
 * console.log(result.handle)
 * ```
 */
export const executeTool = async (name, input, sessions) => {
	const schema = Object.hasOwn(toolSchemas, name) ? toolSchemas[name] : undefined
	if (!schema) {
		throw new Error(`Unknown tool: ${name}`)
	}
	const args = schema.parse(input ?? {})

	switch (name) {
		case 'evm_create_session':
			return toJsonValue(await sessions.createLocal())
		case 'evm_fork_chain':
			return toJsonValue(await sessions.createFork(args))
		case 'evm_close_session':
			return { closed: await sessions.close(args.session) }
		case 'evm_compile_solidity':
			return toJsonValue(compileSolidity(args))
		case 'evm_call_contract':
		case 'evm_send_transaction': {
			const client = sessions.get(args.session)
			const resolved = resolveFunction(args.abi, args.signature, args.functionName, args.args)
			const call = {
				to: args.address,
				data: resolved.data,
				...(args.from ? { from: args.from } : {}),
				...(args.value ? { value: BigInt(args.value) } : {}),
				...(args.gasLimit ? { gas: BigInt(args.gasLimit) } : {}),
			}
			try {
				if (name === 'evm_call_contract') {
					const { rawData } = await client.tevmCall(call)
					return toJsonValue({
						rawOutput: rawData,
						decodedOutput: decodeFunctionResult({ ...resolved, data: rawData }),
					})
				}
				// A caller-supplied limit is not an estimate: report it as `gasLimit` and skip eth_estimateGas.
				const gas =
					call.gas !== undefined
						? { gasLimit: call.gas }
						: {
								estimatedGas: BigInt(
									/** @type {string} */ (
										await client.transport.tevm.request({
											method: 'eth_estimateGas',
											params: [
												{
													to: call.to,
													data: call.data,
													...(call.from ? { from: call.from } : {}),
													...(call.value === undefined ? {} : { value: toHex(call.value) }),
												},
											],
										})
									),
								),
							}
				const { txHash, rawData } = await client.tevmCall({ ...call, addToMempool: true })
				return toJsonValue({ txHash, rawOutput: rawData, ...gas })
			} catch (error) {
				const reason = decodeRevertReason(/** @type {{data?:unknown}} */ (error)?.data, args.abi)
				if (reason) throw new Error(reason, { cause: error })
				throw error
			}
		}
		case 'evm_deploy_contract': {
			const client = sessions.get(args.session)
			const artifact = args.source ? compileSolidity(args) : undefined
			const selectedAbi = args.abi ?? artifact?.abi ?? []
			const bytecode = args.bytecode ?? artifact?.bytecode
			if (!bytecode) {
				throw new Error('Provide bytecode or Solidity source')
			}
			const result = await client.tevmDeploy({
				bytecode,
				abi: selectedAbi,
				args: coerceConstructorArgs(selectedAbi, args.args),
				...(args.from ? { from: args.from } : {}),
				...(args.gasLimit ? { gas: BigInt(args.gasLimit) } : {}),
				addToMempool: true,
			})
			if (!result.txHash) throw new Error('Deployment did not return a transaction hash')
			const tx = /** @type {{from: `0x${string}`; nonce: string; gas: string} | null} */ (
				await client.transport.tevm.request({ method: 'eth_getTransactionByHash', params: [result.txHash] })
			)
			if (!tx) throw new Error(`Deployment transaction ${result.txHash} was not found by eth_getTransactionByHash`)
			return toJsonValue({
				contractAddress: getContractAddress({ from: tx.from, nonce: BigInt(tx.nonce) }),
				transactionHash: result.txHash,
				gasLimit: BigInt(tx.gas),
				abi: selectedAbi,
			})
		}
		case 'evm_get_account': {
			const client = sessions.get(args.session)
			const account = await client.tevmGetAccount({
				address: args.address,
			})
			const storageValue = args.storageSlot
				? await client.getStorageAt({ address: args.address, slot: toHex(BigInt(args.storageSlot)) })
				: undefined
			return toJsonValue({
				address: account.address,
				balance: account.balance,
				nonce: account.nonce,
				code: account.deployedBytecode,
				codeHash: keccak256(account.deployedBytecode),
				isContract: account.deployedBytecode !== '0x',
				isEmpty: account.deployedBytecode === '0x' && account.balance === 0n && account.nonce === 0n,
				...(args.includeCachedStorage ? { cachedStorage: account.storage } : {}),
				...(args.storageSlot ? { storageSlot: args.storageSlot, storageValue } : {}),
			})
		}
		case 'evm_set_account': {
			const client = sessions.get(args.session)
			await client.tevmSetAccount({
				address: args.address,
				...(args.balance ? { balance: BigInt(args.balance) } : {}),
				...(args.nonce ? { nonce: BigInt(args.nonce) } : {}),
				...(args.code ? { deployedBytecode: args.code } : {}),
				...(args.storage
					? {
							storage: Object.fromEntries(
								Object.entries(args.storage).map(([slot, value]) => [
									toHex(BigInt(slot)),
									toHex(BigInt(/** @type {string} */ (value))),
								]),
							),
						}
					: {}),
			})
			return { updated: true, address: args.address }
		}
		case 'evm_mine': {
			const client = sessions.get(args.session)
			const result = await client.tevmMine({
				blocks: args.blockCount,
				...(args.intervalSeconds !== undefined ? { interval: args.intervalSeconds } : {}),
			})
			return toJsonValue({
				result,
				blockNumber: await client.getBlockNumber(),
			})
		}
		case 'evm_get_block': {
			const client = sessions.get(args.session)
			const block = await client.getBlock({
				...(args.blockNumber ? { blockNumber: BigInt(args.blockNumber) } : {}),
				...(args.blockHash ? { blockHash: args.blockHash } : {}),
				includeTransactions: args.includeTransactions,
			})
			return toJsonValue(block)
		}
		case 'evm_get_transaction_receipt': {
			const client = sessions.get(args.session)
			return toJsonValue(await client.getTransactionReceipt({ hash: args.transactionHash }))
		}
		case 'evm_get_txpool': {
			const client = sessions.get(args.session)
			const [content, status] = await Promise.all([
				client.transport.tevm.request({ method: 'txpool_content' }),
				client.transport.tevm.request({ method: 'txpool_status' }),
			])
			return toJsonValue({ status, content })
		}
		case 'evm_trace_call': {
			const client = sessions.get(args.session)
			let data = args.data
			if (!data) {
				data = resolveFunction(args.abi, args.signature, args.functionName, args.args).data
			}
			const result = /** @type {{failed:boolean; returnValue:string; gas:string|number; structLogs: unknown[]}} */ (
				await client.transport.tevm.request({
					method: 'debug_traceCall',
					params: [
						{
							to: args.address,
							data,
							...(args.from ? { from: args.from } : {}),
							...(args.value ? { value: toHex(BigInt(args.value)) } : {}),
							...(args.gasLimit ? { gas: toHex(BigInt(args.gasLimit)) } : {}),
						},
						'latest',
						{},
					],
				})
			)
			const errors = result.failed ? [{ name: 'ExecutionError', message: 'Execution reverted or failed' }] : []
			const steps = result.structLogs
			const headCount = Math.ceil(args.maxSteps * 0.7)
			const tailCount = args.maxSteps - headCount
			const selectedSteps =
				steps.length <= args.maxSteps
					? steps
					: [...steps.slice(0, headCount), ...(tailCount > 0 ? steps.slice(-tailCount) : [])]
			const returnValue = result.returnValue.startsWith('0x') ? result.returnValue : `0x${result.returnValue}`
			return toJsonValue({
				failed: result.failed || errors.length > 0,
				errors,
				revertReason: errors.length > 0 ? decodeRevertReason(returnValue, args.abi) : undefined,
				gasUsed: result.gas,
				returnValue,
				totalSteps: steps.length,
				returnedSteps: selectedSteps.length,
				omittedSteps: Math.max(0, steps.length - selectedSteps.length),
				truncation:
					steps.length > args.maxSteps
						? { headSteps: headCount, tailSteps: tailCount, omittedMiddle: steps.length - args.maxSteps }
						: undefined,
				steps: selectedSteps,
			})
		}
		default:
			throw new Error(`Tool is declared but has no implementation: ${name}`)
	}
}
