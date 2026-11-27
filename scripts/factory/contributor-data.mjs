#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assert, readJson, readPolicy, repositoryRoot } from './lib.mjs'

const outputPath = resolve(repositoryRoot, 'sites/contributor/src/generated/factory-data.json')
const write = process.argv.includes('--write')
assert(process.argv.length === (write ? 3 : 2), 'Usage: contributor-data.mjs [--write]')

const policy = await readPolicy()
const plugin = await readJson(resolve(repositoryRoot, '.smithers/UI.json'))
const cloudFactory = await readJson(resolve(repositoryRoot, '.smithers/factory.json'))
const wikiCatalog = await readJson(resolve(repositoryRoot, '.smithers/coding-project.json'))
const mythical = await readJson(resolve(repositoryRoot, '.smithers/history/mythical.json'))
const lighthouse = await readJson(resolve(repositoryRoot, '.agents/uphill/lighthouse-snapshot.json'))
const repositoryUrl = `https://github.com/${policy.repository.owner}/${policy.repository.name}`
const smithersRepoUrl =
	policy.cloud?.repoUrl ?? `https://smithers.sh/${policy.repository.owner}/${policy.repository.name}`

const exactKeys = (record, expected, context) => {
	const actual = Object.keys(record).sort()
	const wanted = [...expected].sort()
	assert(JSON.stringify(actual) === JSON.stringify(wanted), `${context} keys must be ${wanted.join(', ')}`)
}

exactKeys(plugin, ['schemaVersion', 'name', 'title', 'summary', 'groups', 'entries'], 'plugin manifest')
assert(plugin.schemaVersion === 1, 'plugin manifest must use schema version 1')
for (const key of ['name', 'title', 'summary'])
	assert(typeof plugin[key] === 'string', `plugin ${key} must be a string`)
assert(Array.isArray(plugin.groups), 'plugin groups must be an array')
assert(Array.isArray(plugin.entries), 'plugin entries must be an array')

const scalar = (value) => {
	const trimmed = value.trim()
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed)
	if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replaceAll("''", "'")
	return trimmed
}

const yamlHeader = async (type) => {
	const text = await readFile(resolve(repositoryRoot, `.github/ISSUE_TEMPLATE/${type}.yml`), 'utf8')
	const name = /^name:\s*(.+)$/m.exec(text)?.[1]
	const description = /^description:\s*(.+)$/m.exec(text)?.[1]
	assert(name !== undefined, `${type} issue form is missing name`)
	assert(description !== undefined, `${type} issue form is missing description`)
	return { name: scalar(name), description: scalar(description) }
}

const groupIds = new Set()
for (const group of plugin.groups) {
	exactKeys(group, ['id', 'title', 'kind'], `plugin group ${group.id}`)
	assert(typeof group.id === 'string' && !groupIds.has(group.id), `duplicate or invalid plugin group ${group.id}`)
	assert(typeof group.title === 'string', `plugin group ${group.id} title must be a string`)
	assert(['check', 'lint', 'recipe', 'workflow'].includes(group.kind), `invalid plugin group kind ${group.kind}`)
	groupIds.add(group.id)
}

const entryIds = new Set()
const forbiddenDesktopTargets = new Set(['//:commit', '//:pr', '//:publish', '//:prerelease', '//:snapshot'])
for (const entry of plugin.entries) {
	const expectedKeys = ['id', 'group', 'workspace', 'label', 'title', 'summary']
	if ('agentic' in entry) expectedKeys.push('agentic')
	if ('approval' in entry) expectedKeys.push('approval')
	exactKeys(entry, expectedKeys, `plugin entry ${entry.id}`)
	assert(typeof entry.id === 'string' && !entryIds.has(entry.id), `duplicate or invalid plugin entry ${entry.id}`)
	assert(groupIds.has(entry.group), `plugin entry ${entry.id} names unknown group ${entry.group}`)
	assert(entry.workspace === '.', `plugin entry ${entry.id} must run in the root workspace`)
	assert(/^\/\/[^\s:]*:[^\s:]+$/.test(entry.label), `plugin entry ${entry.id} has invalid target label`)
	assert(
		typeof entry.title === 'string' && typeof entry.summary === 'string',
		`plugin entry ${entry.id} copy is invalid`,
	)
	assert(
		entry.agentic === undefined || typeof entry.agentic === 'boolean',
		`plugin entry ${entry.id} agentic is invalid`,
	)
	assert(
		entry.approval === undefined || typeof entry.approval === 'boolean',
		`plugin entry ${entry.id} approval is invalid`,
	)
	assert(!forbiddenDesktopTargets.has(entry.label), `outward target ${entry.label} must not be one-click desktop UI`)
	entryIds.add(entry.id)
}

const issueTypes = await Promise.all(
	policy.issues.types.map(async (id) => {
		const header = await yamlHeader(id)
		return {
			id,
			...header,
			route: policy.issues.routes[id],
			templateUrl: `${repositoryUrl}/issues/new?template=${id}.yml`,
		}
	}),
)

const guidedWorkflows = [
	{
		id: 'triage-issue',
		title: 'Triage an issue',
		summary: 'Normalize an existing issue and write a reviewable queue plan without GitHub write access.',
		label: '//workflows/issue-triage:triageIssue',
		command: 'pnpm factory:triage -- --input issue=123 --input type=bug',
		approval: false,
	},
	{
		id: 'implement-issue',
		title: 'Implement an approved issue',
		summary: 'Prepare a gated local candidate after a maintainer has applied factory:ready.',
		label: '//workflows/issue-to-pr:implementIssue',
		command: 'pnpm factory:implement -- --input issue=123 --input type=bug --input approval=factory:ready',
		approval: true,
	},
	{
		id: 'add-jsonrpc-method',
		title: 'Add a JSON-RPC method',
		summary: 'Generate the complete typed, serialized, dispatched, tested, documented, and exported RPC surface.',
		label: '//workflows/add-jsonrpc-method:addJsonrpcMethod',
		command: 'pnpm exec smthrs target //workflows/add-jsonrpc-method:addJsonrpcMethod --input method=eth_example',
		approval: false,
	},
	{
		id: 'repair-rpc-regression',
		title: 'Repair an RPC regression',
		summary: 'Reproduce the public wire failure first, then repair the full contract and its negative branches.',
		label: '//workflows/repair-rpc-regression:repairRpcRegression',
		command:
			"pnpm factory:rpc-repair -- --input method=eth_getStorageAt --input 'report=<actual and expected wire values>'",
		approval: false,
	},
	{
		id: 'sync-public-surface',
		title: 'Synchronize a public surface',
		summary: 'Fan an existing symbol through recursive barrels, the TEVM facade, docs, and a changeset.',
		label: '//workflows/sync-public-surface:syncPublicSurface',
		command: 'pnpm factory:surface-sync -- --input package=packages/actions --input symbol=<exportedSymbol>',
		approval: false,
	},
	{
		id: 'raise-coverage',
		title: 'Raise package coverage',
		summary: 'Add real regression tests around the least-covered paths and raise the proven package threshold.',
		label: '//workflows/raise-coverage:raiseCoverage',
		command: 'pnpm exec smthrs target //workflows/raise-coverage:raiseCoverage --input package=packages/node',
		approval: false,
	},
	{
		id: 'conformance-triage',
		title: 'Triage conformance drift',
		summary: 'Reproduce a native fixture, compare traces, and prepare a fix plan for its owning repository.',
		label: '//workflows/conformance-triage:conformanceTriage',
		command: 'pnpm exec smthrs target //workflows/conformance-triage:conformanceTriage --input testId=<fixture-id>',
		approval: false,
	},
]

const data = {
	schemaVersion: 1,
	repository: {
		owner: policy.repository.owner,
		name: policy.repository.name,
		defaultBranch: policy.repository.defaultBranch,
		webUrl: repositoryUrl,
		smithersUrl: smithersRepoUrl,
		mcpUrl: policy.cloud?.mcpUrl ?? `${smithersRepoUrl}/mcp`,
		objectStoreUrl: policy.cloud?.objectStore ?? 'https://build.smithers.sh',
		forkUrl: `${repositoryUrl}/fork`,
		newIssueUrl: `${repositoryUrl}/issues/new/choose`,
		discussionsUrl: `${repositoryUrl}/discussions`,
		securityAdvisoryUrl: `${repositoryUrl}/security/advisories/new`,
		docsUrl: policy.cloud?.docsUrl ?? 'https://node.tevm.sh',
	},
	cloud: {
		publicTodos: policy.cloud?.publicTodos === true,
		publicFactory: policy.cloud?.publicFactory === true,
		githubMirror: policy.cloud?.githubMirror ?? 'two-way',
		flowCount: Array.isArray(cloudFactory.flows) ? cloudFactory.flows.length : 0,
		triggerCount: Array.isArray(cloudFactory.contributes?.triggers) ? cloudFactory.contributes.triggers.length : 0,
		triggers: (cloudFactory.contributes?.triggers ?? []).map((t) => ({
			on: t.on,
			flow: t.flow,
			title: t.title ?? t.flow,
			branches: t.branches ?? null,
			cron: t.cron ?? null,
		})),
	},
	trust: {
		maintainers: policy.trust?.maintainers ?? ['roninjin10'],
		acceptExecutionFrom: policy.trust?.acceptExecutionFrom ?? ['smithers-sandbox', 'maintainer'],
		allowUntrustedExecution: policy.trust?.allowUntrustedExecution === true,
		untrustedCacheRead: policy.trust?.untrustedCacheRead === true,
		untrustedCacheWrite: policy.trust?.untrustedCacheWrite === true,
		untrustedSkipGates: policy.trust?.untrustedSkipGates === true,
		oneTimeAuthRequiredForSandboxes: policy.trust?.oneTimeAuthRequiredForSandboxes === true,
		protectedPaths: policy.trust?.protectedPaths ?? [],
	},
	lighthouse,
	wiki: (wikiCatalog.pages ?? []).map((page) => ({
		id: page.id,
		title: page.title,
		purpose: page.purpose,
		document: page.document,
		related: page.related ?? [],
		url: `${smithersRepoUrl}/blob/main/${page.document}`,
	})),
	mythicalHistory: (mythical.epics ?? []).map((epic) => ({
		id: epic.id,
		title: epic.title,
		summary: epic.summary,
		chapters: (epic.chapters ?? []).map((ch) => ({
			id: ch.id,
			title: ch.title,
			paths: ch.paths,
			provenanceCommits: ch.provenanceCommits,
			notes: ch.notes,
		})),
		abandonedExperiments: epic.abandonedExperiments ?? [],
	})),
	toolchain: {
		node: policy.toolchain.node,
		pnpm: policy.toolchain.pnpm,
		flowsRevision: policy.toolchain.flows.revision,
	},
	approvalLabel: policy.issues.approvalLabel,
	issueTypes,
	plugin,
	guidedWorkflows,
	commands: {
		bootstrap: 'node scripts/factory/bootstrap.mjs --install',
		factoryCheck: 'pnpm factory:check',
		runtimeCheck: 'pnpm factory:runtime-check',
		portal: 'pnpm factory:ui',
		uphill: 'uphill check && uphill --compact',
		sandboxAuthMint: 'node scripts/factory/sandbox-auth.mjs mint --role smithers-sandbox --run ci:local',
		mcpClaude: `claude mcp add tevm --transport http ${policy.cloud?.mcpUrl ?? `${smithersRepoUrl}/mcp`}`,
		mcpCodex: `codex mcp add tevm --url ${policy.cloud?.mcpUrl ?? `${smithersRepoUrl}/mcp`}`,
		mcpAntigravity: `agy mcp add tevm --transport http ${policy.cloud?.mcpUrl ?? `${smithersRepoUrl}/mcp`}`,
		clone: `git clone https://github.com/<your-handle>/${policy.repository.name}.git\ncd ${policy.repository.name}\ncorepack enable\npnpm factory:bootstrap`,
	},
}

const rendered = `${JSON.stringify(data, null, '\t')}\n`
let current = ''
try {
	current = await readFile(outputPath, 'utf8')
} catch {}

if (write) {
	if (current !== rendered) await writeFile(outputPath, rendered)
	console.log(
		`contributor data synchronized: ${issueTypes.length} issue types, ${plugin.entries.length} targets, ${data.wiki.length} wiki pages, ${data.mythicalHistory.length} mythical epics, lighthouse ${lighthouse.overallScore}`,
	)
} else {
	assert(current === rendered, 'contributor data is stale; run pnpm factory:contributor-data-write')
	console.log(
		`contributor data ok: ${issueTypes.length} issue types, ${plugin.entries.length} targets, lighthouse ${lighthouse.overallScore}`,
	)
}
