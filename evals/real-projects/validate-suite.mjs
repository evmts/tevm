import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const cases = fs.readFileSync(path.join(root, 'suite.jsonl'), 'utf8').trim()
  .split(/\r?\n/).map((line) => JSON.parse(line))

assert.ok(cases.length >= 6, `expected at least six cases, found ${cases.length}`)
assert.equal(new Set(cases.map(({ id }) => id)).size, cases.length, 'case ids must be unique')
for (const item of cases) {
  assert.equal(item.blockNumber, '19000000', `${item.id}: block number must be pinned`)
  assert.ok(item.prompt.length >= 180, `${item.id}: prompt is too short`)
  assert.ok(fs.existsSync(path.join(root, item.fixture, 'project.ts')), `${item.id}: fixture missing`)
  assert.ok(fs.existsSync(path.join(root, item.checker)), `${item.id}: checker missing`)
}
console.log(JSON.stringify({ cases: cases.length, blockNumber: '19000000' }))

