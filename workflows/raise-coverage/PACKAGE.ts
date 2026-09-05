/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as root } from '../../PACKAGE.js'

// Every package's coverage floor is a graph gate (//<dir>:coverageGate) with
// the same numbers as its vitest.config.ts. This lane raises one package's
// floor: the agent writes tests for the least-covered files, then moves the
// thresholds up to what the new run measures. The write set is the package's
// spec files and its vitest config; the gate is every coverage gate, which
// re-runs only the affected package because the rest are cache hits. The
// no-mocks judgment runs after the candidate is applied.
const raiseCoverage = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		package: S.Input.String('Package directory, e.g. packages/txpool'),
		target: S.Input.Optional(S.Input.String('Target line coverage percentage; defaults to current + 5')),
	},
	data: [root.allCoverage],
	changes: [
		'packages/*/src/**/*.spec.ts',
		'bundler-packages/*/src/**/*.spec.ts',
		'extensions/*/src/**/*.spec.ts',
		'*/*/vitest.config.ts',
	],
	gates: [root.allCoverage],
	maxRounds: 3,
})

export const Package = S.Package({
	targets: { raiseCoverage },
})
