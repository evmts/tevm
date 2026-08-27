/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// Shared docs-site sources consumed by sites/core. The package has no
// scripts and no build: its exports map points at src/ directly, so the
// only target is the source filegroup other sites key on.
const srcs = S.Filegroup({
	srcs: S.glob(['src/**']),
})

export const Package = S.Package({
	targets: {
		srcs,
	},
})
