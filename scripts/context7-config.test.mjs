// context7.json tells Context7 (https://context7.com) which docs to serve to coding
// agents through its MCP server (issue #2058). Context7 skips any field or list entry
// that is not valid, so an invalid exclusion silently indexes the page it meant to
// hide. context7.schema.json is https://context7.com/schema/context7.json as fetched on
// 2026-11-23, reformatted by Biome. The indexing rules below follow
// https://github.com/upstash/context7/blob/master/docs/library-owners.mdx.
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const config = readJson(join(root, 'context7.json'))
const schema = readJson(join(here, 'context7.schema.json'))

const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', 'examples', 'default', 'format'])
const typeOf = (value) => (Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value)

/**
 * Validates a value against the draft-07 keywords the Context7 schema uses.
 * Throws on any other keyword, so a schema update cannot pass unchecked.
 * @returns {string[]} one message per violation
 */
const validate = (node, value, at = '$') => {
	if (node.type !== undefined && typeOf(value) !== node.type) return [`${at}: expected ${node.type}`]
	const errors = []
	for (const [keyword, rule] of Object.entries(node)) {
		if (ANNOTATIONS.has(keyword) || keyword === 'type') continue
		if (keyword === 'properties') {
			for (const [key, child] of Object.entries(rule)) {
				if (key in value) errors.push(...validate(child, value[key], `${at}.${key}`))
			}
		} else if (keyword === 'additionalProperties' && rule === false) {
			for (const key of Object.keys(value)) if (!(key in node.properties)) errors.push(`${at}.${key}: unknown field`)
		} else if (keyword === 'required') {
			for (const key of rule) if (!(key in value)) errors.push(`${at}.${key}: required`)
		} else if (keyword === 'dependencies') {
			for (const [key, needs] of Object.entries(rule)) {
				for (const need of needs) if (key in value && !(need in value)) errors.push(`${at}.${key}: needs ${need}`)
			}
		} else if (keyword === 'minLength') {
			if (value.length < rule) errors.push(`${at}: shorter than ${rule}`)
		} else if (keyword === 'maxLength' || keyword === 'maxItems') {
			if (value.length > rule) errors.push(`${at}: longer than ${rule}`)
		} else if (keyword === 'pattern') {
			if (!new RegExp(rule, 'u').test(value)) errors.push(`${at}: does not match ${rule}`)
		} else if (keyword === 'uniqueItems') {
			if (rule && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
				errors.push(`${at}: duplicate items`)
			}
		} else if (keyword === 'items') {
			for (const [index, item] of value.entries()) errors.push(...validate(rule, item, `${at}[${index}]`))
		} else if (keyword === 'oneOf') {
			const matches = rule.filter((branch) => validate(branch, value, at).length === 0).length
			if (matches !== 1) errors.push(`${at}: matches ${matches} oneOf branches`)
		} else {
			throw new Error(`context7.schema.json uses unsupported keyword ${keyword} at ${at}`)
		}
	}
	return errors
}

// excludeFolders entries are plain names or paths: a run of whole path segments at
// any depth, excluding that path and everything under it. A file whose own path or
// any ancestor matches is excluded. This model covers no glob syntax.
const GLOB = /[*?[\]{}]/
const matchesPattern = (path, pattern) => {
	const want = pattern.replace(/\/$/, '').split('/')
	const have = path.split('/')
	for (let start = 0; start + want.length <= have.length; start++) {
		if (want.every((segment, offset) => have[start + offset] === segment)) return true
	}
	return false
}
const excludedByFolders = (path) => config.excludeFolders.some((pattern) => matchesPattern(path, pattern))

/** Context7's documented order: excludeFolders, then folders, then excludeFiles by file name. */
const indexed = (path) =>
	!excludedByFolders(path) &&
	config.folders.some((folder) => path.startsWith(`${folder}/`)) &&
	!config.excludeFiles.includes(path.split('/').at(-1))

/** Markdown pages under the configured folders that no excludeFolders entry removes. */
const walk = (dir) =>
	readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
		const path = `${dir}/${entry.name}`
		if (excludedByFolders(path)) return []
		if (entry.isDirectory()) return walk(path)
		return /\.mdx?$/.test(entry.name) ? [path] : []
	})
const pages = config.folders.flatMap(walk)

describe('context7.json', () => {
	it('conforms to the Context7 schema', () => {
		assert.deepEqual(validate(schema, config), [])
	})

	it('rejects a path in excludeFiles, which Context7 would skip', () => {
		const withPath = { ...config, excludeFiles: ['docs/node/pages/reference/vm.mdx'] }
		assert.deepEqual(validate(schema, withPath), ['$.excludeFiles[0]: does not match ^[^/\\\\]+$'])
	})

	it('uses only plain names and paths, and every path and file name exists', () => {
		for (const pattern of [...config.folders, ...config.excludeFolders]) assert.doesNotMatch(pattern, GLOB)
		for (const folder of config.folders) assert.ok(existsSync(join(root, folder)), folder)
		for (const pattern of config.excludeFolders.filter((pattern) => pattern.includes('/'))) {
			assert.ok(existsSync(join(root, pattern)), `excludeFolders entry ${pattern} does not exist`)
		}
		for (const name of config.excludeFiles) {
			assert.ok(
				pages.some((page) => page.endsWith(`/${name}`)),
				`excludeFiles entry ${name} matches no page`,
			)
		}
	})

	it('hides retired package references and internal reports but keeps current pages', () => {
		const hidden = [
			'docs/node/pages/reference/txpool.mdx',
			'docs/node/pages/reference/vm.mdx',
			'docs/triage/iteration-20-report.md',
			'docs/node/bugs.md',
			'tevm/CHANGELOG.md',
			'docs/triage-reports/iteration-16.md',
		]
		const shown = [
			'docs/node/pages/advanced/txpool.mdx',
			'docs/node/pages/reference/memory-client.mdx',
			'docs/node/pages/getting-started/overview.mdx',
			'tevm/README.md',
		]
		for (const path of [...hidden, ...shown]) assert.ok(existsSync(join(root, path)), `${path} is missing`)
		assert.deepEqual(hidden.filter(indexed), [])
		assert.deepEqual(
			shown.filter((path) => !indexed(path)),
			[],
		)
		assert.ok(pages.filter(indexed).length > 50, 'Context7 would index almost no pages')
	})
})
