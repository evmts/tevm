/**
 * Executes the TypeScript pane's code against the real tevm + viem modules
 * bundled into this page. Import statements are resolved against a static
 * module map (this is a playground, not a bundler), then the remaining body
 * runs as an async function with console output captured.
 */
import * as tevm from 'tevm'
import * as tevmCommon from 'tevm/common'
import * as viem from 'viem'

const moduleMap: Record<string, Record<string, unknown>> = {
	tevm: tevm as never,
	'tevm/common': tevmCommon as never,
	viem: viem as never,
}

export interface RunLine {
	kind: 'log' | 'error' | 'info'
	text: string
}

const stringify = (v: unknown): string => {
	if (typeof v === 'string') return v
	if (typeof v === 'bigint') return `${v}n`
	if (v instanceof Error) return v.stack ?? v.message
	try {
		return JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? `${x}n` : x), 2) ?? String(v)
	} catch {
		return String(v)
	}
}

const IMPORT_RE = /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm

export async function runCode(
	code: string,
	onLine: (line: RunLine) => void,
	timeoutMs = 90_000,
): Promise<void> {
	const names: string[] = []
	const values: unknown[] = []
	const body = code.replace(IMPORT_RE, (_m, imports: string, mod: string) => {
		const source = moduleMap[mod]
		if (!source) throw new Error(`This playground can only import from: ${Object.keys(moduleMap).join(', ')} (got '${mod}')`)
		for (const part of imports.split(',')) {
			const spec = part.trim()
			if (!spec) continue
			const [orig, alias] = spec.split(/\s+as\s+/).map((s) => s.trim())
			if (!(orig in source)) throw new Error(`'${orig}' is not exported by '${mod}'`)
			names.push(alias ?? orig)
			values.push(source[orig])
		}
		return ''
	})

	// Strip the TypeScript-only syntax used by the complete examples so the
	// body can execute as JavaScript without shipping a second compiler.
	const js = body.replace(/([\w)\]])!(?=[.,)\s;[])/g, '$1').replace(/\s+as\s+const\b/g, '')

	const capture = { log: console.log, error: console.error, warn: console.warn }
	console.log = (...a: unknown[]) => { capture.log(...a); onLine({ kind: 'log', text: a.map(stringify).join(' ') }) }
	console.error = (...a: unknown[]) => { capture.error(...a); onLine({ kind: 'error', text: a.map(stringify).join(' ') }) }
	console.warn = (...a: unknown[]) => { capture.warn(...a); onLine({ kind: 'info', text: a.map(stringify).join(' ') }) }

	try {
		const fn = new Function(...names, `return (async () => {\n${js}\n})()`)
		await Promise.race([
			fn(...values),
			new Promise((_r, reject) =>
				setTimeout(
					() => reject(new Error(`Timed out after ${timeoutMs / 1000}s. If this example forks mainnet, the public RPC may be rate-limiting — try again or swap in your own RPC_URL.`)),
					timeoutMs,
				),
			),
		])
	} finally {
		console.log = capture.log
		console.error = capture.error
		console.warn = capture.warn
	}
}
