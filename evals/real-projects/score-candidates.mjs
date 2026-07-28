import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const evalRoot = path.resolve(root, '..')
const manifestPath = path.resolve(root, process.argv[2] || 'results/candidate-manifest.json')
const outputPath = path.resolve(root, process.argv[3] || 'results/final.json')
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
const cases = new Map(
  (await fs.readFile(path.join(root, 'suite.jsonl'), 'utf8')).trim().split(/\r?\n/)
    .map((line) => JSON.parse(line))
    .map((item) => [item.id, item]),
)

const exec = (command, args, options) => new Promise((resolve) => {
  const started = Date.now()
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  const timer = setTimeout(() => child.kill('SIGTERM'), 240_000)
  child.on('close', (code) => {
    clearTimeout(timer)
    resolve({ code, stdout, stderr, durationMs: Date.now() - started })
  })
})

const results = []
for (const entry of manifest.candidates) {
  const item = cases.get(entry.id)
  if (!item) throw new Error(`unknown case ${entry.id}`)
  const checked = await exec(path.join(evalRoot, 'node_modules', '.bin', 'tsx'), [
    path.join(root, item.checker),
    path.resolve(root, entry.workdir),
  ], {
    cwd: root,
    env: { ...process.env, NO_COLOR: '1' },
  })
  const line = checked.stdout.split(/\r?\n/).find((value) => value.startsWith('CHECK_RESULT '))
  const assertions = line
    ? JSON.parse(line.slice('CHECK_RESULT '.length))
    : { total: entry.assertions, passed: 0, failures: [] }
  const checkerPassed = checked.code === 0 && assertions.passed === assertions.total
  const oneShotPassed = checkerPassed && entry.attempts === 1
  const failureMode = !checkerPassed
    ? `checker failed: ${(checked.stderr || checked.stdout).trim().slice(0, 3000)}`
    : oneShotPassed
      ? null
      : `one-shot failed: ${entry.launchHistory}`
  results.push({
    id: item.id,
    title: item.title,
    project: item.project,
    incumbent: item.incumbent,
    passed: oneShotPassed,
    checkerPassed,
    oneShotPassed,
    assertions: { total: assertions.total, passed: assertions.passed },
    assertionFailures: assertions.failures,
    attempts: entry.attempts,
    smithersRunId: entry.smithersRunId,
    failureMode,
    launchHistory: entry.launchHistory,
    durationMs: checked.durationMs,
    workdir: entry.workdir,
    checkerExitCode: checked.code,
  })
  console.log(
    `${oneShotPassed ? 'ONE_SHOT_PASS' : checkerPassed ? 'RETRY_PASS' : 'FAIL'} ${item.id} ` +
    `${assertions.passed}/${assertions.total} assertions after ${entry.attempts} attempt(s)`,
  )
}

const passed = results.filter((item) => item.passed).length
const eventualPassed = results.filter((item) => item.checkerPassed).length
const assertions = results.reduce((sum, item) => sum + item.assertions.total, 0)
const assertionsPassed = results.reduce((sum, item) => sum + item.assertions.passed, 0)
const report = {
  schemaVersion: 1,
  suite: 'suite.jsonl',
  kind: 'smithers-real-project-sdk',
  tevmVersion: '1.0.0-rc.151',
  model: 'gpt-5.6-sol',
  runId: manifest.runId,
  startedAt: manifest.startedAt,
  completedAt: new Date().toISOString(),
  blockNumber: '19000000',
  cases: results.length,
  passed,
  failed: results.length - passed,
  passRate: results.length ? passed / results.length : 0,
  eventualPassed,
  eventualFailed: results.length - eventualPassed,
  eventualPassRate: results.length ? eventualPassed / results.length : 0,
  assertions,
  assertionsPassed,
  assertionPassRate: assertions ? assertionsPassed / assertions : 0,
  results,
  host: { platform: os.platform(), arch: os.arch(), node: process.version },
}
await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`RESULT ${passed}/${results.length} SDKs, ${assertionsPassed}/${assertions} assertions`)
process.exitCode = passed === results.length ? 0 : 1
