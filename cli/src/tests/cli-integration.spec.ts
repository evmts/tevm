import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const cliPath = fileURLToPath(new URL('../../dist/cli.js', import.meta.url))
const packageDirectory = fileURLToPath(new URL('../../', import.meta.url))

type CliOutput = {
	ok: boolean
	command: string
	result?: any
	error?: { message: string }
	session?: string
}

function runCli(args: string[], cwd: string, sessionDirectory: string): CliOutput {
	const result = spawnSync(process.execPath, [cliPath, ...args], {
		cwd,
		encoding: 'utf8',
		env: {
			...process.env,
			TEVM_JSON: 'false',
			TEVM_SESSION: '',
			TEVM_SESSION_DIR: sessionDirectory,
		},
		timeout: 60_000,
	})
	if (result.error) {
		throw result.error
	}
	const output = result.stdout.trim()
	if (!output) {
		throw new Error(`CLI produced no JSON. stderr: ${result.stderr}`)
	}
	return JSON.parse(output) as CliOutput
}

describe('CLI integration', () => {
	it('uses JSON as a direct non-interactive mode and preserves mined height', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-integration-'))
		const sessions = path.join(scratch, 'sessions')

		expect(runCli(['session', 'local', '--local', '--json'], packageDirectory, sessions).ok).toBe(true)
		const chain = runCli(['get-chain-id', '--session', 'local', '--json'], packageDirectory, sessions)
		expect(chain).toMatchObject({ ok: true, command: 'get-chain-id', session: 'local' })

		const mined = runCli(['mine', '--block-count', '2', '--session', 'local', '--json'], packageDirectory, sessions)
		expect(mined).toMatchObject({ ok: true, command: 'mine', session: 'local' })
		const height = runCli(['get-block-number', '--session', 'local', '--json'], packageDirectory, sessions)
		expect(height.result).toBe('2')
	}, 120_000)

	it('creates a project directly in JSON mode without --skip-prompts', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-create-'))
		const sessions = path.join(scratch, 'sessions')
		const project = path.join(scratch, 'app')
		const output = runCli(['create', project, '--json'], packageDirectory, sessions)

		expect(output).toMatchObject({
			ok: true,
			command: 'create',
			result: { path: project },
		})
	}, 60_000)

	it('allows an unfunded caller to make an impersonated local call', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-call-'))
		const sessions = path.join(scratch, 'sessions')
		runCli(['session', 'local', '--local', '--json'], packageDirectory, sessions)
		const output = runCli(
			[
				'call',
				'--to',
				'0x0000000000000000000000000000000000000000',
				'--from',
				'0x00000000000000000000000000000000000000aa',
				'--session',
				'local',
				'--json',
			],
			packageDirectory,
			sessions,
		)

		expect(output).toMatchObject({
			ok: true,
			command: 'call',
			session: 'local',
		})
	}, 60_000)
})
