import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { privateKeyToAccount } from 'viem/accounts'
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

const optimismRpc = process.env['TEVM_RPC_URLS_OPTIMISM']?.split(',')[0] ?? ''
const mainnetRpc = process.env['TEVM_RPC_URLS_MAINNET']?.split(',')[0] ?? ''
const testAddress = '0x00000000000000000000000000000000000000aa'
const weth = '0x4200000000000000000000000000000000000006'
const answerAbi = JSON.stringify([
	{
		inputs: [],
		name: 'answer',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
])

function expectOk(output: CliOutput, command: string) {
	expect(output).toMatchObject({ ok: true, command })
	return output.result
}

async function freePort() {
	const server = createServer()
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
	const address = server.address()
	if (!address || typeof address === 'string') {
		throw new Error('Could not allocate a test port')
	}
	await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
	return address.port
}

describe('CLI integration', () => {
	it('mutates and reads persistent local state through the public commands', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-integration-'))
		const sessions = path.join(scratch, 'sessions')

		expect(runCli(['session', 'local', '--local', '--json'], packageDirectory, sessions).ok).toBe(true)
		expect(
			expectOk(runCli(['get-chain-id', '--session', 'local', '--json'], packageDirectory, sessions), 'get-chain-id'),
		).toBe(31337)

		expectOk(
			runCli(
				[
					'set-account',
					'--address',
					testAddress,
					'--balance',
					'1000000000000000000',
					'--nonce',
					'7',
					'--session',
					'local',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'set-account',
		)
		expect(
			expectOk(
				runCli(
					['action', 'get-balance', '--address', testAddress, '--session', 'local', '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'get-balance',
			),
		).toBe('1000000000000000000')

		expectOk(
			runCli(
				['set-code', '--address', testAddress, '--bytecode', '0x6000', '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'set-code',
		)
		expectOk(
			runCli(
				['set-nonce', '--address', testAddress, '--nonce', '9', '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'set-nonce',
		)
		expectOk(
			runCli(
				[
					'set-storage-at',
					'--address',
					testAddress,
					'--index',
					'0x0',
					'--value',
					'42',
					'--session',
					'local',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'set-storage-at',
		)

		const account = expectOk(
			runCli(
				['get-account', '--address', testAddress, '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'get-account',
		)
		expect(account).toMatchObject({ balance: '1000000000000000000', deployedBytecode: '0x6000', nonce: '9' })
		expect(
			expectOk(
				runCli(
					['get-bytecode', '--address', testAddress, '--session', 'local', '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'get-bytecode',
			),
		).toBe('0x6000')
		expect(
			expectOk(
				runCli(
					['get-storage-at', '--address', testAddress, '--slot', '0x0', '--session', 'local', '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'get-storage-at',
			),
		).toBe(`0x${'0'.repeat(62)}2a`)

		const mined = runCli(['mine', '--block-count', '2', '--session', 'local', '--json'], packageDirectory, sessions)
		expect(mined).toMatchObject({ ok: true, command: 'mine', session: 'local' })
		const height = runCli(['get-block-number', '--session', 'local', '--json'], packageDirectory, sessions)
		expect(height.result).toBe('2')

		const stateFile = path.join(scratch, 'state.json')
		const dumped = expectOk(
			runCli(
				['dump-state', '--output-file', stateFile, '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'dump-state',
		)
		expect(dumped).toMatch(/^0x[0-9a-f]+$/)
		expect(JSON.parse(readFileSync(stateFile, 'utf8'))).toBe(dumped)
		expectOk(
			runCli(
				['load-state', '--state-file', stateFile, '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'load-state',
		)
	}, 180_000)

	it('creates, compiles, generates, and type-checks a real Solidity project', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-create-'))
		const sessions = path.join(scratch, 'sessions')
		const project = path.join(scratch, 'app')
		const output = runCli(['create', project, '--json'], packageDirectory, sessions)

		expect(output).toMatchObject({
			ok: true,
			command: 'create',
			result: { path: project },
		})
		expect(existsSync(path.join(project, 'src', 'Counter.sol'))).toBe(true)

		const compile = expectOk(runCli(['compile', '--json'], project, sessions), 'compile')
		expect(compile.artifacts).toContain('artifacts/Counter.json')
		const artifact = JSON.parse(readFileSync(path.join(project, 'artifacts', 'Counter.json'), 'utf8'))
		expect(artifact.abi.some((item: any) => item.name === 'increment')).toBe(true)
		expect(artifact.bytecode).toMatch(/^0x[0-9a-f]+$/)

		const generated = expectOk(
			runCli(['generate', 'contract', 'Counter', '--dir', project, '--force', '--json'], project, sessions),
			'generate',
		)
		expect(generated.files).toContain(path.join(project, 'src', 'Counter.sol.ts'))
		expect(readFileSync(path.join(project, 'src', 'Counter.sol.ts'), 'utf8')).toContain('createContract')

		writeFileSync(
			path.join(project, 'tsconfig.cli.json'),
			`${JSON.stringify({ compilerOptions: { noEmit: true, strict: true }, include: ['check.ts'] }, null, 2)}\n`,
		)
		writeFileSync(path.join(project, 'check.ts'), 'const answer: number = 42\nvoid answer\n')
		const tsc = expectOk(
			runCli(['tsc', '--project', 'tsconfig.cli.json', '--check', '--json'], project, sessions),
			'tsc',
		)
		expect(tsc.exitCode).toBe(0)
	}, 180_000)

	it('deploys and exercises contracts, filters, access lists, simulations, and multicalls', () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-contracts-'))
		const sessions = path.join(scratch, 'sessions')
		runCli(['session', 'local', '--local', '--json'], packageDirectory, sessions)
		const deployed = expectOk(
			runCli(
				[
					'deploy',
					'--bytecode',
					'0x600a600c600039600a6000f3602a60005260206000f3',
					'--session',
					'local',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'deploy',
		)
		expect(deployed.createdAddress).toMatch(/^0x[0-9A-Fa-f]{40}$/)
		const address = deployed.createdAddress

		const call = expectOk(
			runCli(['call', '--to', address, '--session', 'local', '--run', '--json'], packageDirectory, sessions),
			'call',
		)
		expect(call.rawData).toBe(`0x${'0'.repeat(62)}2a`)

		const contract = expectOk(
			runCli(
				[
					'contract',
					'--to',
					address,
					'--abi',
					answerAbi,
					'--function-name',
					'answer',
					'--session',
					'local',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'contract',
		)
		expect(contract.data).toBe('42')
		expect(
			expectOk(
				runCli(
					[
						'read-contract',
						'--address',
						address,
						'--abi',
						answerAbi,
						'--function-name',
						'answer',
						'--session',
						'local',
						'--run',
						'--json',
					],
					packageDirectory,
					sessions,
				),
				'read-contract',
			),
		).toBe('42')

		const contracts = JSON.stringify([{ address, abi: JSON.parse(answerAbi), functionName: 'answer' }])
		const multicall = expectOk(
			runCli(
				['multicall', '--contracts', contracts, '--session', 'local', '--run', '--json'],
				packageDirectory,
				sessions,
			),
			'multicall',
		)
		expect(multicall[0]).toBe('42')

		expect(
			expectOk(
				runCli(
					['action', 'create-access-list', '--to', address, '--session', 'local', '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'create-access-list',
			).gasUsed,
		).toMatch(/^\d+$/)
		const simulated = expectOk(
			runCli(
				[
					'action',
					'simulate-calls',
					'--calls',
					JSON.stringify([{ to: address, data: '0x' }]),
					'--session',
					'local',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'simulate-calls',
		)
		expect(simulated.results[0]).toMatchObject({ status: 'success', data: `0x${'0'.repeat(62)}2a` })

		for (const [command, extra] of [
			['create-block-filter', []],
			['create-event-filter', ['--address', address, '--from-block', 'latest', '--to-block', 'latest']],
			['create-contract-event-filter', ['--address', address, '--from-block', 'latest', '--to-block', 'latest']],
		] as const) {
			const filter = expectOk(
				runCli([command, ...extra, '--session', 'local', '--run', '--json'], packageDirectory, sessions),
				command,
			)
			expect(filter.id).toMatch(/^0x(?:0|[1-9a-f][0-9a-f]*)$/)
		}

		const unfunded = runCli(
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
		expect(unfunded).toMatchObject({
			ok: true,
			command: 'call',
			session: 'local',
		})
	}, 240_000)

	it.skipIf(!optimismRpc)(
		'matches pinned Optimism RPC data and exact JSON shapes',
		() => {
			const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-rpc-'))
			const sessions = path.join(scratch, 'sessions')
			const block = expectOk(
				runCli(
					['get-block', '--block-number', '130000000', '--rpc', optimismRpc, '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'get-block',
			)
			expect(block).toMatchObject({
				number: '130000000',
				hash: '0xaf131f54209291613f0b74e61903405ea84bf30368ea5c6cf787992351ad843d',
				stateRoot: '0xcc699442b96e42f638a8f4992c6beb4f5e9b289807de93e1ffe51cd1a694b5c0',
			})

			const transaction = expectOk(
				runCli(
					[
						'get-transaction',
						'--hash',
						'0xae542f6973baf73afc935c37c99d9529792bc94d27e8d1ebc3df8a2a94a91343',
						'--rpc',
						optimismRpc,
						'--run',
						'--json',
					],
					packageDirectory,
					sessions,
				),
				'get-transaction',
			)
			expect(transaction).toMatchObject({ blockHash: block.hash, blockNumber: '130000000' })

			expect(
				expectOk(
					runCli(
						[
							'get-storage-at',
							'--address',
							weth,
							'--slot',
							'0x0',
							'--block-number',
							'130000000',
							'--rpc',
							optimismRpc,
							'--run',
							'--json',
						],
						packageDirectory,
						sessions,
					),
					'get-storage-at',
				),
			).toBe('0x577261707065642045746865720000000000000000000000000000000000001a')

			const bytecode = expectOk(
				runCli(
					['get-bytecode', '--address', weth, '--block-number', '130000000', '--rpc', optimismRpc, '--run', '--json'],
					packageDirectory,
					sessions,
				),
				'get-bytecode',
			)
			expect(bytecode).toMatch(/^0x6080604052[0-9a-f]+$/)
			expect(
				expectOk(
					runCli(['get-chain-id', '--rpc', optimismRpc, '--run', '--json'], packageDirectory, sessions),
					'get-chain-id',
				),
			).toBe(10)
			expect(
				BigInt(
					expectOk(
						runCli(['get-gas-price', '--rpc', optimismRpc, '--run', '--json'], packageDirectory, sessions),
						'get-gas-price',
					),
				),
			).toBeGreaterThan(0n)
			expect(
				BigInt(
					expectOk(
						runCli(
							['estimate-gas', '--to', weth, '--data', '0x06fdde03', '--rpc', optimismRpc, '--run', '--json'],
							packageDirectory,
							sessions,
						),
						'estimate-gas',
					),
				),
			).toBeGreaterThan(21_000n)
			const fees = expectOk(
				runCli(['estimate-fees-per-gas', '--rpc', optimismRpc, '--run', '--json'], packageDirectory, sessions),
				'estimate-fees-per-gas',
			)
			expect(BigInt(fees.maxFeePerGas)).toBeGreaterThan(0n)
		},
		240_000,
	)

	it.skipIf(!mainnetRpc)(
		'resolves ENS records against a pinned mainnet block',
		() => {
			const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-ens-'))
			const sessions = path.join(scratch, 'sessions')
			const blockArgs = ['--block-number', '23100000', '--rpc', mainnetRpc, '--run', '--json']
			expect(
				expectOk(
					runCli(['get-ens-address', '--name', 'vitalik.eth', ...blockArgs], packageDirectory, sessions),
					'get-ens-address',
				).toLowerCase(),
			).toBe('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
			expect(
				expectOk(
					runCli(
						['get-ens-name', '--address', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ...blockArgs],
						packageDirectory,
						sessions,
					),
					'get-ens-name',
				),
			).toBe('vitalik.eth')
			expect(
				expectOk(
					runCli(['get-ens-text', '--name', 'vitalik.eth', '--key', 'url', ...blockArgs], packageDirectory, sessions),
					'get-ens-text',
				),
			).toContain('vitalik')
		},
		180_000,
	)

	it('sends a genuinely signed raw transaction to a local session', async () => {
		const scratch = mkdtempSync(path.join(tmpdir(), 'tevm-cli-raw-'))
		const sessions = path.join(scratch, 'sessions')
		runCli(['session', 'raw', '--local', '--json'], packageDirectory, sessions)
		const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
		const serialized = await account.signTransaction({
			chainId: 31337,
			gas: 21_000n,
			gasPrice: 1_000_000_000n,
			nonce: 0,
			to: testAddress,
			value: 1n,
		})
		const hash = expectOk(
			runCli(
				[
					'action',
					'send-raw-transaction',
					'--serialized-transaction',
					serialized,
					'--session',
					'raw',
					'--run',
					'--json',
				],
				packageDirectory,
				sessions,
			),
			'send-raw-transaction',
		)
		expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
	}, 120_000)

	it('serves a working JSON-RPC endpoint', async () => {
		const port = await freePort()
		const child = spawn(
			process.execPath,
			[cliPath, 'serve', '--host', '127.0.0.1', '--port', String(port), '--chain-id', '900', '--json'],
			{
				cwd: packageDirectory,
				env: { ...process.env, TEVM_JSON: 'false' },
				stdio: ['ignore', 'pipe', 'pipe'],
			},
		)
		let stderr = ''
		child.stderr.on('data', (chunk) => {
			stderr += chunk.toString()
		})
		try {
			let response: Response | undefined
			for (let attempt = 0; attempt < 80; attempt++) {
				try {
					response = await fetch(`http://127.0.0.1:${port}`, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
					})
					if (response.ok) break
				} catch {
					await new Promise((resolve) => setTimeout(resolve, 100))
				}
			}
			if (!response) throw new Error(`Server did not start: ${stderr}`)
			expect(await response.json()).toEqual({
				jsonrpc: '2.0',
				id: 1,
				result: '0x384',
			})
		} finally {
			child.kill('SIGTERM')
			await Promise.race([
				new Promise<void>((resolve) => child.once('exit', () => resolve())),
				new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
			])
			if (child.exitCode === null) {
				child.kill('SIGKILL')
			}
		}
	}, 60_000)
})
