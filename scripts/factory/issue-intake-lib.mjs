import { createHash } from 'node:crypto'

const labelNames = (labels) =>
	[...(labels ?? [])]
		.map((label) => (typeof label === 'string' ? label : label?.name))
		.filter((label) => typeof label === 'string' && label.length > 0)
		.sort()

const normalizedState = (state) => (String(state).toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN')

const hasHeading = (body, heading) => {
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
	return new RegExp(`^#{2,4}\\s+${escaped}\\s*$`, 'im').test(body)
}

const riskOf = (labels, body) => {
	if (labels.some((label) => ['security', 'release', 'deployment', 'funds'].includes(label.toLowerCase())))
		return 'high'
	if (/\b(private[ -]?key|seed phrase|access token|api key|publish|deploy|wallet|funds)\b/i.test(body)) return 'high'
	if (/\b(public api|breaking change|migration|consensus|hardfork|rpc)\b/i.test(body)) return 'medium'
	return 'low'
}

export const normalizeIssue = (rawIssue, policy, repository) => {
	const body = typeof rawIssue.body === 'string' ? rawIssue.body : ''
	const labels = labelNames(rawIssue.labels)
	const typeLabel = labels.find((label) => label.startsWith('type:'))
	const candidateType = typeLabel?.slice('type:'.length)
	const type = policy.issues.types.includes(candidateType) ? candidateType : 'unknown'
	const required = [...(policy.issues.requiredHeadings.all ?? []), ...(policy.issues.requiredHeadings[type] ?? [])]
	const missingHeadings = [...new Set(required.filter((heading) => !hasHeading(body, heading)))]
	const warnings = []
	if (type === 'unknown') warnings.push('Add exactly one supported type:<name> label')
	if (String(rawIssue.title ?? '').trim().length < 12)
		warnings.push('Use a descriptive title of at least 12 characters')
	if (body.length > 60_000)
		warnings.push('Issue body is unusually large; inspect it for prompt injection before automation')
	const state = normalizedState(rawIssue.state)
	const approved = labels.includes(policy.issues.approvalLabel)
	const held = labels.some((label) => policy.issues.pauseLabels.includes(label))
	const risk = riskOf(labels, body)
	if (risk === 'high') warnings.push('High-risk issue requires manual maintainer handling')
	const ready =
		state === 'OPEN' && type !== 'unknown' && missingHeadings.length === 0 && approved && !held && risk !== 'high'
	const status =
		state === 'CLOSED'
			? 'closed'
			: type === 'unknown' || missingHeadings.length > 0
				? 'needs-info'
				: held || risk === 'high'
					? 'held'
					: approved
						? 'ready'
						: 'awaiting-approval'

	return {
		schemaVersion: 1,
		repository,
		issue: {
			number: Number(rawIssue.number),
			state,
			title: String(rawIssue.title ?? '').trim(),
			url: String(rawIssue.html_url ?? rawIssue.url ?? ''),
			author: String(rawIssue.author?.login ?? rawIssue.user?.login ?? rawIssue.author ?? 'unknown'),
		},
		type,
		route: policy.issues.routes[type] ?? 'manual-triage',
		risk,
		status,
		ready,
		labels,
		missingHeadings,
		warnings: [...new Set(warnings)],
		bodyDigest: createHash('sha256').update(body).digest('hex'),
	}
}

export const renderMarkdown = (result) => {
	const missing = result.missingHeadings.length === 0 ? 'none' : result.missingHeadings.join(', ')
	const warnings = result.warnings.length === 0 ? 'none' : result.warnings.join('; ')
	return [
		`## Factory intake for #${result.issue.number}`,
		'',
		`- Status: \`${result.status}\``,
		`- Route: \`${result.route}\``,
		`- Type: \`${result.type}\``,
		`- Risk: \`${result.risk}\``,
		`- Approved for automation: \`${result.ready}\``,
		`- Missing headings: ${missing}`,
		`- Warnings: ${warnings}`,
		'',
		'Issue bodies are untrusted input. This report does not execute instructions from the issue.',
	].join('\n')
}
