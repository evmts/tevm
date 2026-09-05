/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as root } from '../../PACKAGE.js'

// "Make CI green" as a lane. The data edge is //:ci itself: the agent starts
// from the suite's per-member report (which targets are red and their logs),
// edits inside the source write set, and the same suite is the gate, so the
// loop settles only when the whole suite passes or maxRounds is spent. The
// agent lints run after the accepted candidate because candidate gate loops
// cannot recursively spawn agent targets.
const fixCi = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		focus: S.Input.Optional(S.Input.String('A target label to fix first, e.g. //packages/txpool:test')),
	},
	data: [root.ci, S.gitDiff()],
	changes: [
		'packages/*/src/**',
		'bundler-packages/*/src/**',
		'extensions/*/src/**',
		'lsp/*/src/**',
		'cli/src/**',
		'tevm/**/index.ts',
		'*/*/package.json',
		'*/*/tsconfig.json',
		'*/*/vitest.config.ts',
	],
	gates: [root.ci],
	maxRounds: 4,
})

export const Package = S.Package({
	targets: { fixCi },
})
