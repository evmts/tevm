import { formatAbi } from 'abitype'
import { succeed } from 'effect/Effect'
import { generateDtsBody } from './generateTevmBodyDts.js'
import { planContractBindings } from './planContractBindings.js'
import { toObjectLiteral } from './toObjectLiteral.js'

/** @param {string | null | undefined} value */
const escapeJSDoc = (value) =>
	String(value ?? '')
		.replace(/\*\//g, '*\\/')
		.replace(/\r?\n/g, '\n * ')

/**
 * Generates the body of a JavaScript/TypeScript module for Tevm contracts.
 *
 * This function transforms Solidity compilation artifacts into JavaScript/TypeScript code
 * that creates Tevm Contract objects. It handles different output formats (cjs, ts, mjs)
 * and can include or exclude bytecode based on the provided options.
 *
 * For TypeScript declaration files (.d.ts), it delegates to generateDtsBody
 * which creates appropriate type definitions.
 *
 * @param {import("@tevm/compiler").Artifacts} artifacts - Compiled Solidity artifacts
 *   containing ABI, bytecode, and other contract information
 * @param {import('./types.js').ModuleType} moduleType - The target module format
 *   ('cjs', 'dts', 'ts', or 'mjs')
 * @param {boolean} includeBytecode - Whether to include bytecode in the output,
 *   true for script/deployable contracts, false for interface-only contracts
 * @returns {import('effect/Effect').Effect<string, never, never>} - Effect that
 *   resolves to the generated module body code as a string
 *
 * @example
 * ```javascript
 * import { generateTevmBody } from '@tevm/runtime'
 * import { runPromise } from 'effect/Effect'
 *
 * // Generate the body of a TypeScript module
 * const body = await runPromise(
 *   generateTevmBody(
 *     artifacts, // Solidity compilation results
 *     'ts',      // Generate TypeScript code
 *     true       // Include bytecode
 *   )
 * )
 *
 * console.log(body)
 * ```
 *
 * @internal This function is primarily used by generateRuntime
 */
export const generateTevmBody = (artifacts, moduleType, includeBytecode) => {
	// For TypeScript declaration files, delegate to generateDtsBody
	if (moduleType === 'dts') {
		return generateDtsBody(artifacts, includeBytecode)
	}

	const { exportsArtifacts, contracts } = planContractBindings(Object.keys(artifacts), ['_'])
	const artifactsLiteral = toObjectLiteral(artifacts)

	// Generate JavaScript/TypeScript code for the contracts
	return succeed(
		Object.values(artifacts)
			.flatMap(({ abi, userdoc = {}, evm }, i) => {
				const {
					name: contractName,
					binding,
					aliased,
					locals,
				} = /** @type {import('./planContractBindings.js').ContractBindings} */ (contracts[i])
				const config = /** @type {string} */ (locals['_'])
				// Create the contract configuration object
				const contract = toObjectLiteral({
					name: contractName,
					humanReadableAbi: formatAbi(abi),
					// Include bytecode if requested and available (checking for empty string for interfaces)
					...(includeBytecode
						? {
								bytecode: evm?.bytecode?.object && evm.bytecode.object !== '' ? `0x${evm.bytecode.object}` : undefined,
								deployedBytecode:
									evm?.deployedBytecode?.object && evm.deployedBytecode.object !== ''
										? `0x${evm.deployedBytecode.object}`
										: undefined,
							}
						: {}),
				})

				// Generate JSDoc documentation from NatSpec comments
				const natspec = Object.entries(userdoc.methods ?? {}).map(
					([method, { notice }]) => ` * @property ${escapeJSDoc(method)} ${escapeJSDoc(notice)}`,
				)

				// Add contract-level documentation if available
				if (userdoc.notice) {
					natspec.unshift(` * ${escapeJSDoc(userdoc.notice)}`)
				}

				// Add link to additional documentation
				natspec.push(' * @see [contract docs](https://tevm.sh/learn/contracts/) for more documentation')
				natspec.unshift('/**')
				natspec.push(' */')

				const emitArtifacts = i === 0 && exportsArtifacts

				// Generate CommonJS format
				if (moduleType === 'cjs') {
					// Assigning `module.exports.__proto__` would replace the prototype of `exports`
					const exportCjs =
						contractName === '__proto__'
							? `Object.defineProperty(module.exports, '__proto__', { value: createContract(${config}), enumerable: true, writable: true, configurable: true });`
							: `module.exports.${contractName} = createContract(${config});`
					return [
						`const ${config} = ${contract};`,
						...natspec,
						exportCjs,
						emitArtifacts ? `module.exports.artifacts = ${artifactsLiteral};` : '',
					]
				}

				// Reserved words such as `class` are valid Solidity contract names but cannot be
				// declared with `export const`. Declare them under an internal name and alias the export.
				const exportContract = aliased
					? [`const ${binding} = createContract(${config});`, `export { ${binding} as ${contractName} };`]
					: [`export const ${contractName} = createContract(${config});`]

				// Generate TypeScript format with const assertion
				if (moduleType === 'ts') {
					return [
						`const ${config} = ${contract} as const`,
						...natspec,
						...exportContract,
						emitArtifacts ? `export const artifacts = ${artifactsLiteral};` : '',
					]
				}

				// Generate ES module format
				return [
					`const ${config} = ${contract};`,
					...natspec,
					...exportContract,
					emitArtifacts ? `export const artifacts = ${artifactsLiteral};` : '',
				]
			})
			.join('\n'),
	)
}
