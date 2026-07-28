import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const evalRoot = path.resolve(root, '..')
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=') || true]
}))
const model = String(args.get('model') || process.env.EVAL_MODEL || 'gpt-5.6-sol')
const concurrency = Number(args.get('concurrency') || process.env.EVAL_CONCURRENCY || 1)
const suitePath = path.resolve(root, String(args.get('cases') || 'suite.jsonl'))
const resultPath = path.resolve(root, String(args.get('output') || 'results/latest.json'))
const only = args.get('case') ? new Set(String(args.get('case')).split(',')) : null
const dryRun = args.has('dry-run')
const attemptOffset = Number(args.get('attempt-offset') || 0)
const cases = (await fs.readFile(suitePath, 'utf8')).trim().split(/\r?\n/)
  .map((line) => JSON.parse(line))
  .filter((item) => !only || only.has(item.id))
const startedAt = new Date().toISOString()
const runStamp = startedAt.replace(/[:.]/g, '-')
const runRoot = path.join(root, '.runs', runStamp)

await fs.mkdir(runRoot, { recursive: true })
await fs.mkdir(path.dirname(resultPath), { recursive: true })

const exec = (command, commandArgs, options = {}) => new Promise((resolve) => {
  const started = Date.now()
  const child = spawn(command, commandArgs, {
    cwd: options.cwd,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  const timer = setTimeout(() => child.kill('SIGTERM'), options.timeout || 900_000)
  child.on('close', (code, signal) => {
    clearTimeout(timer)
    resolve({ code, signal, stdout, stderr, durationMs: Date.now() - started })
  })
})

const waitForPid = async (pid, timeout = 1_200_000) => {
  if (!pid) return { timedOut: false, durationMs: 0 }
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      process.kill(pid, 0)
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    } catch {
      return { timedOut: false, durationMs: Date.now() - started }
    }
  }
  return { timedOut: true, durationMs: Date.now() - started }
}

const extractSmithersRunId = (text) => {
  const jsonMatch = text.match(/"runId"\s*:\s*"([^"]+)"/)
  if (jsonMatch) return jsonMatch[1]
  return text.match(/\b(run_[a-zA-Z0-9_-]+)\b/)?.[1] || null
}

const extractSmithersPid = (text) => {
  const match = text.match(/"pid"\s*:\s*(\d+)/)
  return match ? Number(match[1]) : null
}

const parseCheckResult = (stdout, expected) => {
  const line = stdout.split(/\r?\n/).find((value) => value.startsWith('CHECK_RESULT '))
  if (!line) return { total: expected, passed: 0, failures: [] }
  try {
    return JSON.parse(line.slice('CHECK_RESULT '.length))
  } catch {
    return { total: expected, passed: 0, failures: [{ name: 'checker output', error: line }] }
  }
}

const expectedAssertions = {
  ens: 5,
  'uniswap-v3': 7,
  'aave-v3': 5,
  'morpho-blue': 5,
  'compound-v2': 7,
  seaport: 5,
}

const runCase = async (item) => {
  const workdir = path.join(runRoot, item.id)
  await fs.mkdir(workdir, { recursive: true })
  await fs.cp(path.join(evalRoot, 'fixtures', '_base'), workdir, { recursive: true })
  await fs.cp(path.join(root, item.fixture), workdir, { recursive: true })
  await fs.symlink(path.join(evalRoot, 'node_modules'), path.join(workdir, 'node_modules'), 'dir')
  const goalPath = path.join(workdir, 'GOAL.md')
  const goal = `Build a working typed SDK for the shipped project ${item.project}.

Input:
- project.ts contains the verified Ethereum mainnet contract addresses and ABIs.
- Chain: Ethereum mainnet.
- The checker forks pinned block ${item.blockNumber}.

SDK specification:
${item.prompt}

Rules:
- Work only in this candidate directory.
- Write the implementation to sdk.ts now.
- Do not install or upgrade packages.
- Do not inspect parent directories, sibling directories, any checker, or prior run.
- Do not hard-code block results or return constants in place of contract calls.
- Use the supplied client so the hidden checker can run against Tevm.
- Keep the SDK fully typed and make npm's installed TypeScript pass with no emit.
- This is one attempt. Finish with the implementation in this directory.
`
  await fs.writeFile(goalPath, goal)

  let smithers = { code: 0, stdout: '', stderr: '', durationMs: 0 }
  if (!dryRun) {
    const smithersEnv = { ...process.env, NO_COLOR: '1' }
    const smithersArgs = [
      'oneshot',
      '--goal-file', goalPath,
      '--cwd', workdir,
      '--model', model,
      '--review', 'off',
      '--detach', 'true',
      '--open', 'false',
      '--started-by-harness', 'tevm-real-project-eval',
      '--format', 'json',
    ]
    smithers = await exec('/bin/zsh', [
      '-lc',
      'exec smithers "$@"',
      'smithers',
      ...smithersArgs,
    ], {
      cwd: os.tmpdir(),
      timeout: 60_000,
      env: smithersEnv,
    })
    if (smithers.code === 0) {
      const waited = await waitForPid(extractSmithersPid(`${smithers.stdout}\n${smithers.stderr}`))
      smithers.durationMs += waited.durationMs
      if (waited.timedOut) {
        smithers.code = 1
        smithers.stderr += '\nSmithers detached process exceeded the 20 minute case timeout.'
      }
    }
  }

  const checker = dryRun || smithers.code !== 0
    ? {
        code: 1,
        stdout: '',
        stderr: dryRun ? 'dry run: Smithers and checker were not executed' : smithers.stderr,
        durationMs: 0,
      }
    : await exec(path.join(evalRoot, 'node_modules', '.bin', 'tsx'), [
        path.join(root, item.checker),
        workdir,
      ], {
        cwd: root,
        timeout: 240_000,
        env: { ...process.env, NO_COLOR: '1' },
      })
  const assertionResult = parseCheckResult(checker.stdout, expectedAssertions[item.id])
  const checkerPassed = checker.code === 0 &&
    assertionResult.total > 0 &&
    assertionResult.passed === assertionResult.total
  const passed = smithers.code === 0 && checkerPassed
  const failureMode = passed
    ? null
    : smithers.code !== 0
      ? `smithers failed: ${(smithers.stderr || smithers.stdout).trim().slice(-2000)}`
      : `checker failed: ${(checker.stderr || checker.stdout).trim().slice(0, 3000)}`
  const result = {
    id: item.id,
    title: item.title,
    project: item.project,
    incumbent: item.incumbent,
    passed,
    checkerPassed,
    oneShotPassed: passed && attemptOffset === 0,
    assertions: { total: assertionResult.total, passed: assertionResult.passed },
    assertionFailures: assertionResult.failures,
    attempts: attemptOffset + 1,
    smithersRunId: extractSmithersRunId(`${smithers.stdout}\n${smithers.stderr}`),
    failureMode,
    launchHistory: `Launched by runner.mjs; attempt ${attemptOffset + 1}.`,
    durationMs: smithers.durationMs + checker.durationMs,
    workdir: path.relative(root, workdir),
    smithersExitCode: smithers.code,
    checkerExitCode: checker.code,
  }
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${item.id} ` +
    `${result.assertions.passed}/${result.assertions.total} assertions, ${result.attempts} attempt(s)` +
    `${failureMode ? `: ${failureMode.split('\n')[0]}` : ''}`,
  )
  return result
}

const results = []
let cursor = 0
const worker = async () => {
  while (cursor < cases.length) {
    const index = cursor++
    results[index] = await runCase(cases[index])
  }
}
await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker))

const passed = results.filter((item) => item.passed).length
const eventualPassed = results.filter((item) => item.checkerPassed).length
const assertions = results.reduce((sum, item) => sum + item.assertions.total, 0)
const assertionsPassed = results.reduce((sum, item) => sum + item.assertions.passed, 0)
const report = {
  schemaVersion: 1,
  suite: path.relative(root, suitePath),
  kind: 'smithers-real-project-sdk',
  tevmVersion: '1.0.0-rc.151',
  model,
  runId: runStamp,
  startedAt,
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
  scratch: path.relative(root, runRoot),
  dryRun,
  host: { platform: os.platform(), arch: os.arch(), node: process.version },
}
await fs.writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(
  `RESULT ${passed}/${results.length} SDKs, ${assertionsPassed}/${assertions} assertions ` +
  `-> ${path.relative(process.cwd(), resultPath)}`,
)
console.log(`Scratch retained for audit: ${path.relative(root, runRoot)}`)
process.exitCode = results.length && passed === results.length ? 0 : 1
