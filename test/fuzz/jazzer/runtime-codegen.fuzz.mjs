import { FuzzedDataProvider } from '@jazzer.js/core'
import { generateRuntime } from '@tevm/runtime'
import ts from 'typescript'
import { runPromiseExit } from '../../../packages/effect/node_modules/effect/dist/esm/Effect.js'

const MODULE_TYPES = ['ts', 'mjs', 'cjs', 'dts']

/**
 * Coverage-guided LibFuzzer target proving @tevm/runtime code generation
 * always produces syntactically valid JS/TS/DTS regardless of hostile NatSpec
 * comments, newlines, or comment-closing sequences.
 * @param {Buffer} data
 */
export async function fuzz(data) {
	const provider = new FuzzedDataProvider(data)
	const moduleType = MODULE_TYPES[provider.consumeIntegralInRange(0, MODULE_TYPES.length - 1)]
	const includeBytecode = provider.consumeBoolean()
	const notice = provider.consumeString(64)
	const methodNotice = provider.consumeRemainingAsString()

	const artifacts = {
		FuzzContract: {
			abi: [
				{
					type: 'function',
					name: 'ping',
					stateMutability: 'view',
					inputs: [{ name: 'x', type: 'uint256' }],
					outputs: [{ name: '', type: 'uint256' }],
				},
			],
			userdoc: {
				kind: 'user',
				version: 1,
				notice,
				methods: {
					'ping(uint256)': { notice: methodNotice },
				},
			},
			evm: {
				bytecode: { object: '6000' },
				deployedBytecode: { object: '6000' },
			},
		},
	}

	const exit = await runPromiseExit(generateRuntime(artifacts, moduleType, includeBytecode, '@tevm/contract'))
	if (exit._tag !== 'Success') {
		throw new Error(`generateRuntime failed unexpectedly for ${moduleType}`)
	}
	const code = exit.value
	const kind = moduleType === 'ts' || moduleType === 'dts' ? ts.ScriptKind.TS : ts.ScriptKind.JS
	const sf = ts.createSourceFile('fuzz.ts', code, ts.ScriptTarget.ESNext, true, kind)
	const diags = sf.parseDiagnostics ?? []
	if (diags.length > 0) {
		throw new Error(
			`Generated ${moduleType} has syntax errors: ${diags.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`,
		)
	}
}
