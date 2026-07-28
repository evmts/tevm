import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=') || true]
}))
const model = String(args.get('model') || process.env.EVAL_MODEL || 'gpt-5.6-sol')
const concurrency = Number(args.get('concurrency') || process.env.EVAL_CONCURRENCY || 2)
const suitePath = path.resolve(root, String(args.get('cases') || 'suite.jsonl'))
const resultPath = path.resolve(root, String(args.get('output') || 'results/latest.json'))
const only = args.get('case') ? new Set(String(args.get('case')).split(',')) : null
const dryRun = args.has('dry-run')

const cases = (await fs.readFile(suitePath, 'utf8')).trim().split(/\r?\n/).map((line) => JSON.parse(line))
  .filter((item) => !only || only.has(item.id))
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const runRoot = path.join(root, '.runs', runId)
await fs.mkdir(runRoot, { recursive: true })
await fs.mkdir(path.dirname(resultPath), { recursive: true })

const exec = (command, commandArgs, options = {}) => new Promise((resolve) => {
  const started = Date.now()
  const child = spawn(command, commandArgs, {
    cwd: options.cwd,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  const timer = setTimeout(() => child.kill('SIGTERM'), options.timeout || 600_000)
  child.on('close', (code, signal) => {
    clearTimeout(timer)
    resolve({ code, signal, stdout, stderr, durationMs: Date.now() - started })
  })
})

const copyFixture = async (fixture, workdir) => {
  const source = path.join(root, fixture)
  const stat = await fs.stat(source)
  if (stat.isDirectory()) {
    await fs.cp(source, workdir, { recursive: true })
  } else {
    await fs.copyFile(source, path.join(workdir, path.basename(source)))
  }
}

const runCase = async (item) => {
  const workdir = path.join(runRoot, item.id)
  await fs.mkdir(workdir, { recursive: true })
  await copyFixture('fixtures/_base', workdir)
  for (const fixture of item.fixtures) await copyFixture(fixture, workdir)
  await fs.symlink(path.join(root, 'node_modules'), path.join(workdir, 'node_modules'), 'dir')

  const prompt = `${item.prompt}

Rules:
- Work only in this candidate directory.
- This is a one-prompt evaluation. Implement the requested files now.
- Use the installed tevm@1.0.0-rc.151 API. Do not install or upgrade packages.
- Do not inspect parent directories or any checker.
- Do not hard-code the requested result. The checker inspects the source and executes it.
- Keep stdout quiet except for the exact requested final JSON line when the task asks for solution.ts.
- Finish with the implementation in the candidate directory.`

  let modelResult = { code: 0, stdout: '', stderr: '', durationMs: 0 }
  if (!dryRun) {
    modelResult = await exec('codex', [
      'exec',
      '--ephemeral',
      '--skip-git-repo-check',
      '--ignore-user-config',
      '--ignore-rules',
      '--model', model,
      '--sandbox', 'workspace-write',
      '--cd', workdir,
      prompt
    ], { cwd: workdir, timeout: 900_000 })
  }

  const checkResult = dryRun || modelResult.code !== 0
    ? { code: 1, stdout: '', stderr: dryRun ? 'dry run: no model and no checker executed' : modelResult.stderr, durationMs: 0 }
    : await exec(process.execPath, [path.join(root, item.checker), workdir], {
        cwd: workdir,
        env: {
          ...process.env,
          RPC_URL: process.env.RPC_URL || 'https://eth-mainnet.public.blastapi.io'
        },
        timeout: 180_000
      })

  const passed = modelResult.code === 0 && checkResult.code === 0
  const failureMode = passed ? null
    : modelResult.code !== 0
      ? `model process failed: ${(modelResult.stderr || modelResult.stdout).trim().slice(-1200)}`
      : `checker failed: ${(checkResult.stderr || checkResult.stdout).trim().slice(0, 2000)}`
  const result = {
    id: item.id,
    title: item.title,
    difficulty: item.difficulty,
    passed,
    failureMode,
    durationMs: modelResult.durationMs + checkResult.durationMs,
    workdir: path.relative(root, workdir),
    modelExitCode: modelResult.code,
    checkerExitCode: checkResult.code
  }
  console.log(`${passed ? 'PASS' : 'FAIL'} ${item.id}${failureMode ? `: ${failureMode.split('\n')[0]}` : ''}`)
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
const report = {
  schemaVersion: 1,
  suite: path.relative(root, suitePath),
  tevmVersion: '1.0.0-rc.151',
  model,
  runId,
  startedAt: runId.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z'),
  cases: results.length,
  passed,
  failed: results.length - passed,
  passRate: results.length ? passed / results.length : 0,
  results,
  scratch: path.relative(root, runRoot),
  dryRun,
  host: { platform: os.platform(), arch: os.arch(), node: process.version }
}
await fs.writeFile(resultPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`RESULT ${passed}/${results.length} (${(report.passRate * 100).toFixed(1)}%) -> ${path.relative(process.cwd(), resultPath)}`)
console.log(`Scratch retained for audit: ${path.relative(root, runRoot)}`)
process.exitCode = results.length && passed === results.length ? 0 : 1
