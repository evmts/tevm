import assert from 'node:assert/strict'
import { test } from 'node:test'
import { syncMythicalHistory } from './mythical-history.mjs'
import { verifyWiki } from './verify-wiki.mjs'

test('Obsidian wiki catalog, inputs, and all [[wikilinks]] resolve cleanly', async () => {
	const res = await verifyWiki()
	assert.equal(res.ok, true)
	assert.ok(res.pages >= 8)
	assert.ok(res.wikilinks >= 10)
})

test('Mythical history epics, paths, and MYTHICAL.md projection stay synchronized', async () => {
	const res = await syncMythicalHistory({ write: false })
	assert.equal(res.ok, true)
	assert.ok(res.epics >= 6)
	assert.ok(res.chapters >= 8)
})
