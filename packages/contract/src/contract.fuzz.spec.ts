import { formatAbi } from '@tevm/utils'
import fc from 'fast-check'
import {
	type Abi,
	type AbiParameter,
	type Address,
	concatHex,
	decodeErrorResult,
	decodeEventLog,
	decodeFunctionData,
	decodeFunctionResult,
	encodeAbiParameters,
	encodeErrorResult,
	encodeEventTopics,
	encodeFunctionData,
	encodeFunctionResult,
	getAddress,
	type Hex,
	keccak256,
	slice,
	stringToHex,
	toHex,
} from 'viem'
import { expect, expectTypeOf, it } from 'vitest'
import { createContract } from './createContract.js'

it('exposes the declared function name on both action creators before invocation', () => {
	const contract = createContract({ humanReadableAbi: ['function r() view', 'function w()'] as const })
	expect([contract.read.r.functionName, contract.write.w.functionName]).toEqual(['r', 'w'])
})

const options = {
	seed: Number(process.env['FUZZ_SEED'] ?? 0x7eab1),
	numRuns: Number(process.env['FUZZ_RUNS'] ?? 320),
}
if (!Number.isSafeInteger(options.numRuns) || options.numRuns < 1)
	throw new Error('FUZZ_RUNS must be a positive integer')
if (!Number.isSafeInteger(options.seed)) throw new Error('FUZZ_SEED must be an integer')

const bytes = (minLength: number, maxLength: number) =>
	fc.uint8Array({ minLength, maxLength }).map((value) => toHex(value))
const address = bytes(20, 20).map((hex) => getAddress(hex))

// Keep the canonical Solidity signature alongside the JSON ABI. Values are drawn
// after the shape so every element of an array has the same type but its own value.
type Shape = { parameter: AbiParameter; signature: string; values: fc.Arbitrary<unknown> }
function scalar(type: string, values: fc.Arbitrary<unknown>): Shape {
	return { parameter: { type }, signature: type, values }
}
const integer = fc.tuple(fc.integer({ min: 1, max: 32 }), fc.boolean()).map(([size, signed]) => {
	const bits = 8 * size
	const limit = 1n << BigInt(signed ? bits - 1 : bits)
	const min = signed ? -limit : 0n
	const max = limit - 1n
	const values = fc.oneof(fc.constantFrom(min, 0n, 1n, max), fc.bigInt({ min, max }))
	return scalar((signed ? 'int' : 'uint') + bits, bits <= 48 ? values.map(Number) : values)
})
const leaf = fc.oneof(
	integer,
	fc.integer({ min: 1, max: 32 }).map((n) => scalar(`bytes${n}`, bytes(n, n))),
	fc.constantFrom(
		scalar('address', address),
		scalar('bool', fc.boolean()),
		scalar('bytes', bytes(0, 80)),
		scalar('string', fc.string({ unit: 'grapheme', maxLength: 40 })),
	),
)

function shape(depth: number): fc.Arbitrary<Shape> {
	if (depth === 0) return leaf
	const child = shape(depth - 1)
	const array = fc.tuple(child, fc.integer({ min: 0, max: 3 })).map(([element, length]) => {
		const suffix = length === 0 ? '[]' : `[${length}]`
		return {
			parameter: { ...element.parameter, type: element.parameter.type + suffix },
			signature: element.signature + suffix,
			values: fc.array(element.values, { minLength: length, maxLength: length || 4 }),
		}
	})
	const tuple = fc.array(child, { minLength: 1, maxLength: 3 }).map((fields) => ({
		parameter: { type: 'tuple', components: fields.map((f, i) => ({ ...f.parameter, name: `f${i}` })) },
		signature: `(${fields.map((f) => f.signature).join(',')})`,
		values: fc
			.tuple(...fields.map((f) => f.values))
			.map((values) => Object.fromEntries(values.map((v, i) => [`f${i}`, v]))),
	}))
	return fc.oneof({ weight: 3, arbitrary: leaf }, array, tuple)
}

const parameters = fc.array(shape(3), { maxLength: 4 }).chain((fields) =>
	fc.tuple(...fields.map((f) => f.values)).map((values) => ({
		abi: fields.map((f, i) => ({ ...f.parameter, name: `p${i}` })),
		types: fields.map((f) => f.signature),
		values,
	})),
)
function signatureHash(name: string, types: string[]) {
	return keccak256(stringToHex(`${name}(${types.join(',')})`))
}

// The ABI names and types are generated at runtime, beyond literal ABI inference.
type Action = { abi: Abi; functionName: string; address: Address; to: Address; args?: unknown[] }
type Filter = { abi: Abi; eventName: string; address: Address; args: { owner: Address } }

it('matches viem calldata, return data, error payloads and event topics for generated JSON and human-readable ABIs', () => {
	fc.assert(
		fc.property(parameters, parameters, address, fc.nat(), fc.boolean(), (inputs, outputs, addr, suffix, pure) => {
			const read = `read${suffix}`
			const write = `write${suffix}`
			const event = `Observed${suffix}`
			const error = `Denied${suffix}`
			const method = { type: 'function', inputs: inputs.abi, outputs: outputs.abi } as const
			const abi = [
				{ ...method, name: read, stateMutability: pure ? 'pure' : 'view' },
				{ ...method, name: write, stateMutability: pure ? 'payable' : 'nonpayable' },
				{ type: 'error', name: error, inputs: inputs.abi },
				{ type: 'event', name: event, inputs: [{ name: 'owner', type: 'address', indexed: true }, ...inputs.abi] },
			] as const satisfies Abi
			const contracts = [
				createContract({ abi, address: addr }),
				createContract({ humanReadableAbi: formatAbi(abi), address: addr }),
			]
			const inputData = encodeAbiParameters(inputs.abi, inputs.values)
			const returnData = encodeAbiParameters(outputs.abi, outputs.values)
			const expectedReturn = outputs.values.length <= 1 ? outputs.values[0] : outputs.values
			const expectedArgs = inputs.values.length ? inputs.values : undefined
			const errorData = concatHex([slice(signatureHash(error, inputs.types), 0, 4), inputData])

			for (const contract of contracts) {
				expect(Object.keys(contract.read)).toEqual([read])
				expect(Object.keys(contract.write)).toEqual([write])
				expect(Object.keys(contract.events)).toEqual([event])
				for (const [name, creators] of [
					[read, contract.read],
					[write, contract.write],
				] as const) {
					const creator = (creators as Record<string, ((...args: unknown[]) => Action) & { functionName: string }>)[
						name
					]!
					expect(creator.functionName).toBe(name)
					const action = creator(...inputs.values)
					expect([action.functionName, action.to, action.address, action.args]).toEqual([
						name,
						addr,
						addr,
						expectedArgs,
					])
					if (!inputs.values.length) expect(action).not.toHaveProperty('args')
					const calldata = encodeFunctionData(action)
					expect(calldata).toBe(concatHex([slice(signatureHash(name, inputs.types), 0, 4), inputData]))
					expect(decodeFunctionData({ abi, data: calldata })).toEqual({ functionName: name, args: expectedArgs })
					expect(encodeFunctionResult({ ...action, result: expectedReturn })).toBe(returnData)
					expect(decodeFunctionResult({ ...action, data: returnData })).toEqual(expectedReturn)
					expect(encodeErrorResult({ abi: action.abi, errorName: error, args: inputs.values })).toBe(errorData)
					expect(decodeErrorResult({ abi: action.abi, data: errorData })).toMatchObject({
						errorName: error,
						args: expectedArgs,
					})
				}

				const filterArgs = { args: { owner: addr }, fromBlock: 0n, toBlock: 'latest', strict: true } as const
				const filter = (contract.events as Record<string, (opts: typeof filterArgs) => Filter>)[event]!(filterArgs)
				expect(filter).toMatchObject({ eventName: event, address: addr, ...filterArgs })
				const topics: [Hex, Hex] = [
					signatureHash(event, ['address', ...inputs.types]),
					encodeAbiParameters([{ type: 'address' }], [addr]),
				]
				expect(encodeEventTopics(filter)).toEqual(topics)
				expect(decodeEventLog({ abi: filter.abi, topics, data: inputData })).toEqual({
					eventName: event,
					args: { owner: addr, ...Object.fromEntries(inputs.values.map((v, i) => [`p${i}`, v])) },
				})
			}
		}),
		options,
	)
})

it('uses the correct selector when a read and write overload both accept zero', () => {
	const contract = createContract({
		humanReadableAbi: ['function f(uint8) view', 'function f(uint16)'] as const,
	})
	expectTypeOf(contract.read.f(0).abi[0].inputs[0].type).toEqualTypeOf<'uint8'>()
	expectTypeOf(contract.write.f(0).abi[0].inputs[0].type).toEqualTypeOf<'uint16'>()
	expect(encodeFunctionData(contract.read.f(0)).slice(0, 10)).toBe(slice(signatureHash('f', ['uint8']), 0, 4))
	expect(encodeFunctionData(contract.write.f(0)).slice(0, 10)).toBe(slice(signatureHash('f', ['uint16']), 0, 4))
})

it('keeps read and write overloads distinct across integer widths and ABI order', () => {
	const pair = fc.integer({ min: 1, max: 31 }).chain((n) =>
		fc.record({
			small: fc.constant(n * 8),
			large: fc.integer({ min: n + 1, max: 32 }).map((size) => size * 8),
			value: fc.bigInt({ min: 0n, max: (1n << BigInt(n * 8)) - 1n }),
		}),
	)
	fc.assert(
		fc.property(pair, fc.boolean(), fc.boolean(), ({ small, large, value }, swapWidths, swapOrder) => {
			const readType = `uint${swapWidths ? large : small}`
			const writeType = `uint${swapWidths ? small : large}`
			const read = `function f(${readType}) view returns (bool)`
			const write = `function f(${writeType}) returns (bytes32)`
			const contract = createContract({ humanReadableAbi: swapOrder ? [write, read] : [read, write] })
			for (const [type, group] of [
				[readType, contract.read],
				[writeType, contract.write],
			] as const) {
				const action = (group as { f: (arg: bigint) => Action }).f(value)
				expect(encodeFunctionData(action)).toBe(
					concatHex([slice(signatureHash('f', [type]), 0, 4), encodeAbiParameters([{ type }], [value])]),
				)
			}
		}),
		options,
	)
})

it('types unbound actions and their readonly ABI with all overloads and errors', () => {
	const contract = createContract({
		humanReadableAbi: [
			'error Failed()',
			'function get() view',
			'function get(uint256) view',
			'function set()',
			'function set(uint256)',
		] as const,
	})
	for (const creator of [contract.read.get, contract.write.set]) {
		expect(creator).not.toHaveProperty('address')
		expect(creator).not.toHaveProperty('to')
	}
	for (const action of [contract.read.get(), contract.write.set()]) {
		expectTypeOf(action).not.toHaveProperty('address')
		expectTypeOf(action).not.toHaveProperty('to')
		expectTypeOf(action.abi).not.toHaveProperty('push')
		expectTypeOf(action.abi.length).toEqualTypeOf<number>()
		expect(action.abi.map((item) => item.type)).toEqual(['function', 'function', 'error'])
		expect(action).not.toHaveProperty('address')
		expect(action).not.toHaveProperty('to')
	}
})
