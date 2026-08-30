import rawData from './generated/factory-data.json'

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

export type FactoryData = {
	schemaVersion: 1
	repository: {
		owner: string
		name: string
		defaultBranch: string
		webUrl: string
		forkUrl: string
		newIssueUrl: string
		discussionsUrl: string
		securityAdvisoryUrl: string
		docsUrl: string
	}
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
		clone: string
	}
}

const allowedExternalHosts = new Set(['github.com', 'node.tevm.sh'])

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
	for (const key of ['webUrl', 'forkUrl', 'newIssueUrl', 'discussionsUrl', 'securityAdvisoryUrl', 'docsUrl']) {
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
	return value as unknown as FactoryData
}

export const factoryData = readFactoryData(rawData)

export const entriesForGroup = (groupId: string): PluginEntry[] =>
	factoryData.plugin.entries.filter((entry) => entry.group === groupId)

export const targetCommand = (entry: PluginEntry): string => `pnpm exec smthrs target ${entry.label}`
