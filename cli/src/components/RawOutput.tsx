import { useApp } from 'ink'
import { useEffect, useRef } from 'react'

type Props = {
	value: string
	exitCode?: number
	exitOnWrite?: boolean
}

/**
 * Write machine-readable output without Ink line wrapping.
 *
 * @example
 * ```tsx
 * <RawOutput value='{"ok":true}' />
 * ```
 */
export default function RawOutput({ value, exitCode, exitOnWrite = true }: Props) {
	const { exit } = useApp()
	const written = useRef(false)

	useEffect(() => {
		if (written.current) {
			return
		}
		written.current = true
		if (exitCode !== undefined) {
			process.exitCode = exitCode
		}
		process.stdout.write(`${value}\n`)
		if (exitOnWrite) {
			exit()
		}
	}, [exit, exitCode, exitOnWrite, value])

	return null
}
