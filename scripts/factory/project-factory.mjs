#!/usr/bin/env node
/**
 * Projects .smithers/FACTORY.ts into .smithers/factory.json and .smithers/home.json,
 * or verifies zero drift when run without --write.
 *
 * Also validates the projected home.json against @smthrs/views Home.ts bounds and
 * factory.json triggers against Smithers Cloud Triggers.vibe & Realm.vibe rules.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assert, repositoryRoot } from './lib.mjs'
import { verifyCloudFactory, verifyHomeSchema } from './verify-cloud-workflows.mjs'

const factoryOut = resolve(repositoryRoot, '.smithers/factory.json')
const homeOut = resolve(repositoryRoot, '.smithers/home.json')
const sourcePath = resolve(repositoryRoot, '.smithers/FACTORY.ts')

const write = process.argv.includes('--write')
const mod = await import(pathToFileURL(sourcePath).href)
assert(
	mod.factoryDeclaration && mod.homeDeclaration,
	'.smithers/FACTORY.ts must export factoryDeclaration and homeDeclaration',
)

verifyHomeSchema(mod.homeDeclaration)

const renderedFactory = `${JSON.stringify(mod.factoryDeclaration, null, 2)}\n`
const renderedHome = `${JSON.stringify(mod.homeDeclaration, null, 2)}\n`

// Enforce public copy hygiene on home.json (no em dashes anywhere in user-facing copy).
assert(!renderedHome.includes('\u2014'), '.smithers/home.json must not contain em dashes in user-facing copy')

if (write) {
	await writeFile(factoryOut, renderedFactory)
	await writeFile(homeOut, renderedHome)
	const verified = await verifyCloudFactory(repositoryRoot)
	console.log(
		`projected .smithers/factory.json (${mod.factoryDeclaration.flows.length} flows, ${verified.triggerCount} triggers) and .smithers/home.json (${verified.home.sections} sections, ${verified.home.totalBlocks} blocks)`,
	)
} else {
	const currentFactory = await readFile(factoryOut, 'utf8')
	const currentHome = await readFile(homeOut, 'utf8')
	assert(
		currentFactory === renderedFactory,
		'.smithers/factory.json drifted from .smithers/FACTORY.ts; run node scripts/factory/project-factory.mjs --write',
	)
	assert(
		currentHome === renderedHome,
		'.smithers/home.json drifted from .smithers/FACTORY.ts; run node scripts/factory/project-factory.mjs --write',
	)
	const verified = await verifyCloudFactory(repositoryRoot)
	console.log(
		`factory projection ok: ${mod.factoryDeclaration.flows.length} flows, ${verified.triggerCount} triggers, ${verified.home.sections} home sections / ${verified.home.totalBlocks} blocks`,
	)
}
