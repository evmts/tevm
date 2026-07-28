#!/usr/bin/env node
import { createRequire } from 'node:module'
import Pastel from 'pastel'
import { normalizeGlobalOptions } from './utils/global-options.js'

const packageJson = createRequire(import.meta.url)('../package.json') as { version: string }

const app = new Pastel({
	name: 'tevm',
	version: packageJson.version,
	description: 'Tevm CLI tool',
	importMeta: import.meta,
})

const { argv } = normalizeGlobalOptions(process.argv)
await app.run(argv)
