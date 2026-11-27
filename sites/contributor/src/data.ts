import rawData from './generated/factory-data.json'

export type ViewerRole = 'viewer' | 'contributor' | 'maintainer'

export type PluginGroup = {
	id: string
	title: string
	kind: 'check' | 'lint' | 'recipe' | 'workflow'
}

export type PluginEntry = {
	id: string
	group: string
	workspace: string
	label: string
	title: string
	summary: string
	agentic?: boolean
	approval?: boolean
}

export type IssueType = {
	id: string
	name: string
	description: string
	route: string
	templateUrl: string
}

export type GuidedWorkflow = {
	id: string
	title: string
	summary: string
	label: string
	command: string
	approval: boolean
}

export type LighthouseMetric = {
	id: string
	title: string
	description: string
	kind: string
	score: number
	weight: number
	passed: number
	total: number
}

export type LighthouseCategory = {
	id: string
	title: string
	description: string
	score: number
	metrics: LighthouseMetric[]
}

export type LighthouseOpportunity = {
	category: string
	metric: string
	item: string | null
	items: number
	value: unknown
	target: unknown
	gain: number
}

export type WikiPage = {
	id: string
	title: string
	purpose: string
	document: string
	related: string[]
	url: string
}

export type MythicalEpic = {
	id: string
	title: string
	summary: string
	chapters: Array<{
		id: string
		title: string
		paths: string[]
		provenanceCommits: string[]
		notes: string
	}>
	abandonedExperiments: string[]
}

export type CloudTrigger = {
	on: string
	flow: string
	title: string
	branches: string[] | null
	cron: string | null
}

export type FactoryData = {
	schemaVersion: 1
	repository: {
		owner: string
		name: string
		defaultBranch: string
		webUrl: string
		smithersUrl: string
		mcpUrl: string
		objectStoreUrl: string
		forkUrl: string
		newIssueUrl: string
		discussionsUrl: string
		securityAdvisoryUrl: string
		docsUrl: string
	}
	cloud: {
		publicTodos: boolean
		publicFactory: boolean
		githubMirror: string
		flowCount: number
		triggerCount: number
		triggers: CloudTrigger[]
	}
	trust: {
		maintainers: string[]
		acceptExecutionFrom: string[]
		allowUntrustedExecution: boolean
		untrustedCacheRead: boolean
		untrustedCacheWrite: boolean
		untrustedSkipGates: boolean
		oneTimeAuthRequiredForSandboxes: boolean
		protectedPaths: string[]
	}
	lighthouse: {
		schemaVersion: 1
		tool: string
		overallScore: number
		categories: LighthouseCategory[]
		opportunities: LighthouseOpportunity[]
	}
	wiki: WikiPage[]
	mythicalHistory: MythicalEpic[]
	toolchain: { node: string; pnpm: string; flowsRevision: string }
	approvalLabel: string
	issueTypes: IssueType[]
	plugin: {
		schemaVersion: 1
		name: string
		title: string
		summary: string
		groups: PluginGroup[]
		entries: PluginEntry[]
	}
	guidedWorkflows: GuidedWorkflow[]
	commands: {
		bootstrap: string
		factoryCheck: string
		runtimeCheck: string
		portal: string
		uphill: string
		sandboxAuthMint: string
		mcpClaude: string
		mcpCodex: string
		mcpAntigravity: string
		clone: string
	}
}

const allowedExternalHosts = new Set(['github.com', 'node.tevm.sh', 'smithers.sh', 'build.smithers.sh'])

export const safeExternalUrl = (value: string): string => {
	const url = new URL(value)
	if (
		url.protocol !== 'https:' ||
		!allowedExternalHosts.has(url.hostname) ||
		url.port !== '' ||
		url.username !== '' ||
		url.password !== ''
	) {
		throw new TypeError(`Unsupported external contributor URL: ${value}`)
	}
	return value
}

export const externalLinkProps = (href: string) => ({
	href: safeExternalUrl(href),
	target: '_blank' as const,
	rel: 'noreferrer noopener',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const readFactoryData = (value: unknown): FactoryData => {
	if (!isRecord(value) || value.schemaVersion !== 1) throw new TypeError('Contributor data must use schema version 1')
	if (!isRecord(value.repository)) throw new TypeError('Contributor data is missing repository links')
	for (const key of [
		'webUrl',
		'smithersUrl',
		'mcpUrl',
		'objectStoreUrl',
		'forkUrl',
		'newIssueUrl',
		'discussionsUrl',
		'securityAdvisoryUrl',
		'docsUrl',
	]) {
		const link = value.repository[key]
		if (typeof link !== 'string') throw new TypeError(`Contributor data is missing repository.${key}`)
		safeExternalUrl(link)
	}
	if (!Array.isArray(value.issueTypes) || !isRecord(value.plugin) || !Array.isArray(value.guidedWorkflows)) {
		throw new TypeError('Contributor data collections are malformed')
	}
	for (const issue of value.issueTypes) {
		if (!isRecord(issue) || typeof issue.templateUrl !== 'string') throw new TypeError('Malformed issue type')
		safeExternalUrl(issue.templateUrl)
	}
	if (!Array.isArray(value.wiki) || !Array.isArray(value.mythicalHistory) || !isRecord(value.lighthouse)) {
		throw new TypeError('Contributor data is missing wiki, mythicalHistory, or lighthouse snapshot')
	}
	for (const page of value.wiki) {
		if (!isRecord(page) || typeof page.url !== 'string') throw new TypeError('Malformed wiki page')
		safeExternalUrl(page.url)
	}
	return value as unknown as FactoryData
}

export const factoryData = readFactoryData(rawData)

export const entriesForGroup = (groupId: string): PluginEntry[] =>
	factoryData.plugin.entries.filter((entry) => entry.group === groupId)

export const targetCommand = (entry: PluginEntry): string => `pnpm exec smthrs target ${entry.label}`

export const scoreBand = (score: number): 'good' | 'average' | 'poor' =>
	score >= 90 ? 'good' : score >= 50 ? 'average' : 'poor'
