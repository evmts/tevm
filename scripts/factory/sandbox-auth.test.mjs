import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
	buildByoaMcpGuide,
	mintOneTimeToken,
	readSecretFile,
	redactToken,
	SandboxAuthError,
	verifyAndConsumeOneTimeToken,
} from './sandbox-auth.mjs'

const secret = randomBytes(32).toString('hex')

test('mints, verifies, and rejects replay of a single-use smithers-sandbox token', () => {
	const replay = new Set()
	const now = 1_800_000_000_000
	const minted = mintOneTimeToken({
		secret,
		role: 'smithers-sandbox',
		subject: 'sandbox-worker-1',
		runId: 'ci:delivery-42',
		ttlSeconds: 120,
		nowMs: now,
	})
	assert.equal(minted.claims.trusted, true)
	assert.equal(minted.claims.cacheWrite, true)
	assert.equal(minted.claims.gateAttest, true)
	assert.notEqual(minted.redacted, minted.token)
	assert.ok(redactToken(minted.token).includes('...'))

	const verified = verifyAndConsumeOneTimeToken({
		token: minted.token,
		secret,
		replayStore: replay,
		requiredScope: 'cache:write',
		nowMs: now + 10_000,
	})
	assert.equal(verified.jti, minted.claims.jti)

	assert.throws(
		() => verifyAndConsumeOneTimeToken({ token: minted.token, secret, replayStore: replay, nowMs: now + 20_000 }),
		(err) => err instanceof SandboxAuthError && err.code === 'token_replayed',
	)
})

test('strictly blocks untrusted contributors from cache:write and gates:attest while allowing cache:read', () => {
	const replay = new Set()
	const minted = mintOneTimeToken({
		secret,
		role: 'untrusted-contributor',
		subject: 'external-pr-author',
		runId: 'pr:999',
	})
	assert.equal(minted.claims.trusted, false)
	assert.equal(minted.claims.cacheWrite, false)
	assert.equal(minted.claims.gateAttest, false)
	assert.deepEqual(minted.claims.scopes, ['cache:read', 'mcp:read', 'execution:untrusted'])

	assert.throws(
		() =>
			mintOneTimeToken({
				secret,
				role: 'untrusted-contributor',
				subject: 'external-pr-author',
				runId: 'pr:999',
				scopes: ['cache:read', 'cache:write'],
			}),
		(err) => err instanceof SandboxAuthError && err.code === 'untrusted_privilege_escalation',
	)

	assert.throws(
		() =>
			mintOneTimeToken({
				secret,
				role: 'untrusted-contributor',
				subject: 'external-pr-author',
				runId: 'pr:999',
				scopes: ['gates:attest'],
			}),
		(err) => err instanceof SandboxAuthError && err.code === 'untrusted_privilege_escalation',
	)

	const verified = verifyAndConsumeOneTimeToken({
		token: minted.token,
		secret,
		replayStore: replay,
		requiredScope: 'cache:read',
	})
	assert.equal(verified.role, 'untrusted-contributor')
})

test('rejects expired tokens and tampered signatures', () => {
	const replay = new Set()
	const now = 1_800_000_000_000
	const minted = mintOneTimeToken({
		secret,
		role: 'maintainer',
		subject: 'roninjin10',
		runId: 'release:1',
		ttlSeconds: 30,
		nowMs: now,
	})
	assert.throws(
		() => verifyAndConsumeOneTimeToken({ token: minted.token, secret, replayStore: replay, nowMs: now + 31_000 }),
		(err) => err instanceof SandboxAuthError && err.code === 'token_expired',
	)
	const tampered = `${minted.token.slice(0, -2)}AA`
	assert.throws(
		() => verifyAndConsumeOneTimeToken({ token: tampered, secret, replayStore: replay, nowMs: now + 5_000 }),
		(err) => err instanceof SandboxAuthError && err.code === 'invalid_signature',
	)
})

test('readSecretFile enforces 0600 permissions', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'tevm-auth-'))
	try {
		const path = join(dir, 'secret.txt')
		await writeFile(path, `${secret}\n`, { mode: 0o644 })
		await chmod(path, 0o644)
		await assert.rejects(
			() => readSecretFile(path),
			(err) => err instanceof SandboxAuthError && err.code === 'insecure_secret_file',
		)
		await chmod(path, 0o600)
		assert.equal(await readSecretFile(path), secret)
	} finally {
		await rm(dir, { recursive: true, force: true })
	}
})

test('buildByoaMcpGuide emits canonical smithers.sh/evmts/tevm/mcp endpoints', () => {
	const guide = buildByoaMcpGuide()
	assert.equal(guide.mcpUrl, 'https://smithers.sh/evmts/tevm/mcp')
	assert.equal(guide.objectStore, 'https://build.smithers.sh')
	assert.ok(guide.clients.claude.includes('https://smithers.sh/evmts/tevm/mcp'))
	assert.ok(guide.clients.codex.includes('https://smithers.sh/evmts/tevm/mcp'))
	assert.ok(guide.clients.antigravity.includes('https://smithers.sh/evmts/tevm/mcp'))
})
