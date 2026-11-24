/// <reference path="../../smithers.d.ts" />
const S = Smithers

import { Package as viemExt } from '../../extensions/viem/PACKAGE.js'
import { scopedShell } from '../../factory/scoped-shell.js'
import { Package as actions } from '../../packages/actions/PACKAGE.js'
import { Package as common } from '../../packages/common/PACKAGE.js'
import { Package as contract } from '../../packages/contract/PACKAGE.js'
import { Package as errors } from '../../packages/errors/PACKAGE.js'
import { Package as httpClient } from '../../packages/http-client/PACKAGE.js'
import { Package as jsonrpc } from '../../packages/jsonrpc/PACKAGE.js'
import { Package as mcp } from '../../packages/mcp/PACKAGE.js'
import { Package as memoryClient } from '../../packages/memory-client/PACKAGE.js'
import { Package as nodePkg } from '../../packages/node/PACKAGE.js'
import { Package as predeploys } from '../../packages/predeploys/PACKAGE.js'
import { Package as server } from '../../packages/server/PACKAGE.js'
import { Package as utils } from '../../packages/utils/PACKAGE.js'
import { Package as tevmFacade } from '../../tevm/PACKAGE.js'

const Shell = scopedShell('test/fuzz')

const packageJson = S.file('package.json')
const tsconfig = S.file('tsconfig.json')
const vitestConfig = S.file('vitest.config.ts')
const rootBiomeConfig = S.file('//biome.json')
const nativePins = S.file('//factory/native-dependencies.json')

const harnessShared = S.Filegroup({
	srcs: [packageJson, tsconfig, vitestConfig, S.file('src/config.ts'), S.file('src/arbitraries.ts')],
})

const nodeSpecs = S.Filegroup({
	srcs: [S.file('src/engine.fuzz.spec.ts'), S.file('src/evm-state-machine.fuzz.spec.ts')],
})

const clientSpecs = S.Filegroup({
	srcs: [S.file('src/abi-memory-client.fuzz.spec.ts'), S.file('src/fork-and-facade.fuzz.spec.ts')],
})

const serverSpecs = S.Filegroup({
	srcs: [S.file('src/server-protocol.fuzz.spec.ts'), S.file('src/jsonrpc-http-errors.fuzz.spec.ts')],
})

const mcpSpecs = S.Filegroup({
	srcs: [S.file('src/mcp.fuzz.spec.ts')],
})

const effectSpecs = S.Filegroup({
	srcs: [S.file('src/effect-feedback.fuzz.spec.ts')],
})

const jazzerSrcs = S.Filegroup({
	srcs: S.glob(['jazzer/**', 'scripts/**', '__fuzz__/**']),
})

const allSources = S.Filegroup({
	srcs: S.glob([
		'package.json',
		'tsconfig.json',
		'vitest.config.ts',
		'src/**',
		'jazzer/**',
		'scripts/**',
		'__fuzz__/**',
	]),
})

// Fine-grained per-slice Vitest fuzz targets: each keys strictly on its exact
// upstream package builds instead of coarse root.allBuilds so editing one
// package only invalidates the fuzz slices that exercise it.
const testNode = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/engine.fuzz.spec.ts', 'src/evm-state-machine.fuzz.spec.ts'],
	data: [harnessShared, nodeSpecs, nodePkg.build, actions.build, errors.build, utils.build, nativePins],
	sandbox: { network: 'loopback' },
})

const testClient = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/abi-memory-client.fuzz.spec.ts', 'src/fork-and-facade.fuzz.spec.ts'],
	data: [
		harnessShared,
		clientSpecs,
		memoryClient.build,
		actions.build,
		contract.build,
		predeploys.build,
		server.build,
		nodePkg.build,
		viemExt.build,
		tevmFacade.dist,
		nativePins,
	],
	sandbox: { network: 'loopback' },
})

const testServer = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/server-protocol.fuzz.spec.ts', 'src/jsonrpc-http-errors.fuzz.spec.ts'],
	data: [
		harnessShared,
		serverSpecs,
		server.build,
		server.srcs,
		memoryClient.build,
		nodePkg.build,
		jsonrpc.build,
		httpClient.build,
		errors.build,
		utils.build,
		common.build,
		nativePins,
	],
	sandbox: { network: 'loopback' },
})

const testMcp = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/mcp.fuzz.spec.ts'],
	data: [harnessShared, mcpSpecs, mcp.build, memoryClient.build, nodePkg.build, nativePins],
	sandbox: { network: 'loopback' },
})

const effectFuzz = Shell.Test({
	bin: S.NodeModule.Bin('vitest'),
	args: ['run', 'src/effect-feedback.fuzz.spec.ts'],
	env: { TEVM_FUZZ_MODE: 'campaign', TEVM_FUZZ_EFFECT_EXECUTIONS: '5000' },
	data: [harnessShared, effectSpecs, nodePkg.build, server.build, server.srcs, mcp.build, nativePins],
	sandbox: { network: 'loopback' },
})

const jazzer = Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/run-jazzer.mjs'],
	env: { JAZZER_SECONDS: '5' },
	data: [packageJson, jazzerSrcs, nodePkg.build, server.build, server.srcs, mcp.build, jsonrpc.build, nativePins],
	sandbox: { network: 'loopback' },
})

const typecheck = Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['--noEmit'],
	data: [
		allSources,
		actions.types,
		common.types,
		contract.types,
		errors.types,
		httpClient.types,
		jsonrpc.types,
		mcp.types,
		memoryClient.types,
		nodePkg.types,
		predeploys.types,
		server.types,
		tevmFacade.types,
		utils.types,
		viemExt.types,
	],
})

const lint = Shell.Test({
	bin: S.NodeModule.Bin('@biomejs/biome'),
	args: ['check', '.'],
	data: [allSources, rootBiomeConfig],
})

const test = S.Suite({
	tests: [testNode, testClient, testServer, testMcp, effectFuzz],
})

const all = S.Suite({
	tests: [test, jazzer, typecheck, lint],
})

export const Package = S.Package({
	targets: {
		all,
		effectFuzz,
		jazzer,
		lint,
		test,
		testClient,
		testMcp,
		testNode,
		testServer,
		typecheck,
	},
})
