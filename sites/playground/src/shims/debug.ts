// Browser stub for the CJS `debug` package (imported by @ethereumjs deps).
// Debug logging is off in the playground; keep the API shape.
type DebugFn = ((...args: unknown[]) => void) & {
	enabled: boolean
	namespace: string
	extend: (ns: string) => DebugFn
	log?: unknown
	color?: string
}

const createDebug = (namespace: string): DebugFn => {
	const fn = (() => {}) as DebugFn
	fn.enabled = false
	fn.namespace = namespace
	fn.extend = (ns: string) => createDebug(`${namespace}:${ns}`)
	return fn
}
;(createDebug as unknown as Record<string, unknown>).enable = () => {}
;(createDebug as unknown as Record<string, unknown>).disable = () => ''
;(createDebug as unknown as Record<string, unknown>).enabled = () => false
;(createDebug as unknown as Record<string, unknown>).log = () => {}

export default createDebug
