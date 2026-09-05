/** Serialize prepared action parameters as safe, editable TypeScript literals.
 * @param {unknown} value
 * @returns {string}
 */
function literal(value) {
	if (typeof value === 'bigint') return `${value}n`
	if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`
	if (value && typeof value === 'object')
		return `{ ${Object.entries(value)
			.map(([key, item]) => `${JSON.stringify(key)}: ${literal(item)}`)
			.join(', ')} }`
	return value === undefined ? 'undefined' : JSON.stringify(value)
}

import { isViemAction } from './clients.js'

/**
 * Create an editor script against the same installed native host as this CLI.
 * @param {string} actionName
 * @param {Record<string, any>} options
 * @param {unknown} params Prepared action parameters, including ABI and bigint values.
 */
export function generateTemplates(actionName, options, params) {
	const viem = isViemAction(actionName)
	/** @type {Record<string, string>} */
	const names = {
		call: 'tevmCall',
		contract: 'tevmContract',
		deploy: 'tevmDeploy',
		'get-account': 'tevmGetAccount',
		'set-account': 'tevmSetAccount',
		'dump-state': 'tevmDumpState',
		'load-state': 'tevmLoadState',
		mine: 'tevmMine',
	}
	const method = names[actionName] ?? actionName
	const setup = viem
		? `import { createPublicClient, http } from 'viem'\nconst client = createPublicClient({ transport: http(${JSON.stringify(options['rpc'] || 'http://127.0.0.1:8545')}) })`
		: `import { createMemoryClient } from '@tevm/memory-client'\nconst client = createMemoryClient(${options['local'] ? '{}' : `{ fork: { url: ${JSON.stringify(options['rpc'] || 'http://127.0.0.1:8545')} }`})`
	const argument = method === 'tevmDumpState' ? '' : method === 'tevmLoadState' ? 'params.state' : 'params'
	return {
		scriptTemplate: `${setup}\nconst params = ${literal(params)}\ntry {\n  const result = await client[${JSON.stringify(method)}](${argument})\n  console.log(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2))\n} finally {\n${viem ? '' : '  await client.tevmClose()\n'}}\n`,
		packageJson: JSON.stringify({ name: 'tevm-native-script', private: true, type: 'module' }, null, 2),
		tsconfigTemplate: JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2022',
					module: 'NodeNext',
					moduleResolution: 'NodeNext',
					noEmit: true,
					skipLibCheck: true,
				},
			},
			null,
			2,
		),
		readmeContent:
			'# Native TEVM script\n\nEdit script.ts, save and close the editor. Dependencies are linked to this CLI installation, so execution uses the same native ZEVM addon. No registry engine is installed.\n',
	}
}
