import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { createWasmBackend } from './createWasmBackend.js'
import { createZevmEngine } from './createZevmEngine.js'
import { NativeRpcError } from './NativeRpcError.js'
import type { ZevmEngine } from './ZevmEngine.js'

const engines: ZevmEngine[] = []
afterEach(async () => {
	await Promise.all(engines.splice(0).map((engine) => engine.close()))
})

/**
 * Locate a compiled `zevm.wasm` reactor binary if built or provided via `ZEVM_WASM_PATH`.
 * Verifies the module has no unresolved external crypto imports before running live WASM tests.
 */
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

describe('WASM backend validation and lifecycle', () => {
	it('rejects passing both backend and wasm options', () => {
		expect(() =>
			createZevmEngine({
				backend: { rpc: () => '{}', close: () => {} },
				wasm: true,
			}),
		).toThrow(TypeError)
	})

	it('rejects invalid wasm option values synchronously', () => {
		expect(() => createZevmEngine({ wasm: /** @type {any} */ ('not-wasm') })).toThrow(TypeError)
		expect(() => createZevmEngine({ wasm: /** @type {any} */ (123) })).toThrow(TypeError)
		expect(() => createZevmEngine({ wasm: /** @type {any} */ ({}) })).toThrow(TypeError)
	})

	it('validates createWasmBackend options before loading WASM', async () => {
		await expect(createWasmBackend({ chainId: 0 })).rejects.toThrow(TypeError)
		await expect(createWasmBackend({ chainId: -1 })).rejects.toThrow(TypeError)
		await expect(createWasmBackend({ chainId: 1.5 })).rejects.toThrow(TypeError)
		await expect(createWasmBackend({ wasm: /** @type {any} */ ('invalid') })).rejects.toThrow(TypeError)
	})

	it('surfaces initialization errors cleanly when invalid wasm bytes are provided', async () => {
		const engine = createZevmEngine({ wasm: new Uint8Array([0, 1, 2, 3]) })
		engines.push(engine)
		let closedCount = 0
		engine.events.on('close', () => {
			closedCount += 1
		})
		await expect(engine.ready()).rejects.toThrow()
		await expect(engine.request({ method: 'eth_chainId' })).rejects.toThrow()
		expect(closedCount).toBe(1)
	})
})

describe.skipIf(!verifiedWasmBytes)('compiled zevm.wasm end-to-end execution', () => {
	const bytes = verifiedWasmBytes!

	it('executes eth_chainId, contract deployment, eth_call, and reverts through compiled zevm.wasm', async () => {
		const compiled = await WebAssembly.compile(bytes)
		const engine = createZevmEngine({ wasm: compiled })
		const custom = createZevmEngine({ wasm: compiled, chainId: 10 })
		engines.push(engine, custom)

		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x7a69')
		expect(await custom.request({ method: 'eth_chainId' })).toBe('0xa')

		// Install runtime bytecode that returns uint256(42) and execute a real eth_call.
		const target = '0x0000000000000000000000000000000000000123'
		await engine.request({ method: 'anvil_setCode', params: [target, '0x602a60005260206000f3'] })
		const result = await engine.request({ method: 'eth_call', params: [{ to: target }, 'latest'] })
		expect(result).toBe(`0x${'00'.repeat(31)}2a`)

		// Separate WASM engine instances own completely isolated chain state.
		expect(await custom.request({ method: 'eth_getCode', params: [target, 'latest'] })).toBe('0x')

		// Install a reverting contract (PUSH1 0x00 PUSH1 0x00 REVERT) and verify NativeRpcError code 3.
		const reverter = '0x0000000000000000000000000000000000000456'
		await engine.request({ method: 'anvil_setCode', params: [reverter, '0x60006000fd'] })
		await expect(engine.request({ method: 'eth_call', params: [{ to: reverter }, 'latest'] })).rejects.toMatchObject({
			name: 'NativeRpcError',
			code: 3,
		})

		// Raw JSON-RPC batch, notification, and RFC 8259 NUL-byte parse error guard.
		const batch = JSON.parse(
			(await engine.rpc(
				JSON.stringify([
					{ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
					{ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] },
				]),
			))!,
		)
		expect(batch).toEqual([
			{ jsonrpc: '2.0', id: 1, result: '0x7a69' },
			{ jsonrpc: '2.0', id: 2, result: '0x0' },
		])
		expect(await engine.rpc(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber' }))).toBeNull()
		expect(JSON.parse((await engine.rpc('{"jsonrpc":"2.0","id":1,"method":"eth_chainId\0"}'))!)).toEqual({
			jsonrpc: '2.0',
			id: null,
			error: { code: -32700, message: 'Parse error' },
		})

		await engine.close()
		await expect(engine.request({ method: 'eth_chainId' })).rejects.toThrow('engine is closed')
	})

	it('creates a standalone ZevmBackend via createWasmBackend and rejects unknown methods with NativeRpcError', async () => {
		const backend = await createWasmBackend({ chainId: 1, wasm: bytes })
		const engine = createZevmEngine({ backend, chainId: 1 })
		engines.push(engine)

		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x1')
		await expect(engine.request({ method: 'eth_nonExistentMethod' })).rejects.toBeInstanceOf(NativeRpcError)
		await expect(engine.request({ method: 'eth_nonExistentMethod' })).rejects.toMatchObject({ code: -32601 })
	})
})
