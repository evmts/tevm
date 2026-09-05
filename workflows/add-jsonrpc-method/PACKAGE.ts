/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as actions } from '../../packages/actions/PACKAGE.js'
import { Package as memoryClient } from '../../packages/memory-client/PACKAGE.js'
import { Package as tevm } from '../../tevm/PACKAGE.js'

// The most common feature PR in this repo, as a workflow: a new eth_*, anvil_*,
// debug_*, or tevm_* method. The payload turns the method name and namespace
// into typed input; the agent follows CLAUDE.md's documentation-driven steps
// (types and JSDoc, happy-path test, implementation, full suite) and the
// barrel-export rule up to the tevm meta package; the gates prove the
// handler type-checks, its tests pass, the barrels and JSDoc are complete,
// the committed tevm emit is regenerated, and a changeset names the packages.
// This target stops at an applied candidate; //:agentLints is the post-apply
// judgment gate and PR settlement remains a separate outward action.
const addJsonrpcMethod = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		method: S.Input.String('Method name, e.g. eth_getBlockReceipts'),
		spec: S.Input.Optional(S.Input.String('URL or text of the method spec (EIP, execution-apis, anvil docs)')),
		clientMethod: S.Input.Optional(S.Input.String('Viem-style action name to expose, e.g. getBlockReceipts')),
	},
	data: [actions.srcs, memoryClient.srcs, tevm.srcs, S.file('//factory/pr-history.md')],
	changes: [
		'packages/actions/src/**',
		'packages/memory-client/src/**',
		'packages/decorators/src/**',
		'packages/procedures/src/**',
		'tevm/**/index.ts',
		'docs/node/pages/**',
		'.changeset/**',
	],
	gates: [actions.typecheck, actions.test, memoryClient.typecheck, memoryClient.test, tevm.dist, tevm.types],
	sandbox: { network: true },
	maxRounds: 3,
})

export const Package = S.Package({
	targets: { addJsonrpcMethod },
})
