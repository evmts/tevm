/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as root } from '../../PACKAGE.js'

const publicSurface = S.Filegroup({
	srcs: S.glob([
		'//packages/**/src/**/index.{js,ts}',
		'//bundler-packages/**/src/**/index.{js,ts}',
		'//extensions/**/src/**/index.{js,ts}',
		'//lsp/**/src/**/index.{js,ts}',
		'//cli/src/**/index.{js,ts}',
		'//tevm/**/index.ts',
		'//tevm/jsr.json',
		'//docs/node/pages/**',
		'//sites/core/pages/**',
		'//**/typedoc.json',
		'//**/package.json',
	]),
})

// Public symbols are deliberately explicit and therefore easy to omit from a
// recursive barrel, facade, guide, or generated reference page. This codegen
// lane repairs only that fan-out for an already-defined symbol; it cannot
// rewrite the implementation that owns the symbol.
const syncPublicSurface = S.Agent.Diff({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		package: S.Input.String('Owning package directory, e.g. packages/actions'),
		symbol: S.Input.String('Already-defined exported symbol to synchronize'),
		intent: S.Input.Optional(
			S.Input.String('Why the symbol is public and which contributor-facing guide should mention it'),
		),
	},
	data: [publicSurface, S.file('//CLAUDE.md'), S.file('//factory/pr-history.md')],
	changes: [
		'packages/**/src/**/index.js',
		'packages/**/src/**/index.ts',
		'bundler-packages/**/src/**/index.js',
		'bundler-packages/**/src/**/index.ts',
		'extensions/**/src/**/index.js',
		'extensions/**/src/**/index.ts',
		'lsp/**/src/**/index.js',
		'lsp/**/src/**/index.ts',
		'cli/src/**/index.js',
		'cli/src/**/index.ts',
		'tevm/**/index.ts',
		'tevm/jsr.json',
		'packages/**/docs/**',
		'bundler-packages/**/docs/**',
		'extensions/**/docs/**',
		'tevm/docs/**',
		'docs/node/pages/**',
		'sites/core/pages/**',
		'.changeset/**',
	],
	gates: [root.allTypes, root.allDocs, root.allPackageLints, root.changesetCheck],
	maxRounds: 3,
})

export const Package = S.Package({ targets: { syncPublicSurface } })
