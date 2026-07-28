import { decodeErrorResult, encodeFunctionData, parseAbi } from 'viem'
import { compileSolidity } from './compileSolidity.js'
import { toJsonValue } from './toJsonValue.js'
import { toolSchemas } from './toolSchemas.js'

/**
 * @param {Array<Record<string, unknown>> | undefined} suppliedAbi
 * @param {string | undefined} signature
 * @param {string | undefined} suppliedFunctionName
 */
const resolveFunction = (suppliedAbi, signature, suppliedFunctionName) => {
	if (!suppliedAbi && !signature) {
		throw new Error('Provide abi or signature')
	}
	/** @type {Array<any>} */
	let resolvedAbi
	if (suppliedAbi) {
		resolvedAbi = suppliedAbi
	} else {
		const readableSignature = /** @type {string} */ (signature)
		resolvedAbi = /** @type {Array<any>} */ (
			parseAbi([readableSignature.startsWith('function ') ? readableSignature : `function ${readableSignature}`])
		)
	}
	const functions = resolvedAbi.filter((item) => item.type === 'function')
	const functionName =
		suppliedFunctionName ??
		(typeof functions[0]?.name === 'string' && functions.length === 1 ? functions[0].name : undefined)
	if (!functionName) {
		throw new Error('functionName is required when the ABI contains more than one function')
	}
	if (!functions.some((item) => item.name === functionName)) {
		throw new Error(`Function "${functionName}" was not found in the supplied ABI`)
	}
	return { abi: resolvedAbi, functionName }
}

/**
 * @param {unknown} value
 * @param {{type: string, components?: Array<{type: string, components?: any[]}>}} parameter
 * @returns {unknown}
 */
const coerceAbiValue = (value, parameter) => {
	if (parameter.type.endsWith(']') && Array.isArray(value)) {
		const elementType = parameter.type.replace(/\[[0-9]*\]$/, '')
		return value.map((item) => coerceAbiValue(item, { ...parameter, type: elementType }))
	}
	if (parameter.type.startsWith('tuple') && parameter.components && Array.isArray(value)) {
		return value.map((item, index) => coerceAbiValue(item, parameter.components?.[index] ?? { type: '' }))
	}
	if (/^u?int[0-9]*$/.test(parameter.type) && typeof value === 'string' && /^-?[0-9]+$/.test(value)) {
		return BigInt(value)
	}
	return value
}

/**
 * @param {ReadonlyArray<any>} abi
 * @param {string} functionName
 * @param {unknown[]} args
 * @returns {unknown[]}
 */
const coerceFunctionArgs = (abi, functionName, args) => {
	const entry = abi.find((item) => item.type === 'function' && item.name === functionName)
	return args.map((value, index) => coerceAbiValue(value, entry?.inputs?.[index] ?? { type: '' }))
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
 * @param {{
 *   data?: unknown,
 *   rawData: `0x${string}`,
 *   totalGasSpent?: bigint,
 *   executionGasUsed: bigint,
 *   logs?: unknown[],
 *   txHash?: `0x${string}`,
 *   status?: `0x${string}`
 * }} result
 */
const callResult = (result) =>
	toJsonValue({
		decodedOutput: result.data,
		rawOutput: result.rawData,
		gasUsed: result.totalGasSpent ?? result.executionGasUsed,
		executionGasUsed: result.executionGasUsed,
		logs: result.logs ?? [],
		txHash: result.txHash,
		status: result.status,
	})

/**
 * Decodes a standard Solidity `Error(string)` or `Panic(uint256)` revert payload.
 *
 * @param {unknown} returnValue - Raw return data from a failed call.
 * @param {ReadonlyArray<any>} [abi] - Optional ABI carrying custom errors.
 * @returns {string | undefined} A human-readable reason, or undefined when the payload is not decodable.
 */
const decodeRevertReason = (returnValue, abi = []) => {
	if (typeof returnValue !== 'string' || returnValue.length <= 10) {
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
	const schema = toolSchemas[name]
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
			return { closed: sessions.close(args.session) }
		case 'evm_compile_solidity':
			return toJsonValue(compileSolidity(args))
		case 'evm_call_contract':
		case 'evm_send_transaction': {
			const client = sessions.get(args.session)
			const resolved = resolveFunction(args.abi, args.signature, args.functionName)
			const result = await client.tevmContract({
				to: args.address,
				abi: resolved.abi,
				functionName: resolved.functionName,
				args: coerceFunctionArgs(resolved.abi, resolved.functionName, args.args),
				...(args.from ? { from: args.from } : {}),
				...(args.value ? { value: BigInt(args.value) } : {}),
				...(args.gasLimit ? { gas: BigInt(args.gasLimit) } : {}),
				...(name === 'evm_send_transaction' ? { addToMempool: true } : {}),
			})
			return callResult(result)
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
			return toJsonValue({
				contractAddress: result.createdAddress,
				transactionHash: result.txHash,
				gasUsed: result.totalGasSpent ?? result.executionGasUsed,
				executionGasUsed: result.executionGasUsed,
				logs: result.logs ?? [],
				abi: selectedAbi,
			})
		}
		case 'evm_get_account': {
			const client = sessions.get(args.session)
			const account = await client.tevmGetAccount({
				address: args.address,
				returnStorage: args.includeCachedStorage,
			})
			const storageValue = args.storageSlot
				? await client.getStorageAt({ address: args.address, slot: args.storageSlot })
				: undefined
			return toJsonValue({
				address: account.address,
				balance: account.balance,
				nonce: account.nonce,
				code: account.deployedBytecode,
				codeHash: account.codeHash,
				storageRoot: account.storageRoot,
				isContract: account.isContract,
				isEmpty: account.isEmpty,
				cachedStorage: account.storage,
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
				...(args.storage ? { stateDiff: args.storage } : {}),
			})
			return { updated: true, address: args.address }
		}
		case 'evm_mine': {
			const client = sessions.get(args.session)
			const result = await client.tevmMine({
				blockCount: args.blockCount,
				...(args.intervalSeconds !== undefined ? { interval: args.intervalSeconds } : {}),
			})
			return toJsonValue({
				...result,
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
				client.request({ method: 'txpool_content' }),
				client.request({ method: 'txpool_status' }),
			])
			return toJsonValue({ status, content })
		}
		case 'evm_trace_call': {
			const client = sessions.get(args.session)
			let data = args.data
			if (!data) {
				const resolved = resolveFunction(args.abi, args.signature, args.functionName)
				data = encodeFunctionData({
					abi: resolved.abi,
					functionName: resolved.functionName,
					args: coerceFunctionArgs(resolved.abi, resolved.functionName, args.args),
				})
			}
			const result = await client.tevmCall({
				to: args.address,
				data,
				createTrace: true,
				throwOnFail: false,
				...(args.from ? { from: args.from } : {}),
				...(args.value ? { value: BigInt(args.value) } : {}),
				...(args.gasLimit ? { gas: BigInt(args.gasLimit) } : {}),
			})
			const errors = (result.errors ?? []).map((error) => ({
				name: error.name,
				message: error.message,
			}))
			const steps = result.trace?.structLogs ?? []
			const headCount = Math.ceil(args.maxSteps * 0.7)
			const tailCount = args.maxSteps - headCount
			const selectedSteps =
				steps.length <= args.maxSteps ? steps : [...steps.slice(0, headCount), ...steps.slice(-tailCount)]
			const returnValue = result.trace?.returnValue ?? result.rawData
			return toJsonValue({
				failed: (result.trace?.failed ?? false) || errors.length > 0,
				errors,
				revertReason: errors.length > 0 ? decodeRevertReason(returnValue, args.abi) : undefined,
				gasUsed: result.trace?.gas ?? result.executionGasUsed,
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
