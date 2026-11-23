import { needsExportAlias } from './needsExportAlias.js'

/**
 * @typedef {object} ContractBindings
 * @property {string} name - The Solidity contract name, which is also the export name
 * @property {string} binding - The module-level binding that holds the contract
 * @property {boolean} aliased - Whether the binding is exported as `export { binding as name }`
 * @property {Record<string, string>} locals - Internal binding for each requested prefix
 */

/**
 * @typedef {object} ModuleBindings
 * @property {boolean} exportsArtifacts - False when a contract named `artifacts` owns that export
 * @property {ContractBindings[]} contracts - Bindings in artifact order
 */

/**
 * Chooses collision-free binding names for a generated contract module.
 *
 * Every Solidity identifier is a valid contract name, so naive internal names collide:
 * contracts `A` and `_A` both want the local `_A`, and a contract named `artifacts`
 * collides with the solc `artifacts` export. Exported contract names are claimed first,
 * then each internal name gains leading underscores until it is unique. Ordinary
 * contracts keep their historical `${prefix}${name}` locals.
 *
 * A contract named `artifacts` keeps its export, and the module omits the solc artifacts export.
 *
 * @param {ReadonlyArray<string>} contractNames - Contract names in artifact order
 * @param {ReadonlyArray<string>} localPrefixes - Prefixes of the internal bindings each contract needs
 * @returns {ModuleBindings}
 * @example
 * ```javascript
 * planContractBindings(['A', '_A'], ['_']).contracts.map((c) => c.locals._) // ['__A', '___A']
 * ```
 * @internal
 */
export const planContractBindings = (contractNames, localPrefixes) => {
	const exportsArtifacts = !contractNames.includes('artifacts')
	const taken = new Set(['createContract', 'Contract'])
	if (exportsArtifacts) taken.add('artifacts')
	for (const name of contractNames) {
		if (!needsExportAlias(name)) taken.add(name)
	}
	/** @param {string} base */
	const claim = (base) => {
		let candidate = base
		while (taken.has(candidate)) candidate = `_${candidate}`
		taken.add(candidate)
		return candidate
	}
	const exported = contractNames.map((name) => {
		const aliased = needsExportAlias(name)
		return { name, aliased, binding: aliased ? claim(`_tevm_${name}`) : name }
	})
	return {
		exportsArtifacts,
		contracts: exported.map((contract) => ({
			...contract,
			locals: Object.fromEntries(localPrefixes.map((prefix) => [prefix, claim(`${prefix}${contract.name}`)])),
		})),
	}
}
