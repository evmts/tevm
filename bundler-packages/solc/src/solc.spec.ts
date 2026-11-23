import { describe, expect, it, vi } from 'vitest'
import { createSolc, releases, solcCompile } from './solc.js'
import type { SolcInputDescription, SolcLanguage } from './solcTypes.js'

// Mock the solc module
vi.mock('solc', () => {
	return {
		default: {
			version: vi.fn(() => '0.8.35+commit.47b9dedd.Emscripten.clang'),
			compile: vi.fn((_input: string) => {
				return JSON.stringify({
					contracts: {
						'test.sol': {
							TestContract: {
								abi: [],
								evm: {
									bytecode: {
										object: '0x123456',
									},
								},
							},
						},
					},
				})
			}),
			loadRemoteVersion: vi.fn((_version: string, callback: Function) => {
				callback(null, {
					version: '0.8.28',
					semver: '0.8.28',
					license: 'MIT',
					compile: vi.fn(),
				})
			}),
		},
	}
})

describe('solc', () => {
	it('should export releases', () => {
		// Verify releases object exists and has expected structure
		expect(releases).toBeDefined()
		expect(typeof releases).toBe('object')

		// Check that it contains common Solidity versions
		expect(releases['0.8.28']).toBeDefined()
		expect(releases['0.8.28']).toBe('v0.8.28+commit.7893614a')

		// Check a couple more versions to ensure it's properly populated
		expect(releases['0.8.0']).toBeDefined()
		expect(releases['0.7.6']).toBeDefined()
		expect(releases['0.6.12']).toBeDefined()
	})

	it('should compile solidity code with solcCompile', async () => {
		// Create a mock input
		const mockInput: SolcInputDescription = {
			language: 'Solidity' as SolcLanguage,
			sources: {
				'test.sol': {
					content: 'contract Test {}',
				},
			},
			settings: {
				outputSelection: {
					'*': {
						'*': ['abi', 'evm.bytecode'],
					},
				},
			},
		}

		// Mock solc instance
		const mockSolc = {
			compile: vi.fn((_input: string) => {
				return JSON.stringify({
					contracts: {
						'test.sol': {
							Test: {
								abi: [],
								evm: {
									bytecode: {
										object: '0x123456',
									},
								},
							},
						},
					},
				})
			}),
		}

		// Test solcCompile function
		const result = solcCompile(mockSolc, mockInput)

		// Verify that result has expected structure
		expect(result).toBeDefined()

		if (result.contracts?.['test.sol']?.['Test']) {
			expect(result.contracts['test.sol']['Test'].evm.bytecode.object).toBe('0x123456')
		} else {
			// This will fail if the structure is not as expected
			expect(result.contracts).toBeDefined()
			expect(result.contracts?.['test.sol']).toBeDefined()
			expect(result.contracts?.['test.sol']?.['Test']).toBeDefined()
		}

		// Verify that mockSolc.compile was called with stringified input
		expect(mockSolc.compile).toHaveBeenCalledWith(JSON.stringify(mockInput))
	})

	it('should create a solc instance with createSolc', async () => {
		// Test the createSolc function
		const solc = await createSolc('0.8.28')

		// Verify structure of returned solc instance
		expect(solc).toBeDefined()
		expect(solc.version).toBe('0.8.28')
		expect(solc.semver).toBe('0.8.28')
		expect(solc.license).toBe('MIT')

		// Verify the compile method exists
		expect(solc.compile).toBeDefined()
		expect(typeof solc.compile).toBe('function')
	})
})

describe('solc release ids', () => {
	it('never ends a compiler id in .js, so solc does not request soljson-<id>.js.js', () => {
		for (const id of Object.values(releases)) {
			expect(id).not.toMatch(/\.js$/)
		}
		expect(releases['0.8.24']).toBe('v0.8.24+commit.e11b9ed9')
		expect(releases['0.8.27']).toBe('v0.8.27+commit.40a35a09')
		expect(releases['0.8.30']).toBe('v0.8.30+commit.73712a01')
	})

	it('lists the bundled 0.8.35 compiler', () => {
		expect(releases['0.8.35']).toBe('v0.8.35+commit.47b9dedd')
	})

	it('loads the bundled compiler locally and downloads other releases by exact id', async () => {
		const solc = (await import('solc')).default as any
		solc.loadRemoteVersion.mockClear()
		await createSolc('0.8.35')
		expect(solc.loadRemoteVersion).not.toHaveBeenCalled()
		await createSolc('0.8.30')
		expect(solc.loadRemoteVersion).toHaveBeenCalledWith('v0.8.30+commit.73712a01', expect.any(Function))
	})

	it('rejects unknown releases', async () => {
		await expect(createSolc('9.9.9' as any)).rejects.toThrow('Unknown solc release 9.9.9')
	})
})
