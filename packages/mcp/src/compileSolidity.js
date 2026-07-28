import solc from 'solc'

/**
 * Compiles one Solidity source file with the bundled solc compiler.
 *
 * @param {{source: string, contractName?: string, optimize?: boolean}} input - Solidity source and compiler options.
 * @returns {{contractName: string, abi: Array<Record<string, unknown>>, bytecode: `0x${string}`, deployedBytecode: `0x${string}`, compilerVersion: string, warnings: string[]}} The selected contract artifact.
 *
 * @example
 * ```js
 * import { compileSolidity } from '@tevm/mcp'
 *
 * const artifact = compileSolidity({
 *   source: 'contract Counter { uint public count; }',
 *   contractName: 'Counter',
 * })
 * console.log(artifact.bytecode)
 * ```
 */
export const compileSolidity = (input) => {
	const compilerInput = {
		language: 'Solidity',
		sources: {
			'Contract.sol': {
				content: input.source,
			},
		},
		settings: {
			optimizer: {
				enabled: input.optimize ?? true,
				runs: 200,
			},
			outputSelection: {
				'*': {
					'*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
				},
			},
		},
	}
	/** @type {any} */
	const output = JSON.parse(solc.compile(JSON.stringify(compilerInput)))
	/** @type {Array<{severity: string, formattedMessage: string}>} */
	const diagnostics = Array.isArray(output.errors) ? output.errors : []
	const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
	if (errors.length > 0) {
		throw new Error(`Solidity compilation failed:\n${errors.map((error) => error.formattedMessage).join('\n')}`)
	}
	const contracts = output.contracts?.['Contract.sol']
	if (!contracts || Object.keys(contracts).length === 0) {
		throw new Error('Solidity compilation produced no contracts')
	}
	const contractName = input.contractName ?? Object.keys(contracts).sort()[0]
	if (!contractName) {
		throw new Error('Solidity compilation produced no named contracts')
	}
	const contract = contracts[contractName]
	if (!contract) {
		throw new Error(
			`Contract "${contractName}" was not found. Available contracts: ${Object.keys(contracts).join(', ')}`,
		)
	}
	const bytecode = contract.evm?.bytecode?.object
	const deployedBytecode = contract.evm?.deployedBytecode?.object
	if (typeof bytecode !== 'string' || bytecode.length === 0) {
		throw new Error(`Contract "${contractName}" has no deployable bytecode`)
	}
	return {
		contractName,
		abi: contract.abi,
		bytecode: `0x${bytecode}`,
		deployedBytecode: `0x${deployedBytecode ?? ''}`,
		compilerVersion: solc.version(),
		warnings: diagnostics
			.filter((diagnostic) => diagnostic.severity === 'warning')
			.map((diagnostic) => diagnostic.formattedMessage),
	}
}
