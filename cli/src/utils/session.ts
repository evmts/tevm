import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

export type CliSession = {
	version: 1
	name: string
	forkUrl?: string
	forkBlock?: string
	blockNumber?: string
	updatedAt: string
	state?: Record<string, unknown>
}

type SessionClient = {
	getBlockNumber: () => Promise<bigint>
	tevmMine: (params: { blockCount: number; interval: number }) => Promise<unknown>
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
	if (session.version !== 1 || session.name !== name) {
		throw new Error(`Unsupported or invalid TEVM session file: ${sessionPath}`)
	}
	return session
}

/**
 * Atomically persist a CLI session.
 *
 * @example
 * ```ts
 * writeSession({ version: 1, name: 'local', updatedAt: new Date().toISOString() })
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
 * await restoreSessionBlockNumber(client, { version: 1, name: 'local', blockNumber: '3', updatedAt: '' })
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
	await client.tevmMine({ blockCount: Number(difference), interval: 1 })
}

/**
 * Expand compact dumped storage values before loading them into the EVM.
 *
 * TEVM dumps storage words without leading zeroes, while the state loader accepts
 * raw bytes. Expanding them here preserves numeric storage values across processes.
 *
 * @example
 * ```ts
 * normalizeSessionState({ state: { '0x01': { storage: { '0x00': '0x2a' } } } })
 * ```
 */
export function normalizeSessionState(state: Record<string, unknown>): Record<string, unknown> {
	const copy = structuredClone(state)
	const accounts = copy['state']
	if (!accounts || typeof accounts !== 'object') {
		return copy
	}
	for (const account of Object.values(accounts)) {
		if (!account || typeof account !== 'object' || !('storage' in account)) {
			continue
		}
		const storage = (account as { storage?: unknown }).storage
		if (!storage || typeof storage !== 'object') {
			continue
		}
		for (const [slot, value] of Object.entries(storage)) {
			if (typeof value === 'string' && /^0x[0-9a-fA-F]{1,63}$/.test(value)) {
				;(storage as Record<string, unknown>)[slot] = `0x${value.slice(2).padStart(64, '0')}`
			}
		}
	}
	return copy
}
