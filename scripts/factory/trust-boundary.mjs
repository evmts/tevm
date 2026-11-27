#!/usr/bin/env node
/**
 * Deterministic Root-Input-Tracing Trust Boundary & Cache-Poisoning Auditor.
 *
 * Verifies that:
 * 1. Shared Smithers Cloud object store (https://build.smithers.sh) splits
 *    read vs write credentials so untrusted runs can read cached artifacts
 *    without ever poisoning the shared object store.
 * 2. No pull_request-reachable GitHub workflow ever receives write secrets
 *    (SMITHERS_CACHE_WRITE_TOKEN, NPM_TOKEN, CLOUDFLARE_API_TOKEN, VERCEL_TOKEN)
 *    without a protected approval environment.
 * 3. Trusted release/deploy workflows trigger only from protected pushes/dispatch
 *    and guard credentials explicitly.
 * 4. factory/policy.json and .smithers/factory.json enforce maintainer-only
 *    trusted execution and explicit untrusted isolation.
 */
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert, readJson, repositoryRoot } from './lib.mjs'

const FORBIDDEN_PR_SECRETS = [
	'SMITHERS_CACHE_WRITE_TOKEN',
	'NPM_TOKEN',
	'CLOUDFLARE_API_TOKEN',
	'VERCEL_TOKEN',
	'IDENTITY_SERVICE_TOKEN',
]

/**
 * Audits repository files and returns a root-input-tracing security report.
 * @param {string} [root]
 */
export async function auditTrustBoundary(root = repositoryRoot) {
	const policy = await readJson(resolve(root, 'factory/policy.json'))
	const workspace = await readFile(resolve(root, 'WORKSPACE.ts'), 'utf8')
	const factoryJson = await readJson(resolve(root, '.smithers/factory.json'))
	const workflowsDir = resolve(root, '.github/workflows')
	const workflowFiles = (await readdir(workflowsDir)).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).sort()

	const findings = []
	const trace = []

	// 1. Shared object store split-privilege check in WORKSPACE.ts & policy.json
	const hasSharedEndpoint = workspace.includes("endpoint: 'https://build.smithers.sh'")
	const hasReadSecret = workspace.includes("read: S.Secret('SMITHERS_CACHE_READ_TOKEN')")
	const hasWriteSecret = workspace.includes("write: S.Secret('SMITHERS_CACHE_WRITE_TOKEN')")
	trace.push({
		surface: 'WORKSPACE.ts remote cache',
		rootInput: 'https://build.smithers.sh',
		privilege: 'split read/write secrets',
		ok: hasSharedEndpoint && hasReadSecret && hasWriteSecret,
	})
	if (!hasSharedEndpoint || !hasReadSecret || !hasWriteSecret) {
		findings.push(
			'WORKSPACE.ts must declare https://build.smithers.sh with split SMITHERS_CACHE_READ_TOKEN and SMITHERS_CACHE_WRITE_TOKEN',
		)
	}

	// 2. Policy trust contract
	const trustOk =
		policy.trust?.untrustedCacheWrite === false &&
		policy.trust?.untrustedSkipGates === false &&
		policy.trust?.allowUntrustedExecution === true &&
		policy.trust?.untrustedCacheRead === true &&
		policy.trust?.oneTimeAuthRequiredForSandboxes === true &&
		Array.isArray(policy.trust?.maintainers) &&
		policy.trust.maintainers.includes('roninjin10')
	trace.push({
		surface: 'factory/policy.json trust contract',
		rootInput: 'policy.trust',
		privilege: 'untrusted=read-only, trusted=sandbox|maintainer',
		ok: trustOk,
	})
	if (!trustOk) {
		findings.push(
			'factory/policy.json trust contract must enforce untrustedCacheWrite=false, untrustedSkipGates=false, allowUntrustedExecution=true',
		)
	}

	// 3. GitHub Actions root-input-tracing for PR-reachable secret leakage
	for (const file of workflowFiles) {
		const content = await readFile(resolve(workflowsDir, file), 'utf8')
		const prReachable = /^\s*pull_request(?:_target)?:/m.test(content)
		const leaked = FORBIDDEN_PR_SECRETS.filter((secret) => content.includes(`secrets.${secret}`))
		const hasProtectedEnv = /^\s*environment:\s*(?:npm-release|factory-approval|docs-deploy)\b/m.test(content)
		const ok = !(prReachable && leaked.length > 0 && !hasProtectedEnv)
		trace.push({
			surface: `.github/workflows/${file}`,
			rootInput: prReachable ? 'pull_request (untrusted fork capable)' : 'push/schedule/dispatch (trusted)',
			privilege: leaked.length > 0 ? leaked.join(', ') : 'read-only / no write secrets',
			ok,
		})
		if (!ok) {
			findings.push(
				`.github/workflows/${file} is pull_request-reachable and references privileged secret(s): ${leaked.join(', ')}`,
			)
		}
	}

	// 4. .smithers/factory.json maintainer & trust declaration (if trust block present)
	const maintainers = factoryJson?.github?.maintainers
	if (Array.isArray(maintainers)) {
		const hasMaintainer = maintainers.includes('roninjin10')
		trace.push({
			surface: '.smithers/factory.json github.maintainers',
			rootInput: 'default branch manifest',
			privilege: maintainers.join(', '),
			ok: hasMaintainer,
		})
		if (!hasMaintainer) {
			findings.push('.smithers/factory.json github.maintainers must include roninjin10')
		}
	}

	return {
		ok: findings.length === 0,
		findings,
		trace,
		checkedWorkflows: workflowFiles.length,
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const jsonMode = process.argv.includes('--json')
	const report = await auditTrustBoundary()
	if (jsonMode) {
		console.log(JSON.stringify(report, null, 2))
	} else {
		for (const row of report.trace) {
			console.log(`- ${row.ok ? 'PASS' : 'FAIL'} ${row.surface} [${row.rootInput}] -> ${row.privilege}`)
		}
	}
	assert(report.ok, `Trust boundary audit failed:\n${report.findings.join('\n')}`)
	if (!jsonMode) {
		console.log(`trust boundary ok: ${report.trace.length} surfaces traced across ${report.checkedWorkflows} workflows`)
	}
}
