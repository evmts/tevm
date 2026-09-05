/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as actions } from '../../packages/actions/PACKAGE.js'
import { Package as errors } from '../../packages/errors/PACKAGE.js'
import { Package as jsonrpc } from '../../packages/jsonrpc/PACKAGE.js'
import { Package as memoryClient } from '../../packages/memory-client/PACKAGE.js'
import { Package as node } from '../../packages/node/PACKAGE.js'
import { Package as server } from '../../packages/server/PACKAGE.js'

// The recurring repair lane from Will's PR history: reproduce the public
// JSON-RPC failure first, repair the entire wire contract, and keep the
// candidate local. Judgment lints run after application; these gates prove
// the affected runtime packages in each candidate round.
const repairRpcRegression = S.Agent.Diff({
	agent: S.Agents.default,
	prompt: S.file('SKILL.md'),
	payload: {
		report: S.Input.String('Observed JSON-RPC bug, including actual and expected wire values'),
		method: S.Input.Optional(S.Input.String('Method name, e.g. eth_getStorageAt')),
		reference: S.Input.Optional(
			S.Input.String('Specification, Anvil/geth/viem behavior, fixture ID, or URL that defines the expected result'),
		),
	},
	data: [
		actions.srcs,
		actions.tests,
		errors.srcs,
		errors.tests,
		jsonrpc.srcs,
		jsonrpc.tests,
		memoryClient.srcs,
		memoryClient.tests,
		node.srcs,
		node.tests,
		server.srcs,
		server.tests,
		S.file('//CLAUDE.md'),
		S.file('//factory/pr-history.md'),
	],
	changes: [
		'packages/actions/src/**',
		'packages/errors/src/**',
		'packages/jsonrpc/src/**',
		'packages/memory-client/src/**',
		'packages/node/src/**',
		'packages/server/src/**',
		'tevm/**',
		'docs/node/pages/**',
		'.changeset/**',
	],
	gates: [
		actions.typecheck,
		actions.test,
		errors.typecheck,
		errors.test,
		jsonrpc.typecheck,
		jsonrpc.test,
		memoryClient.typecheck,
		memoryClient.test,
		node.typecheck,
		node.test,
		server.typecheck,
		server.test,
	],
	sandbox: { network: true },
	maxRounds: 4,
})

export const Package = S.Package({ targets: { repairRpcRegression } })
