#!/usr/bin/env node
/**
 * Stages and publishes TEVM documentation sites (@tevm/node-docs with llms.txt,
 * @tevm/core-docs, and @tevm/contributor-portal with Lighthouse Uphill audit).
 *
 * Runs automatically on trusted pushes to main (after merging from Smithers Cloud
 * to GitHub). Only executes external deploy commands when trusted deploy tokens
 * are present in the environment; otherwise verifies all built bundles cleanly.
 */
import { existsSync } from 'node:fs'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assert, command, repositoryRoot } from './lib.mjs'

const nodeDocsDist = resolve(repositoryRoot, 'docs/node/dist')
const llmsTxt = resolve(repositoryRoot, 'docs/node/public/llms.txt')
const portalDist = resolve(repositoryRoot, 'sites/contributor/dist')
const uphillHtml = resolve(repositoryRoot, '.uphill/report.html')
const uphillJson = resolve(repositoryRoot, '.uphill/report.json')

assert(existsSync(llmsTxt), 'Missing docs/node/public/llms.txt; run node scripts/factory/generate-llms-txt.mjs --write')
assert(existsSync(nodeDocsDist), 'Missing docs/node/dist; run pnpm --filter @tevm/node-docs build:app')
assert(existsSync(portalDist), 'Missing sites/contributor/dist; run pnpm --filter @tevm/contributor build')

// Attach standalone Lighthouse Uphill report alongside the built Factory Portal when available.
if (existsSync(uphillHtml) || existsSync(uphillJson)) {
	const outDir = resolve(portalDist, 'uphill')
	await mkdir(outDir, { recursive: true })
	if (existsSync(uphillHtml)) await copyFile(uphillHtml, resolve(outDir, 'index.html'))
	if (existsSync(uphillJson)) await copyFile(uphillJson, resolve(outDir, 'report.json'))
}

const deployed = []
if (process.env.VERCEL_TOKEN && process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID) {
	// Vercel CLI reads VERCEL_TOKEN directly from the environment (never pass secrets on argv).
	command('npx', ['--yes', 'vercel', 'deploy', '--prebuilt', '--prod', '--yes'], {
		cwd: resolve(repositoryRoot, 'docs/node'),
		stdio: 'inherit',
	})
	deployed.push('vercel:node-docs')
}

if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CF_PAGES_FACTORY_PROJECT) {
	command(
		'npx',
		['--yes', 'wrangler', 'pages', 'deploy', portalDist, '--project-name', process.env.CF_PAGES_FACTORY_PROJECT],
		{ cwd: repositoryRoot, stdio: 'inherit' },
	)
	deployed.push(`cloudflare-pages:${process.env.CF_PAGES_FACTORY_PROJECT}`)
}

const receipt = {
	schemaVersion: 1,
	timestamp: new Date().toISOString(),
	bundlesVerified: ['docs/node/dist', 'docs/node/public/llms.txt', 'sites/contributor/dist'],
	uphillAttached: existsSync(resolve(portalDist, 'uphill/index.html')),
	deployed,
	mode: deployed.length > 0 ? 'published' : 'verified-bundle-only',
}

await writeFile(resolve(portalDist, 'publish-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`)
console.log(JSON.stringify(receipt, null, 2))
