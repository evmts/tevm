/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'

// A DNSSEC repro fixture used while debugging the memory client. The
// package has no scripts, so this file declares only the source groups and
// a typecheck from its tsconfig. index.spec.ts queries
// cloudflare-dns.com, but no script runs it, so there is no test target;
// one would need the network sandbox.
const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')

// The sources live at the package root, not in src/.
const srcs = S.Filegroup({
	srcs: S.glob(['**/*.ts', '**/*.json', '!node_modules/**', '!**/*.spec.ts', '!**/__snapshots__/**']),
})

const tests = S.Filegroup({
	srcs: S.glob(['**/*.spec.ts', '**/__snapshots__/**', '!node_modules/**']),
})

const deps = S.Npm.WorkspaceDeps({ manifest: packageJson })

// The tsconfig has no include, so it covers every file in the package,
// spec files included: tests are key material here.
const typecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [srcs, tests, deps, tsconfig],
})

export const Package = S.Package({
	targets: { srcs, tests, typecheck },
})
