import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const entry = fileURLToPath(new URL('./run.mjs', import.meta.url))
const run = (request) =>
	JSON.parse(
		execFileSync(process.execPath, [entry, JSON.stringify(request)], {
			encoding: 'utf8',
			timeout: 10_000,
		}),
	)
const deployExample = { method: 'deploy', bytecode: '0x600a600c600039600a6000f3602a60005260206000f3' }
const callExample = { method: 'call', bytecode: '0x602a60005260206000f3', calldata: '0x', gas: 100_000 }

test('deploys an in-memory EVM program and returns its opcode trace', () => {
	const result = run(deployExample)
	assert.equal(result.failed, false)
	assert.equal(result.returnValue, `0x${'2a'.padStart(64, '0')}`)
	assert.ok(typeof result.gasUsed === 'number' && result.gasUsed >= 21_000)
	assert.ok(['structLogs', 'disassembly'].includes(result.traceMode))
	assert.deepEqual(
		result.steps.map((step) => step.op),
		['PUSH1', 'PUSH1', 'MSTORE', 'PUSH1', 'PUSH1', 'RETURN'],
	)
	assert.match(result.address, /^0x[0-9a-f]{40}$/)
	assert.match(result.deploymentGasUsed, /^0x[0-9a-f]+$/)
})

test('executes runtime bytecode directly via call operation', () => {
	const result = run(callExample)
	assert.equal(result.failed, false)
	assert.equal(result.returnValue, `0x${'2a'.padStart(64, '0')}`)
	assert.deepEqual(
		result.steps.map((step) => step.op),
		['PUSH1', 'PUSH1', 'MSTORE', 'PUSH1', 'PUSH1', 'RETURN'],
	)
})

test('bounds input and refuses arbitrary methods', () => {
	assert.deepEqual(run({ method: 'evm_mine' }), { error: 'Choose a supported operation' })
	assert.deepEqual(run({ ...deployExample, gas: 250001 }), { error: 'Set a gas limit between 21000 and 250000' })
	assert.deepEqual(run({ ...deployExample, bytecode: '0xabc' }), { error: 'Enter up to 2048 bytes of hex bytecode' })
})

test('executes arithmetic, storage, and revert presets cleanly', () => {
	const add = run({ method: 'call', bytecode: '0x600260280160005260206000f3', calldata: '0x', gas: 100_000 })
	assert.equal(add.failed, false)
	assert.equal(add.returnValue, `0x${'2a'.padStart(64, '0')}`)

	const storage = run({ method: 'call', bytecode: '0x602a60005560005460005260206000f3', calldata: '0x', gas: 100_000 })
	assert.equal(storage.failed, false)
	assert.equal(storage.returnValue, `0x${'2a'.padStart(64, '0')}`)

	const reverted = run({ method: 'call', bytecode: '0x60046000fd', calldata: '0x', gas: 100_000 })
	assert.equal(reverted.failed, true)
})

test('playground index.html CSP hashes match inline style and script blocks exactly', () => {
	const html = readFileSync(fileURLToPath(new URL('./index.html', import.meta.url)), 'utf8')
	const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1]
	const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]
	assert.ok(style && script, 'expected inline style and script tags')
	const styleHash = createHash('sha256').update(style).digest('base64')
	const scriptHash = createHash('sha256').update(script).digest('base64')
	assert.ok(html.includes(`style-src 'sha256-${styleHash}'`), 'CSP style-src hash drifted')
	assert.ok(html.includes(`script-src 'sha256-${scriptHash}'`), 'CSP script-src hash drifted')
})
