/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as evm } from '../../packages/evm/PACKAGE.js'
import { Package as test } from '../../test/PACKAGE.js'

// Nightly conformance failures become typed workflow input instead of a red
// badge. The agent isolates the failing fixture, diffs the EIP-3155 trace
// against the reference client, and lands a fix or a minimized failing test
// in the owning package. gates rerun the fast conformance suite and the evm
// package's own checks so a fix cannot regress a neighboring hardfork. The
// no-mocks judgment check runs after the candidate is applied.
const conformanceTriage = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		testId: S.Input.String('Failing test id, e.g. gst-frontier-upstream-state-root'),
		suite: S.Input.Optional(S.Input.String('gst or execspec, defaults to gst')),
	},
	data: [S.gitDiff(), test.runners, test.traceTools, test.ethereumTests, test.executionSpecTests],
	changes: ['packages/evm/src/**', 'packages/vm/src/**', 'packages/state/src/**', 'test/**'],
	gates: [test.conformanceFast, evm.typecheck, evm.test],
	sandbox: { network: true },
	maxRounds: 3,
})

export const Package = S.Package({
	targets: { conformanceTriage },
})
