import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createMemoryClient, http } from 'tevm'

export const BLOCK_NUMBER = 19_000_000n
export const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as const

const rpcUrl = () => {
  const configured = process.env.TEVM_RPC_URLS_MAINNET || process.env.RPC_URL || ''
  const url = configured.split(',').map((value) => value.trim()).find(Boolean)
  assert.ok(url, 'TEVM_RPC_URLS_MAINNET or RPC_URL is required')
  return url
}

export const loadCase = async (exportName: string) => {
  const workdir = path.resolve(process.argv[2] || '')
  assert.ok(workdir && fs.existsSync(workdir), 'usage: checker.ts <candidate-directory>')
  const sdkPath = path.join(workdir, 'sdk.ts')
  assert.ok(fs.existsSync(sdkPath), 'missing sdk.ts')
  const source = fs.readFileSync(sdkPath, 'utf8')
  assert.match(source, /readContract/, 'sdk.ts must use the supplied client readContract API')
  assert.match(source, /getContractEvents/, 'sdk.ts must expose event queries')
  assert.doesNotMatch(source, /checkers|CHECK_RESULT/, 'sdk.ts must not contain checker knowledge')
  const evalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
  const typed = spawnSync(path.join(evalRoot, 'node_modules', '.bin', 'tsc'), ['--noEmit'], {
    cwd: workdir,
    encoding: 'utf8',
    timeout: 60_000,
  })
  assert.equal(
    typed.status,
    0,
    `TypeScript failed\n${typed.stdout || ''}\n${typed.stderr || ''}`,
  )
  const module = await import(pathToFileURL(sdkPath).href)
  assert.equal(typeof module[exportName], 'function', `sdk.ts must export ${exportName}`)
  const client = createMemoryClient({
    fork: {
      transport: http(rpcUrl(), { retryCount: 1, timeout: 20_000 }),
      blockTag: BLOCK_NUMBER,
    },
  })
  return { client, factory: module[exportName], source, workdir }
}

const normalized = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string' && value.startsWith('0x')) return value.toLowerCase()
  if (Array.isArray(value)) return value.map(normalized)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalized(item)]))
  }
  return value
}

export const equal = (actual: unknown, expected: unknown) => {
  assert.deepEqual(normalized(actual), normalized(expected))
}

export const collector = (id: string) => {
  const checks: Array<{ name: string, passed: boolean, error?: string }> = []
  return {
    check: async (name: string, fn: () => unknown | Promise<unknown>) => {
      try {
        await fn()
        checks.push({ name, passed: true })
      } catch (error) {
        checks.push({
          name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
    finish: () => {
      const result = {
        id,
        total: checks.length,
        passed: checks.filter(({ passed }) => passed).length,
        failures: checks.filter(({ passed }) => !passed),
      }
      console.log(`CHECK_RESULT ${JSON.stringify(result)}`)
      if (result.passed !== result.total) process.exitCode = 1
    },
  }
}
