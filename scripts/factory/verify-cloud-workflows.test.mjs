import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyCloudFactory, verifyHomeSchema, verifyWorkflowRealm } from './verify-cloud-workflows.mjs'

test('all .smithers/workflows/*.ts pass Smithers Cloud QuickJS Realm planner contract', async () => {
	const result = await verifyCloudFactory()
	assert.equal(result.ok, true)
	const names = result.workflows.map((w) => w.name)
	for (const required of ['ci', 'uphill', 'release', 'docs-publish', 'parity', 'benchmarks', 'wiki-refresh']) {
		assert.ok(names.includes(required), `Missing required cloud workflow: ${required}`)
	}
})

test('verifyWorkflowRealm rejects forbidden imports and Node.capture', async () => {
	await assert.rejects(
		() =>
			verifyWorkflowRealm(
				'bad',
				`import { readFileSync } from 'node:fs'\nimport { Flow } from '@smthrs/flow'\nexport default Flow.make('bad', { body: () => ({}) })`,
			),
		/forbidden import/,
	)
})

test('verifyHomeSchema rejects raw HTML and oversized section lists', () => {
	assert.throws(
		() =>
			verifyHomeSchema({
				sections: [{ audience: 'everyone', blocks: [{ type: 'text', text: '<script>alert(1)</script>' }] }],
			}),
		/HTML/,
	)
})
