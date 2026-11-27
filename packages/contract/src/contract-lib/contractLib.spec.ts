import { describe, expect, it } from 'vitest'
import { AdvancedContract, ERC20, ERC721, ErrorContract, SimpleContract } from './index.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const ALICE = '0x1111111111111111111111111111111111111111' as const
const BOB = '0x2222222222222222222222222222222222222222' as const
const CONTRACT_ADDR = '0x3333333333333333333333333333333333333333' as const

describe('contract-lib shipped contracts', () => {
	describe('ERC20', () => {
		it('exposes complete metadata, bytecode, and ABI surface', () => {
			expect(ERC20.name).toBe('OzERC20')
			expect(ERC20.address).toBeUndefined()
			expect(ERC20.bytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(ERC20.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(ERC20.bytecode.length).toBeGreaterThan(ERC20.deployedBytecode.length)
			expect(ERC20.humanReadableAbi.length).toBeGreaterThan(10)
			expect(ERC20.abi.length).toBe(ERC20.humanReadableAbi.length)
		})

		it('builds typed deploy, read, write, and event descriptors', () => {
			const deployed = ERC20.deploy('TevmToken', 'TEVM')
			expect(deployed.bytecode).toBe(ERC20.bytecode)
			expect(deployed.args).toEqual(['TevmToken', 'TEVM'])
			expect(deployed.abi).toEqual(ERC20.abi)

			const bound = ERC20.withAddress(CONTRACT_ADDR)
			expect(bound.address).toBe(CONTRACT_ADDR)
			expect(bound.name).toBe(ERC20.name)
			expect(bound.bytecode).toBe(ERC20.bytecode)

			const balanceRead = bound.read.balanceOf(ALICE)
			expect(balanceRead.to).toBe(CONTRACT_ADDR)
			expect(balanceRead.functionName).toBe('balanceOf')
			expect(balanceRead.args).toEqual([ALICE])

			const allowanceRead = bound.read.allowance(ALICE, BOB)
			expect(allowanceRead.functionName).toBe('allowance')
			expect(allowanceRead.args).toEqual([ALICE, BOB])

			const transferWrite = bound.write.transfer(BOB, 1000n)
			expect(transferWrite.to).toBe(CONTRACT_ADDR)
			expect(transferWrite.functionName).toBe('transfer')
			expect(transferWrite.args).toEqual([BOB, 1000n])

			const approveWrite = bound.write.approve(BOB, 500n)
			expect(approveWrite.functionName).toBe('approve')
			expect(approveWrite.args).toEqual([BOB, 500n])

			const transferFromWrite = bound.write.transferFrom(ALICE, BOB, 250n)
			expect(transferFromWrite.functionName).toBe('transferFrom')
			expect(transferFromWrite.args).toEqual([ALICE, BOB, 250n])

			const transferFilter = bound.events.Transfer({ args: { from: ALICE, to: BOB } })
			expect(transferFilter.address).toBe(CONTRACT_ADDR)
			expect(transferFilter.eventName).toBe('Transfer')
			expect(transferFilter.args).toEqual({ from: ALICE, to: BOB })

			const approvalFilter = bound.events.Approval({ args: { owner: ALICE } })
			expect(approvalFilter.eventName).toBe('Approval')
			expect(approvalFilter.args).toEqual({ owner: ALICE })
		})

		it('supports withCode override while preserving ABI and name', () => {
			const patched = ERC20.withCode('0x60006000f3')
			expect(patched.code).toBe('0x60006000f3')
			expect(patched.name).toBe('OzERC20')
			expect(patched.abi).toEqual(ERC20.abi)
			expect(ERC20.code).toBeUndefined()
		})
	})

	describe('ERC721', () => {
		it('exposes complete metadata, events, and overloaded safeTransferFrom', () => {
			expect(ERC721.name).toBe('OzERC721')
			expect(ERC721.bytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(ERC721.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(ERC721.abi.length).toBe(ERC721.humanReadableAbi.length)

			const deploy = ERC721.deploy('TevmNFT', 'TNFT')
			expect(deploy.args).toEqual(['TevmNFT', 'TNFT'])

			const bound = ERC721.withAddress(CONTRACT_ADDR)
			expect(bound.read.ownerOf(1n)).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'ownerOf',
				args: [1n],
			})
			expect(bound.read.getApproved(1n)).toMatchObject({
				functionName: 'getApproved',
				args: [1n],
			})
			expect(bound.read.isApprovedForAll(ALICE, BOB)).toMatchObject({
				functionName: 'isApprovedForAll',
				args: [ALICE, BOB],
			})
			expect(bound.read.supportsInterface('0x80ac58cd')).toMatchObject({
				functionName: 'supportsInterface',
				args: ['0x80ac58cd'],
			})
			expect(bound.read.tokenURI(42n)).toMatchObject({
				functionName: 'tokenURI',
				args: [42n],
			})

			expect(bound.write.approve(BOB, 1n)).toMatchObject({
				functionName: 'approve',
				args: [BOB, 1n],
			})
			expect(bound.write.setApprovalForAll(BOB, true)).toMatchObject({
				functionName: 'setApprovalForAll',
				args: [BOB, true],
			})
			expect(bound.write.safeTransferFrom(ALICE, BOB, 1n)).toMatchObject({
				functionName: 'safeTransferFrom',
				args: [ALICE, BOB, 1n],
			})
			expect(bound.write.safeTransferFrom(ALICE, BOB, 1n, '0x1234')).toMatchObject({
				functionName: 'safeTransferFrom',
				args: [ALICE, BOB, 1n, '0x1234'],
			})

			expect(bound.events.Transfer({ args: { from: ZERO_ADDRESS, to: ALICE, tokenId: 7n } })).toMatchObject({
				address: CONTRACT_ADDR,
				eventName: 'Transfer',
				args: { from: ZERO_ADDRESS, to: ALICE, tokenId: 7n },
			})
			expect(bound.events.ApprovalForAll({ args: { owner: ALICE, operator: BOB } })).toMatchObject({
				eventName: 'ApprovalForAll',
				args: { owner: ALICE, operator: BOB },
			})
		})
	})

	describe('SimpleContract', () => {
		it('encodes constructor, getter, setter, and ValueSet event descriptors', () => {
			expect(SimpleContract.name).toBe('SimpleContract')
			expect(SimpleContract.bytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(SimpleContract.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i)

			const deploy = SimpleContract.deploy(42n)
			expect(deploy.args).toEqual([42n])
			expect(deploy.bytecode).toBe(SimpleContract.bytecode)

			const bound = SimpleContract.withAddress(CONTRACT_ADDR)
			expect(bound.read.get()).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'get',
			})
			expect(bound.write.set(99n)).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'set',
				args: [99n],
			})
			expect(bound.events.ValueSet({})).toMatchObject({
				address: CONTRACT_ADDR,
				eventName: 'ValueSet',
			})
		})
	})

	describe('ErrorContract', () => {
		it('declares all custom error, panic, and revert entrypoints', () => {
			expect(ErrorContract.name).toBe('ErrorContract')
			expect(ErrorContract.bytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(ErrorContract.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i)

			const errorNames = ErrorContract.abi.filter((item) => item.type === 'error').map((item) => item.name)
			expect(errorNames).toEqual(['ErrorWithMultipleParams', 'ErrorWithSingleParam', 'SimpleError'])

			const bound = ErrorContract.withAddress(CONTRACT_ADDR)
			const methods = [
				'errorOutOfGas',
				'errorWithInvalidOpcode',
				'panicWithArithmeticOverflow',
				'panicWithArrayOutOfBounds',
				'panicWithAssertFailure',
				'panicWithDivisionByZero',
				'revertWithCustomErrorMultipleParams',
				'revertWithCustomErrorSingleParam',
				'revertWithRequireAndMessage',
				'revertWithRequireNoMessage',
				'revertWithSimpleCustomError',
				'revertWithStringError',
				'revertWithoutMessage',
			] as const

			for (const method of methods) {
				const action = bound.write[method]()
				expect(action.to).toBe(CONTRACT_ADDR)
				expect(action.functionName).toBe(method)
			}
		})
	})

	describe('AdvancedContract', () => {
		it('builds multi-type constructor, getters, setters, delegatecall, and events', () => {
			expect(AdvancedContract.name).toBe('AdvancedContract')
			expect(AdvancedContract.bytecode).toMatch(/^0x[0-9a-f]+$/i)
			expect(AdvancedContract.deployedBytecode).toMatch(/^0x[0-9a-f]+$/i)

			const deploy = AdvancedContract.deploy(7n, true, 'tevm', ALICE)
			expect(deploy.args).toEqual([7n, true, 'tevm', ALICE])

			const bound = AdvancedContract.withAddress(CONTRACT_ADDR)
			expect(bound.read.getAllValues()).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'getAllValues',
			})
			expect(bound.read.getNumber()).toMatchObject({ functionName: 'getNumber' })
			expect(bound.read.getBool()).toMatchObject({ functionName: 'getBool' })
			expect(bound.read.getString()).toMatchObject({ functionName: 'getString' })
			expect(bound.read.getAddress()).toMatchObject({ functionName: 'getAddress' })
			expect(bound.read.mathHelperAddress()).toMatchObject({ functionName: 'mathHelperAddress' })

			expect(bound.write.setAllValues(123n, false, 'updated', BOB)).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'setAllValues',
				args: [123n, false, 'updated', BOB],
			})
			expect(bound.write.callMathHelper(21n)).toMatchObject({
				functionName: 'callMathHelper',
				args: [21n],
			})
			expect(bound.write.delegateCallMathHelper(21n)).toMatchObject({
				functionName: 'delegateCallMathHelper',
				args: [21n],
			})
			expect(bound.write.setMathHelperAddress(BOB)).toMatchObject({
				functionName: 'setMathHelperAddress',
				args: [BOB],
			})

			expect(bound.events.AllValuesSet({})).toMatchObject({
				address: CONTRACT_ADDR,
				eventName: 'AllValuesSet',
			})
			expect(bound.events.ExternalCallResult({})).toMatchObject({
				eventName: 'ExternalCallResult',
			})
			expect(bound.events.DelegateCallResult({})).toMatchObject({
				eventName: 'DelegateCallResult',
			})
		})
	})

	describe('contract immutability, address checksumming, and metadata invariants', () => {
		it('checksums lowercase addresses via withAddress without mutating the source contract', () => {
			const lower = '0x6b175474e89094c44da98b954eedeac495271d0f' as const
			const checksummed = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
			const contracts = [ERC20, ERC721, SimpleContract, ErrorContract, AdvancedContract] as const

			for (const contract of contracts) {
				expect(contract.address).toBeUndefined()
				const bound = contract.withAddress(lower)
				expect(bound.address).toBe(checksummed)
				expect(contract.address).toBeUndefined()
				expect(bound.name).toBe(contract.name)
				expect(bound.abi).toEqual(contract.abi)
				expect(bound.humanReadableAbi).toEqual(contract.humanReadableAbi)
				expect(bound.bytecode).toBe(contract.bytecode)
				expect(bound.deployedBytecode).toBe(contract.deployedBytecode)
			}
		})

		it('attaches action creator metadata (.abi, .humanReadableAbi, .address) on read, write, and event creators', () => {
			const bound = ERC20.withAddress(CONTRACT_ADDR)
			expect(bound.read.balanceOf.abi.length).toBeGreaterThan(0)
			expect(bound.read.balanceOf.address).toBe(CONTRACT_ADDR)
			expect(bound.read.balanceOf.humanReadableAbi.length).toBeGreaterThan(0)

			expect(bound.write.transfer.abi.length).toBeGreaterThan(0)
			expect(bound.write.transfer.address).toBe(CONTRACT_ADDR)
			expect(bound.write.transfer.humanReadableAbi.length).toBeGreaterThan(0)

			expect(bound.events.Transfer.eventName).toBe('Transfer')
			expect(bound.events.Transfer.address).toBe(CONTRACT_ADDR)
			expect(bound.events.Transfer.bytecode).toBe(ERC20.bytecode)
			expect(bound.events.Transfer.deployedBytecode).toBe(ERC20.deployedBytecode)
			expect(bound.events.Transfer.abi).toHaveLength(1)
			expect(bound.events.Transfer.humanReadableAbi[0]).toContain('event Transfer')
		})

		it('preserves chained withCode and withAddress combinations', () => {
			const customRuntime = '0x602a60005260206000f3' as const
			const configured = SimpleContract.withCode(customRuntime).withAddress(CONTRACT_ADDR)
			expect(configured.code).toBe(customRuntime)
			expect(configured.address).toBe(CONTRACT_ADDR)
			expect(configured.read.get()).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'get',
				code: customRuntime,
			})
			expect(configured.write.set(5n)).toMatchObject({
				to: CONTRACT_ADDR,
				functionName: 'set',
				args: [5n],
				code: customRuntime,
			})
		})

		it('includes no duplicate function+input signatures in ERC20 and SimpleContract ABIs', () => {
			for (const contract of [ERC20, SimpleContract, ErrorContract, AdvancedContract]) {
				const seen = new Set<string>()
				for (const sig of contract.humanReadableAbi) {
					expect(seen.has(sig)).toBe(false)
					seen.add(sig)
				}
			}
		})
	})
})
