/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'

const Shell = scopedShell('configs/tsconfig')

// The shared tsconfig preset. The package has no scripts: it publishes the
// base.json preset as-is, so the only targets are the preset filegroup and
// the pack checks.
const packageJson = S.file('package.json')

// The published preset. The manifest's files allowlist is exactly this.
const srcs = S.Filegroup({
	srcs: S.glob(['base.json']),
})

const pack = S.Npm.Pack({
	manifest: packageJson,
	data: [srcs],
})

const packageLint = Shell.Test({
	command: 'pnpm exec publint --strict . && pnpm exec attw --pack .',
	data: [pack],
})

export const Package = S.Package({
	targets: { pack, packageLint, srcs },
})
