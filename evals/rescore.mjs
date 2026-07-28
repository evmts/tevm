import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const input = process.argv[2]
if (!input) throw new Error('usage: npm run rescore -- results/<report>.json')
const reportPath = path.resolve(root, input)
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const cases = new Map(
  fs.readFileSync(path.join(root, report.suite), 'utf8').trim().split(/\r?\n/)
    .map((line) => JSON.parse(line))
    .map((item) => [item.id, item])
)

for (const result of report.results) {
  const item = cases.get(result.id)
  if (!item) throw new Error(`case ${result.id} not found`)
  const workdir = path.join(root, result.workdir)
  const checked = spawnSync(process.execPath, [path.join(root, item.checker), workdir], {
    cwd: workdir,
    env: {
      ...process.env,
      RPC_URL: process.env.RPC_URL || 'https://eth-mainnet.public.blastapi.io'
    },
    encoding: 'utf8',
    timeout: 180_000
  })
  result.checkerExitCode = checked.status
  result.passed = result.modelExitCode === 0 && checked.status === 0
  result.failureMode = result.passed
    ? null
    : `checker failed: ${(checked.stderr || checked.stdout).trim().slice(0, 2000)}`
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.id}`)
}

report.passed = report.results.filter((item) => item.passed).length
report.failed = report.results.length - report.passed
report.passRate = report.results.length ? report.passed / report.results.length : 0
report.rescoredAt = new Date().toISOString()
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`RESULT ${report.passed}/${report.cases} (${(report.passRate * 100).toFixed(1)}%)`)
process.exitCode = report.failed ? 1 : 0
