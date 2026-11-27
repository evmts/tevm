#!/usr/bin/env node
/**
 * One-time use authentication and BYOA MCP helper for TEVM sandboxes & agents.
 *
 * Security invariants:
 * - Sandbox & agent credentials are short-lived, single-use (jti replay-checked),
 *   and capability-attenuated by role.
 * - Untrusted contributors are welcomed to run workflows locally or in ephemeral
 *   untrusted sandboxes with read-only shared cache access, but are strictly
 *   blocked from cache:write, gates:attest, secrets:read, or release:publish.
 * - Signing keys and session cookies are NEVER accepted on argv; read from env
 *   or a mode-600 file only.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TOKEN_PREFIX = 'smthrs_ot_'
export const DEFAULT_TTL_SECONDS = 300
export const MAX_TTL_SECONDS = 3600

export const ROLES = /** @type {const} */ (['maintainer', 'smithers-sandbox', 'untrusted-contributor'])

export const PRIVILEGED_SCOPES = new Set(['cache:write', 'gates:attest', 'secrets:read', 'release:publish'])

export const ROLE_ALLOWED_SCOPES = {
	maintainer: new Set([
		'cache:read',
		'cache:write',
		'gates:attest',
		'mcp:read',
		'mcp:write',
		'sandbox:exec',
		'release:publish',
	]),
	'smithers-sandbox': new Set(['cache:read', 'cache:write', 'gates:attest', 'mcp:read', 'mcp:write', 'sandbox:exec']),
	'untrusted-contributor': new Set(['cache:read', 'mcp:read', 'execution:untrusted']),
}

export class SandboxAuthError extends Error {
	/**
	 * @param {string} code
	 * @param {string} message
	 */
	constructor(code, message) {
		super(message)
		this.name = 'SandboxAuthError'
		this.code = code
	}
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')

const signPayload = (encodedPayload, secret) =>
	createHmac('sha256', secret).update(`tevm-sandbox-ot:v1:${encodedPayload}`).digest('base64url')

/**
 * Redacts a raw one-time token for safe human/log display.
 * @param {string} token
 * @returns {string}
 */
export function redactToken(token) {
	if (typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX)) return '[redacted]'
	const body = token.slice(TOKEN_PREFIX.length)
	return `${TOKEN_PREFIX}${body.slice(0, 6)}...${body.slice(-4)}`
}

/**
 * Mints a single-use, TTL-bounded, role-attenuated sandbox/agent credential.
 * @param {{
 *   secret: string,
 *   role: 'maintainer' | 'smithers-sandbox' | 'untrusted-contributor',
 *   subject: string,
 *   runId: string,
 *   repo?: string,
 *   scopes?: string[],
 *   ttlSeconds?: number,
 *   nowMs?: number
 * }} options
 */
export function mintOneTimeToken(options) {
	const {
		secret,
		role,
		subject,
		runId,
		repo = 'evmts/tevm',
		scopes,
		ttlSeconds = DEFAULT_TTL_SECONDS,
		nowMs = Date.now(),
	} = options

	if (typeof secret !== 'string' || secret.length < 32) {
		throw new SandboxAuthError(
			'weak_secret',
			'Signing secret must be at least 32 characters (from env or mode-600 file)',
		)
	}
	if (!ROLES.includes(role)) {
		throw new SandboxAuthError('invalid_role', `Unsupported role: ${String(role)}`)
	}
	if (!subject || typeof subject !== 'string' || subject.length > 128) {
		throw new SandboxAuthError('invalid_subject', 'Subject must be a non-empty string up to 128 chars')
	}
	if (!runId || typeof runId !== 'string' || !/^[A-Za-z0-9._:/-]{1,128}$/.test(runId)) {
		throw new SandboxAuthError('invalid_run_id', 'runId must match ^[A-Za-z0-9._:/-]{1,128}$')
	}
	if (!Number.isInteger(ttlSeconds) || ttlSeconds < 10 || ttlSeconds > MAX_TTL_SECONDS) {
		throw new SandboxAuthError('invalid_ttl', `ttlSeconds must be an integer between 10 and ${MAX_TTL_SECONDS}`)
	}

	const allowed = ROLE_ALLOWED_SCOPES[role]
	const requested = scopes ?? [...allowed]
	const granted = []
	for (const scope of requested) {
		if (!allowed.has(scope)) {
			throw new SandboxAuthError(
				role === 'untrusted-contributor' && PRIVILEGED_SCOPES.has(scope)
					? 'untrusted_privilege_escalation'
					: 'scope_denied',
				`Role ${role} cannot hold scope ${scope}`,
			)
		}
		if (!granted.includes(scope)) granted.push(scope)
	}

	const jti = randomBytes(16).toString('hex')
	const iat = Math.floor(nowMs / 1000)
	const exp = iat + ttlSeconds
	const claims = {
		v: 1,
		jti,
		sub: subject,
		role,
		repo,
		run: runId,
		scopes: granted,
		trusted: role !== 'untrusted-contributor',
		cacheWrite: granted.includes('cache:write'),
		gateAttest: granted.includes('gates:attest'),
		iat,
		exp,
	}
	const encoded = b64url(JSON.stringify(claims))
	const sig = signPayload(encoded, secret)
	const token = `${TOKEN_PREFIX}${encoded}.${sig}`

	return {
		token,
		redacted: redactToken(token),
		claims,
		expiresAt: new Date(exp * 1000).toISOString(),
	}
}

/**
 * Verifies a one-time token and consumes its jti in replayStore so it can never be reused.
 * @param {{
 *   token: string,
 *   secret: string,
 *   replayStore: Set<string>,
 *   requiredScope?: string,
 *   nowMs?: number
 * }} options
 */
export function verifyAndConsumeOneTimeToken(options) {
	const { token, secret, replayStore, requiredScope, nowMs = Date.now() } = options
	if (typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX)) {
		throw new SandboxAuthError('malformed_token', 'Token must begin with smthrs_ot_')
	}
	const rest = token.slice(TOKEN_PREFIX.length)
	const dot = rest.indexOf('.')
	if (dot <= 0 || dot !== rest.lastIndexOf('.')) {
		throw new SandboxAuthError('malformed_token', 'Token payload/signature separator invalid')
	}
	const encoded = rest.slice(0, dot)
	const providedSig = rest.slice(dot + 1)
	const expectedSig = signPayload(encoded, secret)
	const a = Buffer.from(providedSig)
	const b = Buffer.from(expectedSig)
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		throw new SandboxAuthError('invalid_signature', 'Token signature verification failed')
	}

	let claims
	try {
		claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
	} catch {
		throw new SandboxAuthError('malformed_claims', 'Token claims are not valid JSON')
	}
	if (claims?.v !== 1 || typeof claims.jti !== 'string' || typeof claims.exp !== 'number') {
		throw new SandboxAuthError('malformed_claims', 'Token claims missing required v/jti/exp fields')
	}
	const nowSec = Math.floor(nowMs / 1000)
	if (nowSec >= claims.exp) {
		throw new SandboxAuthError('token_expired', 'One-time token has expired')
	}
	if (replayStore.has(claims.jti)) {
		throw new SandboxAuthError('token_replayed', 'One-time token has already been consumed')
	}
	// Enforce untrusted role invariants even if claims were crafted inconsistently.
	if (claims.role === 'untrusted-contributor' && (claims.trusted || claims.cacheWrite || claims.gateAttest)) {
		throw new SandboxAuthError('untrusted_privilege_escalation', 'Untrusted role cannot carry privileged flags')
	}
	if (requiredScope && (!Array.isArray(claims.scopes) || !claims.scopes.includes(requiredScope))) {
		throw new SandboxAuthError('scope_denied', `Token does not carry required scope ${requiredScope}`)
	}

	replayStore.add(claims.jti)
	return claims
}

/**
 * Reads a secret from a mode-600 file (rejects world/group readable files).
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function readSecretFile(filePath) {
	const info = await stat(filePath)
	if ((info.mode & 0o077) !== 0) {
		throw new SandboxAuthError('insecure_secret_file', `Secret file ${filePath} must have mode 0600`)
	}
	return (await readFile(filePath, 'utf8')).trim()
}

/**
 * Builds BYOA MCP and one-time sandbox connection instructions for evmts/tevm.
 * @param {{ origin?: string, owner?: string, repo?: string }} [options]
 */
export function buildByoaMcpGuide({ origin = 'https://smithers.sh', owner = 'evmts', repo = 'tevm' } = {}) {
	const cleanOrigin = origin.replace(/\/+$/, '')
	const mcpUrl = `${cleanOrigin}/${owner}/${repo}/mcp`
	return {
		repo: `${owner}/${repo}`,
		mcpUrl,
		oauthProtectedResource: `${cleanOrigin}/.well-known/oauth-protected-resource/${owner}/${repo}/mcp`,
		objectStore: 'https://build.smithers.sh',
		clients: {
			claude: `claude mcp add ${repo} --transport http ${mcpUrl}`,
			codex: `codex mcp add ${repo} --url ${mcpUrl}`,
			antigravity: `agy mcp add ${repo} --transport http ${mcpUrl}`,
			cursor: JSON.stringify({ mcpServers: { [repo]: { url: mcpUrl } } }, null, 2),
		},
		trustModel: {
			trustedExecutors: ['smithers-sandbox', 'maintainer (roninjin10)'],
			untrustedExecution: 'Encouraged with read-only shared object store cache; never writes cache or skips gates.',
			oneTimeAuthEndpoint: `${cleanOrigin}/api/runs/<run-id>/credential`,
		},
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2)
	const mode = args[0] ?? 'guide'
	if (mode === 'guide') {
		console.log(JSON.stringify(buildByoaMcpGuide(), null, 2))
	} else if (mode === 'mint') {
		const flag = (name, fallback) => {
			const idx = args.indexOf(`--${name}`)
			return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
		}
		const secretFile = flag('secret-file', undefined)
		const secret = secretFile ? await readSecretFile(secretFile) : process.env.SMITHERS_SANDBOX_AUTH_SECRET
		const role = /** @type {any} */ (flag('role', 'untrusted-contributor'))
		const subject = flag('subject', process.env.USER ?? 'contributor')
		const runId = flag('run', `local-${Date.now()}`)
		const ttlSeconds = Number(flag('ttl', String(DEFAULT_TTL_SECONDS)))
		const scopesRaw = flag('scopes', undefined)
		const scopes = scopesRaw
			? scopesRaw
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: undefined
		const emitToken = args.includes('--emit-token')
		const minted = mintOneTimeToken({ secret, role, subject, runId, scopes, ttlSeconds })
		const output = {
			jti: minted.claims.jti,
			role: minted.claims.role,
			subject: minted.claims.sub,
			run: minted.claims.run,
			trusted: minted.claims.trusted,
			cacheWrite: minted.claims.cacheWrite,
			gateAttest: minted.claims.gateAttest,
			scopes: minted.claims.scopes,
			expiresAt: minted.expiresAt,
			tokenPreview: minted.redacted,
			...(emitToken ? { oneTimeToken: minted.token } : { hint: 'Pass --emit-token to print the raw single-use token' }),
		}
		console.log(JSON.stringify(output, null, 2))
	} else {
		throw new SandboxAuthError('usage', 'Usage: sandbox-auth.mjs [guide|mint --role <role> --run <id> [--emit-token]]')
	}
}
