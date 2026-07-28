import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const lines = fs.readFileSync(path.join(root, 'suite.jsonl'), 'utf8').trim().split(/\r?\n/)
const cases = lines.map((line, index) => {
  try {
    return JSON.parse(line)
  } catch (error) {
    throw new Error(`invalid JSON on line ${index + 1}`, { cause: error })
  }
})

assert.ok(cases.length >= 20, `expected at least 20 cases, found ${cases.length}`)
assert.equal(new Set(cases.map((item) => item.id)).size, cases.length, 'case ids must be unique')
for (const item of cases) {
  assert.equal(typeof item.prompt, 'string', `${item.id}: prompt missing`)
  assert.ok(item.prompt.length >= 80, `${item.id}: prompt is too short`)
  assert.ok(Array.isArray(item.fixtures), `${item.id}: fixtures missing`)
  assert.equal(typeof item.checker, 'string', `${item.id}: checker missing`)
  for (const fixture of ['fixtures/_base', ...item.fixtures]) {
    assert.ok(fs.existsSync(path.join(root, fixture)), `${item.id}: missing ${fixture}`)
  }
  assert.ok(fs.existsSync(path.join(root, item.checker)), `${item.id}: missing checker`)
}
assert.ok(cases.filter((item) => item.difficulty === 'hard').length >= 3, 'expected at least three hard cases')
console.log(JSON.stringify({ cases: cases.length, hard: cases.filter((item) => item.difficulty === 'hard').length }))
