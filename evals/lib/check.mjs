import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const evalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tsx = path.join(evalRoot, 'node_modules', '.bin', 'tsx')
const vitest = path.join(evalRoot, 'node_modules', '.bin', 'vitest')
const tsc = path.join(evalRoot, 'node_modules', '.bin', 'tsc')
const vite = path.join(evalRoot, 'node_modules', '.bin', 'vite')

const run = (command, args, cwd, timeout = 90_000) => {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      RPC_URL: process.env.RPC_URL || 'https://eth-mainnet.public.blastapi.io',
      NO_COLOR: '1'
    },
    encoding: 'utf8',
    timeout
  })
  if (result.error) throw result.error
  assert.equal(
    result.status,
    0,
    `command failed (${result.status})\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  )
  return { stdout: result.stdout, stderr: result.stderr }
}

const inspectSource = (workdir, required, file = 'solution.ts') => {
  const sourcePath = path.join(workdir, file)
  assert.ok(fs.existsSync(sourcePath), `missing ${file}`)
  const source = fs.readFileSync(sourcePath, 'utf8')
  for (const pattern of required) {
    assert.match(source, pattern, `source must match ${pattern}`)
  }
  return source
}

export const checkJson = ({ workdir, required = [], validate, timeout }) => {
  inspectSource(workdir, required)
  const { stdout } = run(tsx, ['solution.ts'], workdir, timeout)
  const lines = stdout.trim().split(/\r?\n/).filter(Boolean)
  assert.ok(lines.length > 0, 'solution produced no stdout')
  let value
  try {
    value = JSON.parse(lines.at(-1))
  } catch {
    assert.fail(`last stdout line is not JSON: ${lines.at(-1)}`)
  }
  validate(value, assert)
}

export const checkVitest = ({ workdir, required = [] }) => {
  inspectSource(workdir, required, 'solution.test.ts')
  run(vitest, ['run', 'solution.test.ts', '--reporter=dot'], workdir)
}

export const checkBundler = ({ workdir }) => {
  inspectSource(workdir, [/BundledCounter\.sol/, /BundledCounter/, /abi/, /bytecode/])
  inspectSource(workdir, [/@tevm\/vite-plugin/, /vitePluginTevm/], 'vite.config.ts')
  run(tsc, ['--noEmit'], workdir)
  run(vite, ['build', '--config', 'vite.config.ts'], workdir)
}

export const candidateDir = () => {
  const workdir = process.argv[2]
  assert.ok(workdir, 'usage: node checker.mjs <candidate-directory>')
  return path.resolve(workdir)
}
