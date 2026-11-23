import { formatAbi } from 'abitype'
import { succeed } from 'effect/Effect'
import { planContractBindings } from './planContractBindings.js'

/** @param {string | null | undefined} value */
const escapeJSDoc = (value) =>
	String(value ?? '')
		.replace(/\*\//g, '*\\/')
		.replace(/\r?\n/g, '\n * ')

/**
 * Generates TypeScript declaration file (.d.ts) content for Tevm contracts.
 *
 * This function creates TypeScript type declarations for Solidity contracts,
 * including proper typing for the contract name, ABI, and optionally bytecode.
 * It also includes NatSpec documentation as JSDoc comments.
 *
 * @param {import("@tevm/compiler").Artifacts} artifacts - Compiled Solidity artifacts
 *   containing ABI, bytecode, and other contract information
 * @param {boolean} includeBytecode - Whether to include bytecode in the type definitions,
 *   true for deployable contracts, false for interface-only contracts
 * @returns {import('effect/Effect').Effect<string, never, never>} - Effect that
 *   resolves to the generated TypeScript declaration file content as a string
 *
 * @example
 * ```javascript
 * import { generateDtsBody } from '@tevm/runtime'
 * import { runPromise } from 'effect/Effect'
 *
 * // Generate TypeScript declaration file content
 * const dtsContent = await runPromise(
 *   generateDtsBody(
 *     artifacts, // Solidity compilation results
 *     true       // Include bytecode
 *   )
 * )
 *
 * console.log(dtsContent)
 * ```
 *
 * @internal This function is primarily used by generateTevmBody
 */
export const generateDtsBody = (artifacts, includeBytecode) => {
	const { exportsArtifacts, contracts } = planContractBindings(Object.keys(artifacts), ['_name', '_abi'])
	return succeed(
		`
			${Object.entries(artifacts)
				.flatMap(([contractName, { abi, userdoc = {}, evm }], i) => {
					const { binding, aliased, locals } = /** @type {import('./planContractBindings.js').ContractBindings} */ (
						contracts[i]
					)
					const nameType = locals['_name']
					const abiType = locals['_abi']
					// Human-readable signatures omit the anonymous flag, just as in the runtime generator.
					const abiLiteral = abi.some((item) => item.type === 'event' && item.anonymous) ? abi : formatAbi(abi)

					// Generate JSDoc from NatSpec comments
					const natspec = Object.entries(userdoc.methods ?? {}).map(
						([method, { notice }]) => ` * @property ${escapeJSDoc(method)} ${escapeJSDoc(notice)}`,
					)

					// Add contract-level notice if available
					if (userdoc.notice) {
						natspec.unshift(` * @notice ${escapeJSDoc(userdoc.notice)}`)
					}

					// Reserved words such as `class` are valid Solidity contract names but cannot be
					// declared with `export const`. Declare them under an internal name and alias the export.
					const declaration = aliased ? `declare const ${binding}` : `export const ${contractName}`
					const aliasExport = aliased ? `export { ${binding} as ${contractName} };` : ''

					// Generate type declaration for contracts with bytecode
					if (includeBytecode) {
						// biome-ignore lint/suspicious/noTemplateCurlyInString: generates TypeScript template literal type
						const bytecodeType = evm?.bytecode?.object && evm.bytecode.object !== '' ? '`0x${string}`' : 'undefined'
						const deployedBytecodeType =
							// biome-ignore lint/suspicious/noTemplateCurlyInString: generates TypeScript template literal type
							evm?.deployedBytecode?.object && evm.deployedBytecode.object !== '' ? '`0x${string}`' : 'undefined'
						const bytecodeLabel =
							bytecodeType === 'undefined' && deployedBytecodeType === 'undefined' ? 'no bytecode' : 'with bytecode'
						return [
							// Define constants for name and ABI with const assertions for type safety
							`declare const ${nameType}: ${JSON.stringify(contractName, null, 2)};`,
							`declare const ${abiType}: readonly ${JSON.stringify(abiLiteral, null, 2)};`,

							// JSDoc comments for the contract
							'/**',
							` * ${contractName} Contract (${bytecodeLabel})`,
							...natspec,
							' * @see [contract docs](https://tevm.sh/learn/contracts/) for more documentation',
							' */',

							// Type declaration for the contract
							`${declaration}: Contract<`,
							`  typeof ${nameType},`, // Contract name
							`  typeof ${abiType},`, // ABI
							'  undefined,', // Address placeholder
							`  ${bytecodeType},`, // Bytecode
							`  ${deployedBytecodeType},`, // Deployed bytecode
							'  undefined', // Additional data - removed trailing comma
							'>;',
							aliasExport,
						].filter(Boolean)
					}

					// Generate type declaration for interface-only contracts (no bytecode)
					return [
						// Define constants for ABI and name with const assertions
						`declare const ${abiType}: readonly ${JSON.stringify(abiLiteral)};`,
						`declare const ${nameType}: ${JSON.stringify(contractName)};`,

						// JSDoc comments for the contract
						'/**',
						` * ${contractName} Contract (no bytecode)`,
						` * change file name or add file that ends in '.s.sol' extension if you wish to compile the bytecode`,
						' * @see [contract docs](https://tevm.sh/learn/contracts/) for more documentation',
						...natspec,
						' */',

						// Type declaration for the contract (without bytecode)
						`${declaration}: Contract<typeof ${nameType}, typeof ${abiType}, undefined, undefined, undefined, undefined>;`,
						aliasExport,
					].filter(Boolean)
				})
				.join('\n')}
${exportsArtifacts ? `// solc artifacts of compilation\nexport declare const artifacts: ${JSON.stringify(artifacts, null, 2)};\n` : ''}`,
	)
}
