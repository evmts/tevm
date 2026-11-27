#!/usr/bin/env node
/**
 * Validates .smithers/workflows/*.ts, .smithers/factory.json triggers, and
 * .smithers/home.json against Smithers Cloud's exact server contracts:
 * - worker/ci/Realm.vibe (allowed imports, 64 KiB cap, Flow.make tag, CiJob DAG, payload inputs)
 * - worker/ci/Triggers.vibe (apiVersion: 1, contributes.triggers events, 5-field crons, target flows exist)
 * - @smthrs/views Home.ts (max 8 sections, max 32 blocks, no HTML tags, bounded lengths, safe URLs)
 */
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Script } from 'node:vm'
import { assert, readJson, repositoryRoot } from './lib.mjs'

const ALLOWED_MODULES = new Set(['@smthrs/flow', '@smthrs/plan', '@smthrs/sandbox', 'effect'])
const IMPORT_RE = /\bfrom\s*["'`]([^"'`]*)["'`]|\bimport\s*["'`]([^"'`]*)["'`]|\b(?:import|require)\s*\(/g
const FLOW_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/
const FIVE_FIELDS_RE = /^\S+( \S+){4}$/
const TRIGGER_EVENTS = new Set(['github.push', 'github.pull_request', 'manual', 'cron'])
const HTML_TAG_RE = /<\/?[A-Za-z!?]/
const VALID_AUDIENCES = new Set(['everyone', 'contributor', 'maintainer'])
const VALID_BLOCK_TYPES = new Set([
	'text',
	'links',
	'flows',
	'prompt',
	'markdown',
	'stack',
	'app',
	'view',
	'hero',
	'code',
	'cards',
	'stats',
	'releases',
	'issues',
	'runs',
	'action',
])

/**
 * Strips TypeScript syntax lightly using Node's built-in module transform or simple
 * Realm-compatible rewrite for evaluating our pure flow declarations in a VM sandbox.
 * Uses Node 22+ `stripTypeScriptTypes` when available.
 */
async function stripTs(source) {
	if (typeof globalThis.Bun?.Transpiler === 'function') {
		const transpiler = new globalThis.Bun.Transpiler({ loader: 'ts' })
		return transpiler.transformSync(source)
	}
	const mod = await import('node:module')
	if (typeof mod.stripTypeScriptTypes === 'function') {
		return mod.stripTypeScriptTypes(source, { mode: 'strip' })
	}
	return source
}

function toCommonJs(js) {
	return js
		.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, 'const {$1} = require("$2")')
		.replace(/export\s+default\s+/, 'module.exports.default = ')
}

function createRealmModules() {
	const inert = new Proxy(() => {}, { get: () => inert, apply: () => inert, construct: () => inert })
	const makeField = (node) => {
		const field = {
			__field: node,
			pipe: (...fns) => fns.reduce((v, fn) => (typeof fn === 'function' ? fn(v) : v), field),
			check: () => field,
			annotate: (notes) => {
				const kept = {}
				for (const key of ['title', 'description', 'default']) {
					if (notes && Object.hasOwn(notes, key)) kept[key] = notes[key]
				}
				return makeField({ ...node, ...kept })
			},
		}
		return field
	}
	const opt = (f) => (f?.__field ? makeField({ ...f.__field, optional: true }) : inert)
	const schemaObj = {
		String: makeField({ type: 'string' }),
		Number: makeField({ type: 'number' }),
		Int: makeField({ type: 'integer' }),
		Boolean: makeField({ type: 'boolean' }),
		Literal: (v) => makeField({ type: typeof v, enum: [v] }),
		Literals: (vals) =>
			makeField({ type: Array.isArray(vals) && vals.length ? typeof vals[0] : 'unknown', enum: vals }),
		optional: opt,
		optionalKey: opt,
	}
	return {
		'@smthrs/flow': {
			Flow: {
				make: (tag, options) => ({
					__smithersFlow: true,
					tag,
					body: options?.body,
					payload: options?.payload,
				}),
			},
		},
		'@smthrs/plan': { Node: { all: (members) => ({ kind: 'all', members }) } },
		'@smthrs/sandbox': {
			CiJob: {
				make: (name, options) => {
					const job = { name, steps: options?.steps, machine: options?.machine, needs: options?.needs }
					return { job, call: () => ({ kind: 'job', job }) }
				},
			},
		},
		effect: {
			Schema: new Proxy(schemaObj, {
				get: (target, key) => (Object.hasOwn(target, key) ? target[key] : inert),
			}),
		},
	}
}

/**
 * Simulates Smithers Cloud's QuickJS Realm.plan & Realm.describe on one workflow file.
 * @param {string} name
 * @param {string} source
 */
export async function verifyWorkflowRealm(name, source) {
	assert(FLOW_NAME_RE.test(name), `Invalid workflow name: ${name}`)
	assert(Buffer.byteLength(source, 'utf8') <= 64 * 1024, `${name}: exceeds 64 KiB Realm limit`)

	for (const match of source.matchAll(IMPORT_RE)) {
		const modName = match[1] ?? match[2] ?? ''
		assert(
			ALLOWED_MODULES.has(modName),
			`${name}: forbidden import/require "${modName}" (Realm only allows ${[...ALLOWED_MODULES].join(', ')})`,
		)
	}

	const stripped = await stripTs(source)
	const cjs = toCommonJs(stripped)
	const modules = createRealmModules()
	const mod = { exports: {} }
	const req = (id) => {
		if (!Object.hasOwn(modules, id)) throw new Error(`Forbidden require: ${id}`)
		return modules[id]
	}
	const script = new Script(`(function(module, exports, require) {\n${cjs}\n})`)
	const fn = script.runInNewContext({}, { timeout: 2000 })
	fn(mod, mod.exports, req)

	const flow = mod.exports.default
	assert(flow && flow.__smithersFlow === true, `${name}: default export must be Flow.make(...)`)
	assert(flow.tag === name, `${name}: Flow.make tag "${flow.tag}" must match filename "${name}"`)
	assert(
		typeof flow.body === 'function',
		`${name}: Flow.make body must be a plain function (Realm does not expose Node.capture)`,
	)

	// Verify payload literal (for manual-run forms)
	if (flow.payload !== undefined) {
		assert(flow.payload !== null && typeof flow.payload === 'object', `${name}: payload must be a field literal object`)
		for (const [fieldName, fieldVal] of Object.entries(flow.payload)) {
			if (['run', 'repo', 'sha', 'ref', 'event'].includes(fieldName)) continue
			assert(
				fieldVal?.__field,
				`${name}: payload field "${fieldName}" is not a Realm-describable primitive/literal Schema`,
			)
		}
	}

	// Plan with sample payload and validate CiJob DAG
	const rootNode = flow.body({
		run: 'verify:1',
		repo: 'evmts/tevm',
		sha: '0'.repeat(40),
		ref: 'refs/heads/main',
		event: 'push',
	})
	const jobs = []
	const walk = (node, depth) => {
		assert(depth <= 8 && node && typeof node === 'object', `${name}: invalid plan node`)
		if (node.kind === 'job') {
			jobs.push(node.job)
			return
		}
		assert(
			node.kind === 'all' && node.members && typeof node.members === 'object',
			`${name}: unsupported plan node kind`,
		)
		for (const member of Object.values(node.members)) walk(member, depth + 1)
	}
	walk(rootNode, 0)
	assert(jobs.length >= 1, `${name}: planned zero jobs`)

	const seen = new Set()
	for (const job of jobs) {
		assert(typeof job.name === 'string' && job.name.length > 0, `${name}: job missing name`)
		assert(!seen.has(job.name), `${name}: duplicate job name "${job.name}"`)
		assert(Array.isArray(job.steps) && job.steps.length > 0, `${name}: job "${job.name}" has no steps`)
		for (const step of job.steps) {
			assert(
				typeof step.name === 'string' && typeof step.run === 'string' && step.run.length > 0,
				`${name}: invalid step in job "${job.name}"`,
			)
		}
		for (const need of job.needs ?? []) {
			assert(seen.has(need), `${name}: job "${job.name}" needs "${need}" which was not declared earlier in the plan`)
		}
		seen.add(job.name)
	}
	return { name, jobCount: jobs.length, jobs: jobs.map((j) => j.name) }
}

/**
 * Validates .smithers/home.json against @smthrs/views Home.ts bounds.
 * @param {unknown} home
 */
export function verifyHomeSchema(home) {
	assert(home && typeof home === 'object' && !Array.isArray(home), 'home.json must be an object')
	const { blocks, sections, contributors = 'role', docs } = /** @type {any} */ (home)
	assert(contributors === 'role' || contributors === 'anyone', 'home.json contributors must be "role" or "anyone"')
	if (docs !== undefined) {
		assert(typeof docs === 'string' && /^https:\/\/[^\s<>"'@]+$/i.test(docs), 'home.json docs must be an https URL')
	}
	const list =
		Array.isArray(sections) && blocks === undefined
			? sections
			: Array.isArray(blocks) && sections === undefined
				? [{ audience: 'everyone', blocks }]
				: null
	assert(list !== null, 'home.json must declare either sections or blocks (not both)')
	assert(list.length <= 8, `home.json declares ${list.length} sections (max 8)`)

	const assertNoHtml = (value, label, maxLen) => {
		if (value === undefined) return
		assert(
			typeof value === 'string' && value.length > 0 && value.length <= maxLen,
			`${label} invalid length (max ${maxLen})`,
		)
		assert(!HTML_TAG_RE.test(value), `${label} must not contain raw HTML tags`)
	}
	const assertSafeUrl = (value, label) => {
		if (value === undefined) return
		assert(typeof value === 'string' && value.length > 0 && value.length <= 2048, `${label} invalid URL length`)
		assert(
			/^(?:https?:\/\/(?![/?#])|\/(?!\/))/i.test(value),
			`${label} must be http(s) or origin-relative path: ${value}`,
		)
		const hasControlChar = [...value].some((ch) => {
			const code = ch.charCodeAt(0)
			return code <= 0x1f || code === 0x7f
		})
		assert(!hasControlChar && !/[\s<>"'\\]/.test(value), `${label} contains unsafe characters: ${value}`)
	}

	let totalBlocks = 0
	for (const section of list) {
		assert(section && typeof section === 'object', 'home.json section must be an object')
		const audience = section.audience ?? 'everyone'
		assert(VALID_AUDIENCES.has(audience), `home.json invalid audience "${audience}"`)
		assertNoHtml(section.title, `section(${audience}).title`, 120)
		assert(Array.isArray(section.blocks), `section(${audience}) missing blocks array`)
		for (const block of section.blocks) {
			totalBlocks += 1
			assert(totalBlocks <= 32, 'home.json exceeds maximum 32 blocks')
			assert(
				block && typeof block === 'object' && VALID_BLOCK_TYPES.has(block.type),
				`Invalid home block type: ${block?.type}`,
			)
			assertNoHtml(block.title, `${block.type}.title`, 120)
			if (block.type === 'hero') {
				assertNoHtml(block.tagline, 'hero.tagline', 280)
				assertNoHtml(block.text, 'hero.text', 280)
				assertNoHtml(block.install, 'hero.install', 280)
				if (block.actions) {
					assert(block.actions.length >= 1 && block.actions.length <= 3, 'hero.actions must have 1..3 items')
					for (const a of block.actions) {
						assertNoHtml(a.label, 'hero.action.label', 120)
						assertSafeUrl(a.url, 'hero.action.url')
					}
				}
				if (block.announcement) {
					assertNoHtml(block.announcement.label, 'hero.announcement.label', 120)
					assertSafeUrl(block.announcement.url, 'hero.announcement.url')
				}
			} else if (block.type === 'code') {
				assert(
					typeof block.code === 'string' && block.code.length > 0 && block.code.length <= 4096,
					'code block invalid length',
				)
				assertNoHtml(block.file, 'code.file', 120)
			} else if (block.type === 'stats') {
				assert(
					Array.isArray(block.stats) && block.stats.length >= 1 && block.stats.length <= 6,
					'stats must have 1..6 entries',
				)
				for (const s of block.stats) {
					assertNoHtml(s.value, 'stat.value', 120)
					assertNoHtml(s.label, 'stat.label', 120)
				}
			} else if (block.type === 'cards') {
				assert(
					Array.isArray(block.cards) && block.cards.length >= 1 && block.cards.length <= 12,
					'cards must have 1..12 entries',
				)
				for (const c of block.cards) {
					assertNoHtml(c.title, 'card.title', 120)
					assertNoHtml(c.text, 'card.text', 280)
					assertNoHtml(c.label, 'card.label', 120)
					assertSafeUrl(c.url, 'card.url')
				}
				if (block.more) {
					assertNoHtml(block.more.label, 'cards.more.label', 120)
					assertSafeUrl(block.more.url, 'cards.more.url')
				}
			} else if (block.type === 'links') {
				assert(
					Array.isArray(block.links) && block.links.length >= 1 && block.links.length <= 12,
					'links must have 1..12 entries',
				)
				for (const l of block.links) {
					assertNoHtml(l.label, 'link.label', 120)
					assertSafeUrl(l.url, 'link.url')
				}
			} else if (block.type === 'releases') {
				assert(
					Array.isArray(block.releases) && block.releases.length >= 1 && block.releases.length <= 12,
					'releases must have 1..12 entries',
				)
				for (const r of block.releases) {
					assertNoHtml(r.name, 'release.name', 120)
					assertSafeUrl(r.url, 'release.url')
					assert(/^\d{4}-\d{2}-\d{2}$/.test(r.date), `release.date must be YYYY-MM-DD: ${r.date}`)
					assertNoHtml(r.summary, 'release.summary', 280)
				}
			} else if (block.type === 'text') {
				assertNoHtml(block.text, 'text.text', 4096)
			} else if (block.type === 'action') {
				assert(typeof block.flow === 'string' && block.flow.length > 0, 'action.flow required')
				if (block.key !== undefined) assert(/^[a-z]$/.test(block.key), 'action.key must be single lowercase letter')
			}
		}
	}
	return { sections: list.length, totalBlocks }
}

/**
 * Audits all .smithers/workflows/*.ts, .smithers/factory.json triggers, and .smithers/home.json.
 * @param {string} [root]
 */
export async function verifyCloudFactory(root = repositoryRoot) {
	const workflowsDir = resolve(root, '.smithers/workflows')
	const files = (await readdir(workflowsDir))
		.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.d.ts'))
		.sort()
	assert(files.length > 0, 'No Smithers Cloud workflows found in .smithers/workflows/')

	const planned = []
	for (const file of files) {
		const name = basename(file, '.ts')
		const source = await readFile(resolve(workflowsDir, file), 'utf8')
		planned.push(await verifyWorkflowRealm(name, source))
	}

	const factoryJson = await readJson(resolve(root, '.smithers/factory.json'))
	const triggers = factoryJson?.contributes?.triggers
	if (factoryJson.apiVersion === 1 && Array.isArray(triggers)) {
		assert(triggers.length <= 64, 'factory.json exceeds max 64 triggers')
		for (const trigger of triggers) {
			assert(TRIGGER_EVENTS.has(trigger.on), `Unsupported trigger event: ${trigger.on}`)
			assert(FLOW_NAME_RE.test(trigger.flow), `Invalid triggered flow name: ${trigger.flow}`)
			if (trigger.on === 'cron') {
				assert(
					typeof trigger.cron === 'string' && FIVE_FIELDS_RE.test(trigger.cron),
					`Invalid 5-field cron: ${trigger.cron}`,
				)
			}
			const existsWorkflow =
				existsSync(resolve(root, `.smithers/workflows/${trigger.flow}.vibe`)) ||
				existsSync(resolve(root, `.smithers/workflows/${trigger.flow}.ts`)) ||
				existsSync(resolve(root, `.smithers/flows/${trigger.flow}/flow.ts`))
			assert(existsWorkflow, `Trigger references missing workflow "${trigger.flow}"`)
		}
	}

	const homeJson = await readJson(resolve(root, '.smithers/home.json'))
	const homeStats = verifyHomeSchema(homeJson)

	return {
		ok: true,
		workflows: planned,
		triggerCount: Array.isArray(triggers) ? triggers.length : 0,
		home: homeStats,
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = await verifyCloudFactory()
	console.log(
		`smithers cloud factory ok: ${result.workflows.length} realm workflows (${result.workflows.map((w) => w.name).join(', ')}), ${result.triggerCount} triggers, home ${result.home.sections} sections / ${result.home.totalBlocks} blocks`,
	)
}
