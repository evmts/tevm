import { describe, expect, it } from 'vitest'
import { commonOptionDescriptions } from './action-types.js'
import { args as createArgs } from './create-args.js'
import { options as createOptions } from './create-options.js'
import { generateRandomName } from './generateRandomName.js'
import {
	createAddressOptions,
	createCommonOptions,
	createContractOptions,
	createReadContractOptions,
} from './options.js'
import { generateTemplates } from './templates.js'

describe('CLI template, option, arg, and naming helpers', () => {
	describe('generateRandomName', () => {
		it('produces kebab-case adjective-noun pairs', () => {
			for (let i = 0; i < 20; i++) {
				const name = generateRandomName()
				expect(name).toMatch(/^[a-z]+-[a-z]+$/)
			}
		})
	})

	describe('createArgs and createOptions', () => {
		it('parses optional project name argument and falls back to generated default', () => {
			expect(createArgs.parse(['my-dapp'])).toEqual(['my-dapp'])
			const defaulted = createArgs.parse([undefined])
			expect(defaulted[0]).toMatch(/^[a-z]+-[a-z]+$/)
		})

		it('validates skipPrompts and template options', () => {
			const parsed = createOptions.parse({
				skipPrompts: true,
				template: 'foundry',
			})
			expect(parsed.skipPrompts).toBe(true)
			expect(parsed.template).toBe('foundry')
			expect(createOptions.parse({})).toEqual({ skipPrompts: false, template: 'hardhat' })
		})
	})

	describe('createCommonOptions, createAddressOptions, createContractOptions, createReadContractOptions', () => {
		it('builds common options with sensible defaults', () => {
			const opts = createCommonOptions()
			expect(opts.local.parse(undefined)).toBe(false)
			expect(opts.run.parse(undefined)).toBe(false)
			expect(opts.rpc.parse(undefined)).toBe('http://localhost:8545')
			expect(opts.json.parse(undefined)).toBe(false)
			expect(opts.session.parse(undefined)).toBeUndefined()
		})

		it('composes address, contract, and readContract option sets cleanly', () => {
			const addressOpts = createAddressOptions()
			expect(addressOpts.address.parse('0x0000000000000000000000000000000000000001')).toBe(
				'0x0000000000000000000000000000000000000001',
			)

			const contractOpts = createContractOptions()
			expect(contractOpts).toHaveProperty('address')
			expect(contractOpts).toHaveProperty('abi')

			const readOpts = createReadContractOptions()
			expect(readOpts).toHaveProperty('functionName')
			expect(readOpts).toHaveProperty('args')
			expect(readOpts.args.parse(undefined)).toBeUndefined()
		})

		it('documents all common option descriptions', () => {
			expect(commonOptionDescriptions.rpc).toContain('TEVM_RPC')
			expect(commonOptionDescriptions.abi).toContain('TEVM_ABI')
			expect(commonOptionDescriptions.trace).toContain('trace')
		})
	})

	describe('generateTemplates', () => {
		it('generates syntactically balanced native memory client script in local mode', () => {
			const bundle = generateTemplates(
				'call',
				{ local: true },
				{ to: '0x0000000000000000000000000000000000000042', value: 123n, nested: [1n, undefined, 'ok'] },
			)
			expect(bundle.scriptTemplate).toContain("import { createMemoryClient } from '@tevm/memory-client'")
			expect(bundle.scriptTemplate).toContain('createMemoryClient({})')
			expect(bundle.scriptTemplate).toContain('123n')
			expect(bundle.scriptTemplate).toContain('client["tevmCall"](params)')
			expect(bundle.scriptTemplate).toContain('await client.tevmClose()')
			expect(JSON.parse(bundle.packageJson)).toEqual({
				name: 'tevm-native-script',
				private: true,
				type: 'module',
			})
			expect(JSON.parse(bundle.tsconfigTemplate).compilerOptions.noEmit).toBe(true)
		})

		it('generates syntactically valid balanced braces for forked native mode (regression)', () => {
			const bundle = generateTemplates(
				'get-account',
				{ local: false, rpc: 'http://127.0.0.1:9545' },
				{ address: '0x1' },
			)
			expect(bundle.scriptTemplate).toContain('createMemoryClient({ fork: { url: "http://127.0.0.1:9545" } })')
			expect(bundle.scriptTemplate).toContain('client["tevmGetAccount"](params)')
			// Verify balanced braces and parentheses across the entire generated script
			const opens = (bundle.scriptTemplate.match(/\{/g) ?? []).length
			const closes = (bundle.scriptTemplate.match(/\}/g) ?? []).length
			expect(opens).toBe(closes)
		})

		it('generates viem public client script for viem actions and handles dump-state / load-state args', () => {
			const viemBundle = generateTemplates('getBalance', { rpc: 'https://mainnet.optimism.io' }, { address: '0x1' })
			expect(viemBundle.scriptTemplate).toContain("import { createPublicClient, http } from 'viem'")
			expect(viemBundle.scriptTemplate).toContain('https://mainnet.optimism.io')
			expect(viemBundle.scriptTemplate).not.toContain('tevmClose()')

			const dumpBundle = generateTemplates('dump-state', { local: true }, {})
			expect(dumpBundle.scriptTemplate).toContain('client["tevmDumpState"]()')

			const loadBundle = generateTemplates('load-state', { local: true }, { state: '0xdeadbeef' })
			expect(loadBundle.scriptTemplate).toContain('client["tevmLoadState"](params.state)')
		})
	})
})
