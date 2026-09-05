/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as factory } from '../../factory/PACKAGE.js'

// Read an issue, normalize it with the deterministic intake script, and write
// a reviewable plan. This lane has no GitHub token and cannot comment, label,
// commit, push, or open a PR.
const triageIssue = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		issue: S.Input.String('GitHub issue number, e.g. 1234'),
		type: S.Input.Optional(S.Input.Literals(['bug', 'feature', 'docs', 'conformance', 'maintenance'])),
	},
	data: [factory.policy, factory.conventions, factory.queue, S.file('//scripts/factory/issue-intake.mjs')],
	changes: ['factory/queue/issues/**'],
	gates: [factory.queueLint],
	sandbox: { network: true },
	maxRounds: 2,
})

export const Package = S.Package({ targets: { triageIssue } })
