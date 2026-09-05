import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

export type CliSession = {
	version: 2
	name: string
	forkUrl?: string
	forkBlock?: string
	blockNumber?: string
	updatedAt: string
	state?: `0x${string}`
}

type SessionClient = {
	getBlockNumber: () => Promise<bigint>
	tevmMine: (params: { blocks: number; interval: number }) => Promise<unknown>
}

const SESSION_NAME = /^[a-zA-Z0-9._-]+$/

/**
 * Resolve the state file used for a named CLI session.
 *
 * @example
 * ```ts
 * getSessionPath('optimism')
 * // ~/.tevm/sessions/optimism.json
 * ```
 */
export function getSessionPath(name: string, sessionDirectory = process.env['TEVM_SESSION_DIR']): string {
	if (!SESSION_NAME.test(name)) {
		throw new Error('Session names may contain only letters, numbers, dots, underscores, and hyphens')
	}
	const directory = sessionDirectory || path.join(homedir(), '.tevm', 'sessions')
	return path.join(directory, `${name}.json`)
}

/**
 * Read a CLI session if it exists.
 *
 * @example
 * ```ts
 * const session = readSession('optimism')
 * ```
 */
export function readSession(name: string, sessionDirectory?: string): CliSession | undefined {
	const sessionPath = getSessionPath(name, sessionDirectory)
	if (!existsSync(sessionPath)) {
		return undefined
	}
	const session = JSON.parse(readFileSync(sessionPath, 'utf8')) as CliSession
	if (session.version !== 2 || session.name !== name) {
		throw new Error(`Unsupported or invalid TEVM session file: ${sessionPath}`)
	}
	return session
}

/**
 * Atomically persist a CLI session.
 *
 * @example
 * ```ts
 * writeSession({ version: 2, name: 'local', updatedAt: new Date().toISOString() })
 * ```
 */
export function writeSession(session: CliSession, sessionDirectory?: string): string {
	const sessionPath = getSessionPath(session.name, sessionDirectory)
	mkdirSync(path.dirname(sessionPath), { recursive: true })
	const temporaryPath = `${sessionPath}.${process.pid}.tmp`
	writeFileSync(temporaryPath, `${JSON.stringify(session, null, 2)}\n`, { mode: 0o600 })
	renameSync(temporaryPath, sessionPath)
	return sessionPath
}

/**
 * Parse and validate a block number stored in session metadata.
 *
 * @example
 * ```ts
 * parseSessionBlockNumber('123', 'forkBlock')
 * // 123n
 * ```
 */
export function parseSessionBlockNumber(value: string, field: 'forkBlock' | 'blockNumber'): bigint {
	if (!/^(0|[1-9][0-9]*)$/.test(value)) {
		throw new Error(`Invalid ${field} "${value}"; expected a non-negative decimal block number`)
	}
	return BigInt(value)
}

/**
 * Restore the saved session height by mining empty blocks.
 *
 * Account and storage state is restored separately. Replaying empty blocks keeps
 * later commands at the same height even though transaction history is not saved.
 *
 * @example
 * ```ts
 * await restoreSessionBlockNumber(client, { version: 2, name: 'local', blockNumber: '3', updatedAt: '' })
 * ```
 */
export async function restoreSessionBlockNumber(client: SessionClient, session: CliSession): Promise<void> {
	if (!session.blockNumber) {
		return
	}
	const current = await client.getBlockNumber()
	const target = parseSessionBlockNumber(session.blockNumber, 'blockNumber')
	if (target < current) {
		throw new Error(`Session blockNumber ${target} is behind the restored base block ${current}`)
	}
	const difference = target - current
	if (difference === 0n) {
		return
	}
	if (difference > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Session blockNumber difference ${difference} is too large to restore safely`)
	}
	await client.tevmMine({ blocks: Number(difference), interval: 1 })
}
