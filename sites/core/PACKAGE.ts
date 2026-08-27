/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { Package as shared } from '../shared/PACKAGE.js'

// The tevm.sh docs site (vocs). It depends on @tevm/docs-shared for its
// config, site links, and styles, and its samples are verified against the
// published tevm package rather than the workspace one.
const packageJson = S.file('package.json')
const vocsConfig = S.file('vocs.config.ts')

const srcs = S.Filegroup({
	srcs: S.glob(['pages/**', 'styles.css']),
})

const scripts = S.Filegroup({
	srcs: S.glob(['scripts/**']),
})

const build = S.Shell.Build({
	bin: S.NodeModule.Bin('vocs'),
	args: ['build'],
	data: [srcs, shared.srcs, vocsConfig, packageJson],
	outDirs: ['dist'],
})

const dev = S.Shell.Serve({
	bin: S.NodeModule.Bin('vocs'),
	args: ['dev'],
	data: [srcs, shared.srcs, vocsConfig],
	readiness: { port: 5173 },
})

const preview = S.Shell.Serve({
	bin: S.NodeModule.Bin('vocs'),
	args: ['preview'],
	data: [build],
	readiness: { port: 4173 },
})

// verify:samples. scripts/verify-samples.mjs extracts the fenced samples from
// pages/ and runs each one against the tevm package resolved from this site's
// node_modules, asserting it is the published 1.0.0-rc.151 and not the
// workspace link, so the docs are proven against what a reader installs. The
// pin lives in the script; bumping it is part of a release.
const verifySamples = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/verify-samples.mjs'],
	data: [srcs, scripts, packageJson],
})

// The `verify` script: samples, then the build.
const verify = S.Suite({
	tests: [verifySamples, build],
})

// The site ships through Vercel, so deployment is its own rule with the
// platform's token. Deploys are outward actions.
const deploy = S.Vercel.Deploy({
	site: build,
	gates: [verifySamples],
	secrets: [S.Secret('VERCEL_TOKEN')],
	sandbox: { network: true },
	approval: 'required',
})

const clean = S.Clean({
	targets: [build],
	paths: ['dist'],
})

export const Package = S.Package({
	targets: { build, clean, deploy, dev, preview, srcs, verify, verifySamples },
})
