/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from '@smthrs/targets'
import { scopedShell } from '../../factory/scoped-shell.js'
import { Package as client } from './packages/client/PACKAGE.js'
import { Package as contracts } from './packages/contracts/PACKAGE.js'

const Shell = scopedShell('examples/mud')

// The MUD example is a nested pnpm workspace. Its root scripts fan out to
// the two child packages or install tools, so this file holds no srcs. The
// dev:client and dev:contracts scripts are pnpm --filter forwards; the
// child packages declare their own dev targets, so they are not repeated
// here.
const mprocsConfig = S.file('mprocs.yaml')

// build. `pnpm recursive run build` over the nested workspace, as a suite
// of the child packages' own build targets.
const build = S.Suite({
	tests: [client.build, contracts.build],
})

// test. `pnpm recursive run test`. The client's test script is a typecheck
// (declared as //examples/mud/packages/client:typecheck); the contracts
// package runs forge tests through mud.
const test = S.Suite({
	tests: [client.typecheck, contracts.test],
})

// dev. mprocs runs the whole local stack from mprocs.yaml: anvil, mud
// dev-contracts, the client vite server, and the MUD explorer. It
// multiplexes interactive terminals, so it cannot run in a sandbox.
const dev = Shell.Serve({
	bin: S.NodeModule.Bin('mprocs'),
	data: [mprocsConfig],
	readiness: { port: 5173 },
	sandbox: 'none',
})

// foundry:up. The foundry installer: curls foundry.paradigm.xyz and runs
// foundryup. Keyed on its args alone; the workspace's host layer owns the
// installed toolchain afterwards.
const foundryUp = Shell.Run({
	bin: S.Host.bin('bash'),
	args: ['-c', 'curl -L https://foundry.paradigm.xyz | bash && bash $HOME/.foundry/bin/foundryup'],
	sandbox: { network: true },
})

// mud:up. Upgrades the MUD packages to the main tag. The script then runs
// `pnpm install`, which the workspace's install layer owns.
const mudUp = Shell.Run({
	bin: S.PackageManager.bin,
	args: ['mud', 'set-version', '--tag', 'main'],
	sandbox: { network: true },
})

// prepare. pnpm runs it on install: use the host forge if present, else
// install foundry. Modeled as the install branch; the check branch is the
// workspace's host layer declaring forge.
const prepare = Shell.Run({
	bin: S.Host.bin('bash'),
	args: ['-c', 'forge --version || pnpm foundry:up'],
	sandbox: { network: true },
})

export const Package = S.Package({
	targets: {
		build,
		dev,
		foundryUp,
		mudUp,
		prepare,
		test,
	},
})
