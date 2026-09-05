/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as factory } from '../../factory/PACKAGE.js'
import { Package as root } from '../../PACKAGE.js'

// The governed implementation lane produces and applies a local candidate.
// PR settlement is deliberately separate: the current package-mode Flows
// runner has no durable approval store, while GitHub's factory-approval
// environment and factory:ready label provide an auditable human gate.
const implementIssue = S.Agent.Diff({
	agent: S.Agents.default,
	prompt: S.file('SKILL.md'),
	payload: {
		issue: S.Input.String('Open GitHub issue number'),
		type: S.Input.Literals(['bug', 'feature', 'docs', 'conformance', 'maintenance']),
		approval: S.Input.Literals(['factory:ready']),
	},
	data: [
		factory.policy,
		factory.conventions,
		factory.queue,
		S.file('//CLAUDE.md'),
		S.file('//package.json'),
		S.file('//pnpm-workspace.yaml'),
	],
	changes: [
		'packages/**',
		'bundler-packages/**',
		'extensions/**',
		'lsp/**',
		'tevm/**',
		'cli/**',
		'configs/**',
		'docs/**',
		'sites/**',
		'examples/**',
		'test/**',
		'scripts/**',
		'factory/queue/issues/**',
		'.changeset/**',
		'package.json',
		'pnpm-lock.yaml',
		'Cargo.toml',
		'Cargo.lock',
	],
	gates: [root.mechanicalPrePush, factory.queueLint],
	sandbox: { network: true },
	maxRounds: 3,
})

export const Package = S.Package({ targets: { implementIssue } })
