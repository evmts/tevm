#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { normalizeIssue, renderMarkdown } from './issue-intake-lib.mjs'
import { command, option, parseArgs, readPolicy, repositoryRoot } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const policy = await readPolicy()
const repository = `${policy.repository.owner}/${policy.repository.name}`
const eventPath = option(args, 'event')
const issueNumber = option(args, 'issue')

if ((eventPath === undefined) === (issueNumber === undefined)) {
	throw new Error('Pass exactly one of --event <github-event.json> or --issue <number>')
}

let issue
if (eventPath !== undefined) {
	const event = JSON.parse(await readFile(resolve(repositoryRoot, String(eventPath)), 'utf8'))
	if (!event.issue) throw new Error('The GitHub event does not contain an issue')
	const eventRepository = event.repository?.full_name
	if (eventRepository && eventRepository !== repository) {
		throw new Error(`Expected ${repository}, received event for ${eventRepository}`)
	}
	issue = event.issue
} else {
	if (!/^[1-9][0-9]*$/.test(String(issueNumber))) throw new Error(`Invalid issue number: ${issueNumber}`)
	if (args.has('public')) {
		const response = await fetch(`https://api.github.com/repos/${repository}/issues/${issueNumber}`, {
			headers: { accept: 'application/vnd.github+json', 'user-agent': 'tevm-factory-intake' },
		})
		if (!response.ok) throw new Error(`GitHub public issue lookup failed: ${response.status} ${response.statusText}`)
		issue = await response.json()
		if (issue.pull_request) throw new Error(`#${issueNumber} is a pull request, not an issue`)
	} else {
		issue = JSON.parse(
			command('gh', [
				'issue',
				'view',
				String(issueNumber),
				'--repo',
				repository,
				'--json',
				'author,body,labels,number,state,title,url',
			]),
		)
	}
}

const result = normalizeIssue(issue, policy, repository)
const format = option(args, 'format', 'json')

if (format === 'markdown') console.log(renderMarkdown(result))
else if (format === 'json') console.log(JSON.stringify(result, null, 2))
else throw new Error(`Unsupported --format ${format}; expected json or markdown`)

if (args.has('strict') && !result.ready) process.exitCode = 1
