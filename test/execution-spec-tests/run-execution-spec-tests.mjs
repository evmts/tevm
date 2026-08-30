#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const argv = process.argv.slice(2)
// The env override wins; otherwise use the corpus that
// scripts/factory/fetch-conformance-corpus.mjs materializes at its pins.
const defaultFixtures = resolve('.cache/conformance-corpus/execution-spec-tests/fixtures/state_tests')
const fixtures =
	process.env.TEVM_EXECUTION_SPEC_TESTS_FIXTURES ?? (existsSync(defaultFixtures) ? defaultFixtures : undefined)
const script = resolve('test/conformance-utils/run-fixture-suite.mjs')
const args = [script, '--suite=execution-spec-tests', ...(fixtures ? [`--fixtures=${fixtures}`] : []), ...argv]

const proc = spawnSync(process.execPath, args, { stdio: 'inherit' })
process.exit(proc.status ?? 1)
