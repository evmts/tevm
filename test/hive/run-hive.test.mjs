import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

test('Hive records a failing Engine API response and exits unsuccessfully', async (t) => {
	const artifacts = await mkdtemp(join(tmpdir(), 'tevm-hive-error-'))
	t.after(() => rm(artifacts, { recursive: true, force: true }))
	const server = createServer(async (req, res) => {
		let body = ''
		for await (const chunk of req) body += chunk
		const { id, method } = JSON.parse(body)
		const reply =
			method === 'engine_exchangeCapabilities'
				? { error: { code: -32601, message: 'Method not found' } }
				: { result: '0x1' }
		res.end(JSON.stringify({ jsonrpc: '2.0', id, ...reply }))
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	t.after(() => new Promise((resolve) => server.close(resolve)))
	await assert.rejects(
		promisify(execFile)('bash', [fileURLToPath(new URL('run-hive.sh', import.meta.url))], {
			env: {
				...process.env,
				HIVE_SUITE: 'smoke',
				HIVE_ARTIFACT_DIR: artifacts,
				START_LOCAL_TEVM: 'false',
				TEVM_RPC_URL: `http://127.0.0.1:${server.address().port}`,
			},
		}),
		{ code: 1 },
	)
	const result = JSON.parse(await readFile(join(artifacts, 'tevm-hive-smoke.json'), 'utf8'))
	assert.equal(result.ok, false)
	const log = await readFile(join(artifacts, 'tevm-hive-smoke.log'), 'utf8')
	assert.match(log, /"method":"engine_exchangeCapabilities","ok":false/)
})
