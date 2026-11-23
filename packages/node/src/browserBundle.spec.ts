import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

// esbuild is the bundler behind this package's build tool. Resolve it through tsup, a declared
// root devDependency, instead of relying on pnpm hoisting.
type Import = { path: string; external?: boolean }
type BuildResult = {
	errors: unknown[]
	outputFiles: { text: string }[]
	metafile: { inputs: Record<string, { imports: Import[] }>; outputs: Record<string, { imports: Import[] }> }
}
const require = createRequire(import.meta.url)
const esbuild: { build: (options: Record<string, unknown>) => Promise<BuildResult> } = createRequire(
	require.resolve('tsup/package.json'),
)('esbuild')

const bundle = async () => {
	const result = await esbuild.build({
		entryPoints: [fileURLToPath(new URL('./index.js', import.meta.url))],
		// Same source alias as vitest.config.ts, so the bundle contains this checkout's @tevm/utils.
		alias: { '@tevm/utils': fileURLToPath(new URL('../../utils/src/index.ts', import.meta.url)) },
		platform: 'browser',
		bundle: true,
		write: false,
		format: 'iife',
		globalName: 'TevmNode',
		metafile: true,
		logLevel: 'silent',
	})
	return { code: result.outputFiles[0]!.text, metafile: result.metafile, errors: result.errors }
}

/** A browser-like realm: no `process`, no `require`, and timers that are plain numbers. */
const browserRealm = (code: string) => {
	const timers = new Map<number, () => void>()
	let nextTimer = 0
	const realm: Record<string, unknown> = {
		console,
		TextDecoder,
		TextEncoder,
		setInterval: (callback: () => void) => {
			timers.set(++nextTimer, callback)
			return nextTimer
		},
		clearInterval: (timer: number) => void timers.delete(timer),
		setTimeout,
		clearTimeout,
	}
	runInNewContext(`${code}\nglobalThis.TevmNode = TevmNode`, realm)
	return { api: realm['TevmNode'] as typeof import('./index.js'), timers }
}

describe('browser bundle', () => {
	it('bundles for the browser with zero node: imports and no external modules', async () => {
		// esbuild fails a browser build that statically imports an unresolved node: built-in.
		const { code, metafile, errors } = await bundle()
		expect(errors).toEqual([])
		expect(Object.keys(metafile.inputs).filter((input) => input.startsWith('node:'))).toEqual([])
		for (const input of Object.values(metafile.inputs))
			expect(input.imports.filter(({ path, external }) => external || path.startsWith('node:'))).toEqual([])
		for (const output of Object.values(metafile.outputs)) expect(output.imports).toEqual([])
		expect(code).not.toMatch(/\b(?:from|import|require)\s*\(?\s*["'`]node:/)
		// The only mention of a built-in is the guarded runtime lookup.
		expect([...new Set(code.match(/node:[a-z_/]+/g))]).toEqual(['node:module'])
		expect(code).toMatch(/getBuiltinModule\(\s*["']node:module["']\s*\)/)
	}, 60_000)

	it('executes in a realm without process, driving an injected WASM-style backend', async () => {
		const { api, timers } = browserRealm((await bundle()).code)
		let head = 0
		let closed = false
		const backend = {
			rpc: async (json: string) => {
				const { id, method, params } = JSON.parse(json)
				const result =
					method === 'eth_chainId'
						? '0x1'
						: method === 'eth_blockNumber'
							? `0x${head.toString(16)}`
							: method === 'evm_mine'
								? `0x${(++head).toString(16)}`
								: { number: params[0] }
				return JSON.stringify({ jsonrpc: '2.0', id, result })
			},
			close: () => {
				closed = true
			},
		}
		const engine = api.createZevmEngine({ backend, chainId: 1 })
		expect(await engine.request({ method: 'eth_chainId' })).toBe('0x1')
		// A browser timer is a number without unref(): subscribing must not throw.
		const blocks: unknown[] = []
		engine.events.on('block', (block) => blocks.push(block))
		expect(timers.size).toBe(1)
		await engine.request({ method: 'eth_blockNumber' })
		await engine.request({ method: 'evm_mine' })
		expect(blocks).toEqual([{ number: '0x1' }])
		await expect(engine.request({ method: 'eth_chainId', id: 99, jsonrpc: '1.0' } as never)).resolves.toBe('0x1')
		await engine.close()
		expect(closed).toBe(true)
		expect(timers.size).toBe(0)
	}, 60_000)

	it('tells browser and WASM users to pass a backend when the native addon cannot load', async () => {
		const { api } = browserRealm((await bundle()).code)
		expect(() => api.createZevmEngine()).toThrow(/browser or WASM host, pass a `backend`/)
		expect(new api.NativeRpcError({ code: 3, message: 'execution reverted', data: '0x' })).toMatchObject({
			code: 3,
			data: '0x',
		})
	}, 60_000)
})
