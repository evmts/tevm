import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseAbi } from 'viem'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryClient } from './createMemoryClient.js'
import type { MemoryClient } from './MemoryClient.js'

const clients: MemoryClient[] = []
afterEach(async () => {
	await Promise.all(clients.splice(0).map((client) => client.tevmClose()))
})

function findVerifiedWasmBytes(): Uint8Array | null {
	const candidates = [
		process.env.ZEVM_WASM_PATH,
		fileURLToPath(new URL('../../../../zevm/npm/zevm/src/zevm.wasm', import.meta.url)),
		fileURLToPath(new URL('../../../../zevm/zig-out/npm/browser/zevm.wasm', import.meta.url)),
	].filter((p): p is string => Boolean(p))

	for (const candidate of candidates) {
		if (!existsSync(candidate)) continue
		try {
			const bytes = new Uint8Array(readFileSync(candidate))
			const mod = new WebAssembly.Module(bytes)
			const allowedEnv = new Set(['js_opcode_callback', 'js_precompile_callback'])
			const unresolved = WebAssembly.Module.imports(mod).filter(
				(imp) => imp.module === 'env' && !allowedEnv.has(imp.name),
			)
			if (unresolved.length === 0) return bytes
		} catch {
			// Try the next candidate.
		}
	}
	return null
}

const verifiedWasmBytes = findVerifiedWasmBytes()

describe.skipIf(!verifiedWasmBytes)('MemoryClient over compiled zevm.wasm', () => {
	const bytes = verifiedWasmBytes!

	it('deploys a contract, executes ABI calls, deals ETH, and closes cleanly via WASM', async () => {
		const client = createMemoryClient({ wasm: bytes })
		clients.push(client)

		expect(await client.getChainId()).toBe(31337)
		expect(await client.getBlockNumber()).toBe(0n)

		// Init bytecode that deploys runtime bytecode returning uint256(42).
		const deployed = await client.tevmDeploy({
			bytecode: '0x600a600c600039600a6000f3602a60005260206000f3',
		})
		expect(deployed.createdAddress).toMatch(/^0x[0-9a-f]{40}$/i)

		const callResult = await client.tevmContract({
			address: deployed.createdAddress!,
			abi: parseAbi(['function answer() view returns (uint256)']),
			functionName: 'answer',
		})
		expect(callResult.data).toBe(42n)

		const recipient = '0x000000000000000000000000000000000000beef'
		await client.tevmDeal({ address: recipient, amount: 5_000_000_000_000_000_000n })
		expect(await client.getBalance({ address: recipient })).toBe(5_000_000_000_000_000_000n)

		await client.tevmClose()
		await expect(client.getBlockNumber()).rejects.toThrow('engine is closed')
	})
})
