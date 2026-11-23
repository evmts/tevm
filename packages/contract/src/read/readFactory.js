import { formatAbi } from '@tevm/utils'

/**
 * Creates read action creators from contract parameters.
 * This factory function generates a set of typed read action creators for a contract,
 * allowing for easy and type-safe creation of read actions for view and pure functions.
 *
 * @param {object} params - The parameters for creating read action creators.
 * @param {import('@tevm/utils').Abi} params.methods - The ABI of the contract methods.
 * @param {import('@tevm/utils').Abi} params.errors - The ABI of the contract errors.
 * @param {import('@tevm/utils').Hex} [params.code] - The runtime bytecode of the contract (optional).
 * @param {import('@tevm/utils').Address} [params.address] - The address of the deployed contract (optional).
 * @returns {import('./ReadActionCreator.js').ReadActionCreator<any, any, any>} An object containing read action creators for each view and pure function in the ABI.
 *
 * @example
 * ```javascript
 * import { readFactory } from './readFactory.js'
 *
 * const abi = [
 *   {
 *     type: 'function',
 *     name: 'balanceOf',
 *     inputs: [{ type: 'address', name: 'account' }],
 *     outputs: [{ type: 'uint256' }],
 *     stateMutability: 'view'
 *   }
 * ]
 *
 * const readActions = readFactory({
 *   methods: abi,
 *   address: '0x1234...',
 *   code: '0x60806040...'
 * })
 *
 * // Create a read action for the balanceOf function
 * const balanceAction = readActions.balanceOf('0x5678...')
 *
 * // Use the action with tevm
 * const balance = await tevm.contract(balanceAction)
 * console.log('Balance:', balance)
 * ```
 */
export const readFactory = ({ methods, errors, address, code }) => {
	// Overloads share a name; an action's ABI lists only the eligible overloads
	// for that name, so group them once instead of filtering on every call.
	/** @type {Map<string, Array<import('@tevm/utils').AbiFunction>>} */
	const byName = new Map()
	/** @type {Array<import('@tevm/utils').AbiFunction>} */
	const eligibleMethods = []
	for (const item of methods) {
		if (item.type !== 'function') continue
		const fn = /** @type {import('@tevm/utils').AbiFunction} */ (item)
		if (fn.stateMutability !== 'view' && fn.stateMutability !== 'pure') continue
		eligibleMethods.push(fn)
		const existing = byName.get(fn.name)
		if (existing) {
			existing.push(fn)
		} else {
			byName.set(fn.name, [fn])
		}
	}
	/** @type {Record<string, any>} */
	const result = {}
	for (const method of eligibleMethods) {
		const functionName = method.name
		const overloads = /** @type {Array<import('@tevm/utils').AbiFunction>} */ (byName.get(functionName))
		const humanReadableAbi = formatAbi([method])
		/**
		 * Creates a read action for a specific contract method.
		 * @param {...any} args - The arguments for the contract method.
		 * @returns {object} An object representing the read action, including ABI and method information.
		 */
		const creator = (...args) => {
			/** @type {{ abi: import('@tevm/utils').Abi; humanReadableAbi: ReadonlyArray<string>; functionName: string; code?: import('@tevm/utils').Hex; address?: import('@tevm/utils').Address; to?: import('@tevm/utils').Address; args?: Array<any> }} */
			const action = {
				abi: /** @type {import('@tevm/utils').Abi} */ ([...overloads, ...errors]),
				humanReadableAbi,
				functionName,
			}
			if (code !== undefined) action.code = code
			if (address !== undefined) {
				action.address = address
				action.to = address
			}
			// viem and wagmi reject undefined or [] args, so omit args when none are passed.
			if (args.length > 0) action.args = args
			return action
		}
		creator.abi = [method]
		creator.functionName = functionName
		creator.humanReadableAbi = humanReadableAbi
		creator.code = code
		// Omit address/to entirely when no address is set.
		if (address !== undefined) Object.assign(creator, { address, to: address })
		result[functionName] = creator
	}
	return result
}
