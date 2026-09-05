/// <reference path="../smithers.d.ts" />
const S = Smithers

import { scopedShell } from '../factory/scoped-shell.js'

const Shell = scopedShell('evals')

// The LLM eval harness: runs coding agents against tevm tasks and scores
// the results with executable checkers. Not part of the pnpm workspace's
// package graph (it has its own package-lock.json), so there is no
// WorkspaceDeps edge.
const runner = S.file('runner.mjs')
const rescoreScript = S.file('rescore.mjs')
const validateSuite = S.file('validate-suite.mjs')
const realProjectsRunner = S.file('real-projects/runner.mjs')
const realProjectsValidateSuite = S.file('real-projects/validate-suite.mjs')

// The suite definition and everything a case consumes: fixtures are copied
// into the candidate workdir, checkers execute the candidate's solution.
const suite = S.Filegroup({
	srcs: S.glob(['suite.jsonl', 'fixtures/**', 'checkers/**', 'lib/**']),
})

const realProjectsSuite = S.Filegroup({
	srcs: S.glob([
		'real-projects/suite.jsonl',
		'real-projects/fixtures/**',
		'real-projects/checkers/**',
		'real-projects/lib/**',
	]),
})

// eval. `node runner.mjs` runs every case in suite.jsonl: it spawns the
// codex CLI (`codex exec`, model from EVAL_MODEL; a host binary declared in
// WORKSPACE.ts) per case and then executes the case's checker, which can
// fork mainnet through RPC_URL (a public endpoint is the fallback). The
// runner calls no model API directly, so no API-key secret is declared;
// codex carries its own auth. Runs are never cache hits by design; results/
// and .runs/ are the outputs.
const evalSuite = Shell.Build({
	bin: S.Runtime.bin,
	args: ['runner.mjs'],
	data: [suite, runner],
	outDirs: ['results', '.runs'],
	sandbox: { network: true },
})

// eval:real-projects. The same harness over real-protocol fixtures. Its
// checkers read TEVM_RPC_URLS_MAINNET before falling back to RPC_URL.
const evalRealProjects = Shell.Build({
	bin: S.Runtime.bin,
	args: ['real-projects/runner.mjs'],
	data: [realProjectsSuite, realProjectsRunner],
	outDirs: ['real-projects/results', 'real-projects/.runs'],
	secrets: [S.Secret('TEVM_RPC_URLS_MAINNET')],
	sandbox: { network: true },
})

// rescore. `node rescore.mjs` re-executes the checkers over existing
// .runs/ workdirs and rewrites results/, so prior runs are key material.
const rescore = Shell.Build({
	bin: S.Runtime.bin,
	args: ['rescore.mjs'],
	data: [suite, rescoreScript, S.Filegroup({ srcs: S.glob(['results/**', '.runs/**']) })],
	outDirs: ['results'],
	sandbox: { network: true },
})

// check:suite. Validates suite.jsonl against the checkers and fixtures
// without running any agent.
const checkSuite = Shell.Test({
	bin: S.Runtime.bin,
	args: ['validate-suite.mjs'],
	data: [suite, validateSuite],
})

// check:real-projects. The same validation for the real-projects suite.
const checkRealProjects = Shell.Test({
	bin: S.Runtime.bin,
	args: ['real-projects/validate-suite.mjs'],
	data: [realProjectsSuite, realProjectsValidateSuite],
})

export const Package = S.Package({
	targets: {
		checkRealProjects,
		checkSuite,
		evalRealProjects,
		evalSuite,
		rescore,
	},
})
