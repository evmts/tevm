import { readFileSync } from 'node:fs'
import type { Abi } from 'viem'

/** Load a JSON ABI from inline JSON or a file. */
export function parseCliAbi(value: string | undefined): Abi {
	if (!value) return []
	const abi = JSON.parse(value.trim().startsWith('[') ? value : readFileSync(value, 'utf8'))
	if (!Array.isArray(abi)) throw new Error('ABI must be a JSON array')
	return abi
}
