import { readFileSync } from 'node:fs'
import JSONBig from 'json-bigint'
import { decodeFunctionData, decodeFunctionResult } from 'viem'

const JSON_BIG = JSONBig({
	useNativeBigInt: true,
	alwaysParseAsBig: true,
	protoAction: 'ignore',
	constructorAction: 'ignore',
})

function jsonReplacer(_key: string, value: unknown): unknown {
	if (typeof value === 'bigint') {
		return value.toString()
	}
	if (value instanceof Set) {
		return [...value]
	}
	if (value instanceof Map) {
		return Object.fromEntries(value)
	}
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
		}
	}
	return value
}

export type JsonSuccess = {
	ok: true
	command: string
	result: unknown
	session?: string
}

export type JsonFailure = {
	ok: false
	command: string
	error: {
		message: string
	}
	session?: string
}

type TraceFrame = {
	type?: string
	from?: string
	to?: string
	value?: bigint
	gas?: bigint
	gasUsed?: bigint
	input?: `0x${string}`
	output?: `0x${string}`
	error?: string
	revertReason?: string
	calls?: TraceFrame[]
}

/**
 * Serialize a successful CLI result with the stable TEVM CLI envelope.
 *
 * @example
 * ```ts
 * formatJsonSuccess('get-chain-id', 10n)
 * // {"ok":true,"command":"get-chain-id","result":"10"}
 * ```
 */
export function formatJsonSuccess(command: string, result: unknown, session?: string): string {
	const output: JsonSuccess = {
		ok: true,
		command,
		result,
		...(session ? { session } : {}),
	}
	return JSON_BIG.stringify(output, jsonReplacer, 2)
}

/**
 * Serialize a failed CLI result with the stable TEVM CLI envelope.
 *
 * @example
 * ```ts
 * formatJsonFailure('call', new Error('execution reverted'))
 * ```
 */
export function formatJsonFailure(command: string, error: unknown, session?: string): string {
	const message = (() => {
		if (error instanceof Error) {
			return error.message
		}
		if (error && typeof error === 'object') {
			if ('message' in error && typeof error.message === 'string') {
				return error.message
			}
			if ('shortMessage' in error && typeof error.shortMessage === 'string') {
				return error.shortMessage
			}
			return JSON_BIG.stringify(error, jsonReplacer)
		}
		return String(error)
	})()
	const output: JsonFailure = {
		ok: false,
		command,
		error: {
			message,
		},
		...(session ? { session } : {}),
	}
	return JSON_BIG.stringify(output, jsonReplacer, 2)
}

function loadAbi(abiOption: unknown): readonly unknown[] | undefined {
	if (typeof abiOption !== 'string' || abiOption.length === 0) {
		return undefined
	}
	try {
		const source = abiOption.trim().startsWith('[') ? abiOption : readFileSync(abiOption, 'utf8')
		const parsed = JSON.parse(source)
		return Array.isArray(parsed) ? parsed : undefined
	} catch {
		return undefined
	}
}

function formatArgument(value: unknown): string {
	if (typeof value === 'bigint') {
		return value.toString()
	}
	if (typeof value === 'string') {
		return JSON.stringify(value)
	}
	return JSON_BIG.stringify(value)
}

function decodeFrame(frame: TraceFrame, abi: readonly unknown[] | undefined): string | undefined {
	if (!abi || !frame.input || frame.input === '0x') {
		return undefined
	}
	try {
		const decoded = decodeFunctionData({ abi: abi as any, data: frame.input })
		const call = `${decoded.functionName}(${(decoded.args ?? []).map(formatArgument).join(', ')})`
		if (!frame.output || frame.output === '0x' || frame.error) {
			return call
		}
		try {
			const output = decodeFunctionResult({
				abi: abi as any,
				functionName: decoded.functionName,
				data: frame.output,
			})
			return `${call} => ${formatArgument(output)}`
		} catch {
			return call
		}
	} catch {
		return undefined
	}
}

function renderFrame(
	frame: TraceFrame,
	abi: readonly unknown[] | undefined,
	prefix: string,
	isLast: boolean,
	isRoot: boolean,
): string[] {
	const branch = isRoot ? '' : isLast ? '└─ ' : '├─ '
	const decoded = decodeFrame(frame, abi)
	const selector = frame.input?.slice(0, 10)
	const call =
		decoded ?? `${frame.type ?? 'CALL'} ${frame.to ?? '<create>'}${selector && selector !== '0x' ? ` ${selector}` : ''}`
	const gas = frame.gasUsed === undefined ? '' : ` [gas ${frame.gasUsed.toString()}]`
	const failure = frame.revertReason ? ` REVERT ${frame.revertReason}` : frame.error ? ` ERROR ${frame.error}` : ''
	const lines = [`${prefix}${branch}${call}${gas}${failure}`]
	const children = frame.calls ?? []
	const childPrefix = isRoot ? '' : `${prefix}${isLast ? '   ' : '│  '}`
	for (const [index, child] of children.entries()) {
		lines.push(...renderFrame(child, abi, childPrefix, index === children.length - 1, false))
	}
	return lines
}

/**
 * Render a call-tracer result as a compact tree with decoded calls, gas, and revert reasons.
 *
 * @example
 * ```ts
 * renderCallTrace({ type: 'CALL', to: '0xabc', input: '0x', gasUsed: 21000n })
 * // CALL 0xabc [gas 21000]
 * ```
 */
export function renderCallTrace(trace: TraceFrame, abiOption?: unknown): string {
	return renderFrame(trace, loadAbi(abiOption), '', true, true).join('\n')
}

/**
 * Format a result for human-readable terminal output.
 *
 * @example
 * ```ts
 * formatHumanResult('get-chain-id', 10n)
 * // 10
 * ```
 */
export function formatHumanResult(command: string, result: unknown, options: Record<string, unknown>): string {
	if (
		command === 'call' &&
		typeof result === 'object' &&
		result !== null &&
		'trace' in result &&
		(result as { trace?: unknown }).trace
	) {
		return renderCallTrace((result as { trace: TraceFrame }).trace, options['abi'])
	}
	if (typeof result === 'string') {
		return result
	}
	if (typeof result === 'bigint') {
		return result.toString()
	}
	return JSON_BIG.stringify(result, jsonReplacer, 2)
}
