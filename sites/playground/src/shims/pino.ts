// Browser stub for pino, tevm's logger. Maps warn/error to the console and
// swallows the rest — playground output should come from the user's own code.
interface Logger {
	level: string
	fatal: (...a: unknown[]) => void
	error: (...a: unknown[]) => void
	warn: (...a: unknown[]) => void
	info: (...a: unknown[]) => void
	debug: (...a: unknown[]) => void
	trace: (...a: unknown[]) => void
	silent: (...a: unknown[]) => void
	child: (bindings?: unknown) => Logger
}

const makeLogger = (level = 'warn'): Logger => ({
	level,
	fatal: (...a) => console.error(...a),
	error: (...a) => console.error(...a),
	warn: () => {},
	info: () => {},
	debug: () => {},
	trace: () => {},
	silent: () => {},
	child: () => makeLogger(level),
})

export const pino = (opts?: { level?: string }) => makeLogger(opts?.level)
export default pino
