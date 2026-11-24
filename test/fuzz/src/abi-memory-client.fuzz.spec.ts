import { createContract } from '@tevm/contract'
import { createMemoryClient } from '@tevm/memory-client'
import { definePredeploy } from '@tevm/predeploys'
import { tevmViemExtension } from '@tevm/viem'
import fc from 'fast-check'
import { createClient, custom, getAddress, type Hex, parseAbi, toHex } from 'viem'
import { foundry } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
	addressArb,
	buildConstantReturnRuntime,
	buildDeployInitcode,
	bytes32Arb,
	hexBytesArb,
	int256Arb,
	u256Arb,
} from './arbitraries.js'
import { fcParams } from './config.js'

/**
 * EVM runtime that strips the 4-byte Solidity function selector and returns
 * calldata[4..] unchanged — a universal ABI encode -> EVM -> decode round-trip oracle!
 *
 * 0x00: 60 04       PUSH1 0x04
 * 0x02: 36          CALLDATASIZE
 * 0x03: 03          SUB            (len = calldatasize - 4)
 * 0x04: 80          DUP1           (stack: len, len)
 * 0x05: 60 04       PUSH1 0x04     (src = 4)
 * 0x07: 60 00       PUSH1 0x00     (dst = 0)
 * 0x09: 37          CALLDATACOPY
 * 0x0a: 60 00       PUSH1 0x00
 * 0x0c: f3          RETURN
 */
const ABI_ECHO_RUNTIME: Hex = '0x600436038060046000376000f3'

const echoHumanAbi = [
	'function echoPrimitives(uint256 u, int256 s, address a, bool b, bytes32 h) pure returns (uint256, int256, address, bool, bytes32)',
	'function echoDynamic(string text, bytes payload, uint256[] nums) pure returns (string, bytes, uint256[])',
	'function echoTuple((address owner, uint256 amount, string label, bytes data) item) pure returns ((address owner, uint256 amount, string label, bytes data))',
	'event Echoed(address indexed who, uint256 value)',
] as const

describe('@tevm/memory-client, @tevm/contract, @tevm/predeploys, and viem/ethers extension fuzzing', () => {
	it('fuzz: ABI encoding -> native ZEVM execution -> ABI decoding round-trips every Solidity type losslessly', async () => {
		const client = createMemoryClient()
		const echoAddress = getAddress('0x000000000000000000000000000000000000ab10')
		const contract = createContract({
			name: 'AbiEcho',
			humanReadableAbi: echoHumanAbi,
			deployedBytecode: ABI_ECHO_RUNTIME,
		}).withAddress(echoAddress)

		try {
			await client.tevmReady()
			await client.tevmSetAccount({
				address: echoAddress,
				deployedBytecode: ABI_ECHO_RUNTIME,
			})

			await fc.assert(
				fc.asyncProperty(
					u256Arb,
					int256Arb,
					addressArb,
					fc.boolean(),
					bytes32Arb,
					fc.string({ maxLength: 96 }),
					hexBytesArb(0, 96),
					fc.array(u256Arb, { maxLength: 8 }),
					async (u, s, a, b, h, text, payload, nums) => {
						const prim = await client.tevmContract({
							...contract.read.echoPrimitives(u, s, a, b, h),
						})
						expect(prim.data).toEqual([u, s, getAddress(a), b, h.toLowerCase()])

						const dyn = await client.tevmContract({
							...contract.read.echoDynamic(text, payload, nums),
						})
						expect(dyn.data).toEqual([text, payload.toLowerCase(), nums])

						const tup = await client.tevmContract({
							...contract.read.echoTuple({ owner: a, amount: u, label: text, data: payload }),
						})
						expect(tup.data).toEqual({
							owner: getAddress(a),
							amount: u,
							label: text,
							data: payload.toLowerCase(),
						})
					},
				),
				fcParams('io', { numRuns: 75 }),
			)
		} finally {
			await client.tevmClose()
		}
	})

	it('fuzz: createContract from JSON ABI vs humanReadableAbi produces equivalent contracts and actions', () => {
		const parsedAbi = parseAbi(echoHumanAbi)
		fc.assert(
			fc.property(
				addressArb,
				hexBytesArb(2, 32),
				hexBytesArb(2, 32),
				fc.string({ minLength: 1, maxLength: 24 }),
				(addr, bytecode, deployedBytecode, name) => {
					const fromHuman = createContract({
						name,
						humanReadableAbi: echoHumanAbi,
						address: addr,
						bytecode,
						deployedBytecode,
					})
					const fromJson = createContract({
						name,
						abi: parsedAbi,
						address: addr,
						bytecode,
						deployedBytecode,
					})
					expect(fromHuman.address).toBe(getAddress(addr))
					expect(fromJson.address).toBe(getAddress(addr))
					expect(fromHuman.abi).toEqual(fromJson.abi)
					expect(fromHuman.withAddress(addr).address).toBe(getAddress(addr))
					expect(fromHuman.withCode(deployedBytecode).code).toBe(deployedBytecode)
					expect(fromHuman.deploy()).toEqual({ bytecode, abi: fromHuman.abi })
				},
			),
			fcParams('pure', { numRuns: 150 }),
		)
	})

	it('fuzz: definePredeploy installs and executes arbitrary constant contracts at fuzzed addresses', async () => {
		const client = createMemoryClient()
		const answerAbi = ['function answer() view returns (uint256)'] as const
		try {
			await client.tevmReady()
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 0x2000, max: 0x9999 }).map((n) => getAddress(toHex(BigInt(n), { size: 20 }))),
					u256Arb,
					async (addr, value) => {
						const runtime = buildConstantReturnRuntime(value)
						const predeploy = definePredeploy(
							createContract({
								name: 'FuzzPredeploy',
								humanReadableAbi: answerAbi,
								bytecode: buildDeployInitcode(runtime),
								deployedBytecode: runtime,
							}).withAddress(addr),
						)
						expect(predeploy.predeploy().address).toBe(getAddress(addr))
						await client.tevmSetAccount({
							address: predeploy.predeploy().address,
							deployedBytecode: predeploy.contract.deployedBytecode,
						})
						const res = await client.tevmContract(predeploy.contract.read.answer())
						expect(res.data).toBe(value)
					},
				),
				fcParams('io', { numRuns: 50 }),
			)
		} finally {
			await client.tevmClose()
		}
	})

	it('fuzz: @tevm/viem extension agrees exactly with @tevm/memory-client', async () => {
		const client = createMemoryClient()
		const extendedViem = createClient({
			chain: foundry,
			transport: custom({
				request: ({ method, params }) =>
					client.transport.tevm.request({
						method,
						...(params === undefined ? {} : { params: params as never }),
					}),
			}),
		}).extend(tevmViemExtension())

		try {
			await client.tevmReady()
			await fc.assert(
				fc.asyncProperty(
					addressArb,
					u256Arb,
					fc.bigInt({ min: 0n, max: 100_000n }),
					bytes32Arb,
					bytes32Arb,
					async (addr, balance, nonce, slot, storageVal) => {
						await extendedViem.tevmSetAccount({
							address: addr,
							balance,
							nonce,
							storage: { [slot]: storageVal },
						})

						const [mcBalance, mcNonce, mcStorage, tevmAcc] = await Promise.all([
							client.getBalance({ address: addr }),
							client.getTransactionCount({ address: addr }),
							client.getStorageAt({ address: addr, slot }),
							extendedViem.tevmGetAccount({ address: addr }),
						])

						expect(mcBalance).toBe(balance)
						expect(BigInt(mcNonce)).toBe(nonce)
						expect(mcStorage?.toLowerCase()).toBe(storageVal.toLowerCase())
						expect(tevmAcc.balance).toBe(balance)
						expect(tevmAcc.nonce).toBe(nonce)
					},
				),
				fcParams('io', { numRuns: 45 }),
			)
		} finally {
			await client.tevmClose()
		}
	})
})
