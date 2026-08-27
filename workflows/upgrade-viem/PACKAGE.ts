/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as root } from '../../PACKAGE.js'

// viem is the peer dependency every published package declares, so a bump
// touches every manifest, the lockfile, the peer ranges (CLAUDE.md: "If we
// upgrade viem we should make sure we update the peer dependency version
// too"), and the snapshots that embed viem's version strings. The write set
// is exactly those files. The gates are the tree-wide typecheck and test
// queries plus the snapshot lint, so a snapshot that flipped from success to
// error is caught as a regression instead of accepted with -u. pnpm install
// needs the registry, hence the network sandbox.
const upgradeViem = S.Agent.Pr({
	agent: S.Agents.luna,
	prompt: S.file('SKILL.md'),
	payload: {
		version: S.Input.Optional(S.Input.String('Target viem version; defaults to the latest release')),
	},
	data: [S.file('//package.json'), S.file('//pnpm-lock.yaml'), S.file('//pnpm-workspace.yaml')],
	changes: [
		'package.json',
		'*/package.json',
		'*/*/package.json',
		'pnpm-lock.yaml',
		'**/__snapshots__/**',
		'**/__rpc_snapshots__/**',
		'**/*.spec.ts',
		'.changeset/**',
	],
	gates: [
		S.Query({ pattern: '//**:typecheck' }),
		S.Query({ pattern: '//**:test' }),
		root.snapshotPathsLint,
		root.changesetLint,
	],
	secrets: [S.Secret('GITHUB_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
	maxRounds: 3,
})

export const Package = S.Package({
	targets: { upgradeViem },
})
