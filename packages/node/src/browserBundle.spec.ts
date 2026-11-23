import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

describe('CommonJS bundle', () => {
	it('loads, drives an injected backend and resolves the native fallback without import.meta.url', async () => {
		// The same transform as the published dist/index.cjs: esbuild compiles import.meta.url to undefined.
		const result = await esbuild.build({
			entryPoints: [fileURLToPath(new URL('./index.js', import.meta.url))],
			alias: { '@tevm/utils': fileURLToPath(new URL('../../utils/src/index.ts', import.meta.url)) },
			platform: 'node',
			bundle: true,
			write: false,
			format: 'cjs',
			logLevel: 'silent',
		})
		expect(result.errors).toEqual([])
		const code = result.outputFiles[0]!.text
		expect(code).toMatch(/import_meta\s*=\s*\{\}/)
		// An empty directory outside any node_modules tree: `@evmts/zevm` is not resolvable from it.
		const directory = mkdtempSync(join(tmpdir(), 'tevm-node-cjs-'))
		try {
			const file = join(directory, 'index.cjs')
			writeFileSync(file, code)
			// A separate plain Node process: no test-runner module hooks and no inherited NODE_PATH.
			const script = join(directory, 'smoke.cjs')
			writeFileSync(
				script,
				`const api = require('./index.cjs')
const sent = []
const engine = api.createZevmEngine({
	backend: {
		rpc: async (json) => {
			const { id, method } = JSON.parse(json)
			sent.push(method)
			return JSON.stringify({ jsonrpc: '2.0', id, result: '0x1' })
		},
		close: () => {},
	},
})
engine.request({ method: 'eth_chainId' }).then(async (result) => {
	await engine.close()
	let fallback
	try {
		api.createZevmEngine()
		fallback = { created: true }
	} catch (error) {
		fallback = { code: error.code, message: error.message, causeCode: error.cause && error.cause.code }
	}
	console.log(JSON.stringify({ result, sent, fallback }))
})
`,
			)
			const { NODE_PATH: _nodePath, ...env } = process.env
			const output = JSON.parse(execFileSync(process.execPath, [script], { cwd: directory, env, encoding: 'utf8' }))
			expect(output.result).toBe('0x1')
			expect(output.sent).toEqual(['eth_chainId'])
			// The fallback reached module resolution: createRequire accepted the CommonJS filename.
			expect(output.fallback.code).not.toBe('ERR_INVALID_ARG_VALUE')
			expect(output.fallback.causeCode).toBe('MODULE_NOT_FOUND')
			expect(output.fallback.message).toMatch(/could not find the optional dependency `@evmts\/zevm`/)
		} finally {
			rmSync(directory, { recursive: true, force: true })
		}
	}, 60_000)
})
