#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { assert, command } from './lib.mjs'

const smthrs = (...args) => JSON.parse(command('pnpm', ['--silent', 'exec', 'smthrs', ...args, '--format', 'json']))

const graph = smthrs('query', '//...')
assert(Array.isArray(graph.targets), 'query did not return a target graph')
assert(graph.targets.length >= 1000, `factory graph unexpectedly contains only ${graph.targets.length} targets`)
assert(
	graph.targets.every((target) => target.target !== 'Agent.Pr'),
	'package-mode Agent.Pr remains in the graph even though settlement is unbound',
)

const workflowTargets = graph.targets.filter((target) => target.label.startsWith('//workflows/'))
assert(
	workflowTargets.filter((target) => target.target === 'Agent.Diff').length >= 9,
	'expected governed Agent.Diff lanes',
)

const byLabel = new Map(graph.targets.map((target) => [target.label, target]))
for (const label of ['//:rpcContractLint', '//:regressionProofLint', '//:scopeCoherenceLint']) {
	assert(byLabel.get(label)?.target === 'Agent.Lint', `${label} is not an Agent.Lint`)
}
assert(
	byLabel.get('//factory:repositoryMetadataWrite')?.target === 'Shell.Diff',
	'repository metadata codegen is not a Shell.Diff',
)
assert(byLabel.get('//factory:sourceIntegrity')?.target === 'Shell.Test', 'source integrity is not a Shell.Test')
assert(
	byLabel.get('//factory:contributorDataWrite')?.target === 'Shell.Diff',
	'contributor data codegen is not a Shell.Diff',
)
assert(
	byLabel.get('//:mechanicalPrePush')?.target === 'Shell.Test',
	'candidate-safe mechanical gate is not a Shell.Test',
)
assert(byLabel.get('//:externalIntegrationTests')?.target === 'Suite', 'external integration boundary is not a Suite')

const mechanicalPlan = smthrs('target', '//:mechanicalPrePush', '--plan')
const mechanicalNode = mechanicalPlan.targets.find((target) => target.label === '//:mechanicalPrePush')
assert(
	mechanicalNode?.argv?.some((entry) => entry.endsWith('scripts/factory/mechanical-pre-push.mjs')),
	'mechanical gate does not use the sequential offline runner',
)

const plugin = JSON.parse(readFileSync('.smithers/UI.json', 'utf8'))
assert(plugin.schemaVersion === 1, 'Smithers UI manifest must use schema version 1')
const groupIds = new Set(plugin.groups.map((group) => group.id))
assert(groupIds.size === plugin.groups.length, 'Smithers UI manifest contains duplicate group ids')
const entryIds = new Set()
for (const entry of plugin.entries) {
	assert(!entryIds.has(entry.id), `Smithers UI manifest contains duplicate entry ${entry.id}`)
	assert(groupIds.has(entry.group), `Smithers UI entry ${entry.id} names an unknown group`)
	assert(entry.workspace === '.', `Smithers UI entry ${entry.id} does not use the root workspace`)
	assert(byLabel.has(entry.label), `Smithers UI entry ${entry.id} names missing target ${entry.label}`)
	entryIds.add(entry.id)
}

const contributorData = JSON.parse(readFileSync('sites/contributor/src/generated/factory-data.json', 'utf8'))
for (const workflow of contributorData.guidedWorkflows) {
	assert(byLabel.has(workflow.label), `contributor workflow ${workflow.id} names missing target ${workflow.label}`)
}

const targetLabel = '//workflows/issue-to-pr:implementIssue'
const plan = (...inputs) =>
	smthrs('target', targetLabel, '--plan', '--input', 'issue=123', '--input', 'type=bug', ...inputs)
const rootTarget = (result) => result.targets.find((target) => target.label === targetLabel)

assert(!rootTarget(plan('--input', 'approval=factory:ready'))?.refusal, 'valid factory approval was refused')
assert(
	rootTarget(plan())?.refusal?.includes('required payload input "approval" is missing'),
	'missing approval was not refused',
)
assert(
	rootTarget(plan('--input', 'approval=not-approved'))?.refusal?.includes('must be one of factory:ready'),
	'invalid approval was not refused',
)

console.log(`factory graph smoke ok: ${graph.targets.length} targets, ${workflowTargets.length} workflow targets`)
