import assert from 'node:assert/strict'
import { test } from 'node:test'
import { auditTrustBoundary } from './trust-boundary.mjs'

test('repository satisfies root-input-tracing trust boundary and cache-poisoning invariants', async () => {
	const report = await auditTrustBoundary()
	assert.equal(report.ok, true, `Unexpected findings: ${report.findings.join('; ')}`)
	assert.ok(report.checkedWorkflows >= 10)
	assert.ok(report.trace.some((row) => row.surface === 'WORKSPACE.ts remote cache' && row.ok))
	assert.ok(report.trace.some((row) => row.surface === 'factory/policy.json trust contract' && row.ok))
})
