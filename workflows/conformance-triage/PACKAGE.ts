/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as node } from '../../packages/node/PACKAGE.js'
import { Package as test } from '../../test/PACKAGE.js'

// Native execution belongs to sibling repositories. The TEVM factory may
// prepare a diagnosis here; it must not pretend to patch a retired JS engine.
const conformanceTriage = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		testId: S.Input.String('Failing test id, e.g. gst-frontier-upstream-state-root'),
		suite: S.Input.Optional(S.Input.String('gst or execspec, defaults to gst')),
	},
	data: [S.gitDiff(), test.runners, test.traceTools, test.ethereumTests, test.executionSpecTests],
	changes: ['factory/queue/conformance/**'],
	gates: [node.typecheck, node.test],
	sandbox: { network: true },
	maxRounds: 3,
})

export const Package = S.Package({
	targets: { conformanceTriage },
})
