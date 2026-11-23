import { format } from 'node:util'
import { encodeAbiParameters, getAddress, type Hex, toFunctionSelector } from 'viem'
import { describe, expect, it } from 'vitest'
import { decodeHardhatConsoleLog } from './decodeHardhatConsoleLog.js'

type Draw = (limit: number) => number
type Arg = bigint | string | boolean
const seed = Number(process.env['FUZZ_SEED'] ?? 0xc011501)
const runs = Number(process.env['FUZZ_RUNS'] ?? 256)
if (!Number.isSafeInteger(seed) || !Number.isSafeInteger(runs) || runs < 1)
	throw new Error('Invalid FUZZ_SEED/FUZZ_RUNS')

// Replay the same choices, replacing a suffix with zero to shrink lengths, values and alphabet choices.
function cases(check: (draw: Draw, index: number) => void, count = runs) {
	for (let index = 0; index < count; index++) {
		let draws = 0
		function replay(budget: number) {
			let state = (seed + Math.imul(index, 0x9e3779b9)) >>> 0
			draws = 0
			check((limit) => {
				if (draws++ >= budget) return 0
				state = (Math.imul(1664525, state) + 1013904223) >>> 0
				return Math.floor((state / 2 ** 32) * limit)
			}, index)
		}
		try {
			replay(Infinity)
		} catch (original) {
			let cause = original
			let end = draws
			for (let size = end; size >= 1; size = Math.floor(size / 2)) {
				while (end >= size) {
					try {
						replay(end - size)
						break
					} catch (error) {
						end -= size
						cause = error
					}
				}
			}
			throw new Error(`FUZZ_SEED=${seed}, case ${index}, shrunk to ${end} random choices`, { cause })
		}
	}
}

const pick = <T>(draw: Draw, values: readonly T[]): T => values[draw(values.length)]!
const hex = (draw: Draw, size: number): Hex =>
	`0x${Buffer.from(Array.from({ length: size }, () => draw(256))).toString('hex')}`
const alphabet = ['\0', '\uFEFF', '🙂', '界', 'e\u0301', ' ', '\n', 'a', '🧪', 'ß']
const string = (draw: Draw) =>
	Array.from({ length: draw(25) }, () =>
		draw(4) ? pick(draw, alphabet) : String.fromCodePoint(0x10000 + draw(0x100000)),
	).join('')
const scalar = ['uint256', 'int256', 'bool', 'string', 'address']
const minInt = -(1n << 255n)
const maxInt = (1n << 255n) - 1n
const maxUint = (1n << 256n) - 1n

function value(draw: Draw, type: string): Arg {
	switch (type) {
		case 'int256':
			return draw(3) ? BigInt.asIntN(256, BigInt(hex(draw, 32))) : pick(draw, [minInt, -1n, 0n, 1n, maxInt])
		case 'uint256':
			return draw(3) ? BigInt(hex(draw, 32)) : pick(draw, [0n, 1n, maxUint])
		case 'string':
			return string(draw)
		case 'bool':
			return Boolean(draw(2))
		case 'address':
			return getAddress(hex(draw, 20))
		default:
			return hex(draw, type === 'bytes' ? draw(130) : Number(type.slice(5)))
	}
}

function encode(signature: string, types: string[], args: Arg[]): Hex {
	const payload = encodeAbiParameters(
		types.map((type) => ({ type })),
		args,
	)
	return `${toFunctionSelector(signature)}${payload.slice(2)}`
}

// forge-std console2 aliases console.sol. Bytes (dynamic and fixed) have unary overloads.
// Include TEVM's additional signed combinations, typed helpers and old literal uint/int selectors.
function overloads() {
	const catalog = [{ name: 'log', types: [] as string[] }]
	let tuples: string[][] = [[]]
	for (let arity = 1; arity <= 4; arity++) {
		tuples = tuples.flatMap((prefix) => scalar.map((type) => [...prefix, type]))
		for (const types of tuples) catalog.push({ name: 'log', types })
	}
	for (const [suffix, type] of Object.entries({
		Int: 'int256',
		Uint: 'uint256',
		String: 'string',
		Bool: 'bool',
		Address: 'address',
	})) {
		catalog.push({ name: `log${suffix}`, types: [type] })
	}
	for (let n = 0; n <= 32; n++) {
		const size = n === 0 ? '' : String(n)
		for (const name of ['log', `logBytes${size}`]) catalog.push({ name, types: [`bytes${size}`] })
	}
	return catalog
}

const catalog = overloads()
const selectors = new Set(
	catalog.flatMap(({ name, types }) => {
		const canonical = `${name}(${types.join(',')})`
		return [canonical, canonical.replaceAll('int256', 'int')].map((signature) => toFunctionSelector(signature))
	}),
)

function checkResult(raw: string) {
	const decoded = decodeHardhatConsoleLog(raw as Hex)
	if (!selectors.has(raw.slice(0, 10).toLowerCase() as Hex)) {
		expect(decoded).toBeNull()
	} else if (decoded !== null) {
		expect(typeof decoded.formatted).toBe('string')
		expect(Array.isArray(decoded.args)).toBe(true)
		expect(decoded.signature).toMatch(/^log\w*\(.*\)$/)
	}
}

describe('Hardhat console calldata properties', () => {
	it.each(['\0\0', '\uFEFF'])('preserves every leading string code point (%j)', (text) => {
		expect(decodeHardhatConsoleLog(encode('log(string)', ['string'], [text]))).toEqual({
			signature: 'log(string)',
			args: [text],
			formatted: text,
		})
	})
	it('is total for arbitrary bytes, unknown selectors and malformed text', () => {
		cases((draw, index) => {
			const data = hex(draw, index === 0 ? 0 : index === 1 ? 2048 : draw(2049))
			checkResult(data)
			checkResult(`${hex(draw, 4)}${data.slice(2)}`)
			expect(decodeHardhatConsoleLog(`0x51973ec9${data.slice(2)}f`)).toBeNull()
			const at = draw(data.length - 1) + 2
			expect(
				decodeHardhatConsoleLog(
					`${data.slice(0, at)}${pick(draw, ['z', '🙂', '\0', ' ', '-'])}${data.slice(at)}` as Hex,
				),
			).toBeNull()
			expect(decodeHardhatConsoleLog(`0X${data.slice(2)}` as Hex)).toBeNull()
		})
	})

	it('handles truncated heads, damaged tails, huge offsets and lengths behind known selectors', () => {
		cases((draw) => {
			const types = pick(draw, [['string', 'uint256'], ['bytes']])
			const raw = encode(
				`log(${types.join(',')})`,
				types,
				types.map((t) => value(draw, t)),
			)
			const selector = raw.slice(0, 10)
			const payload = raw.slice(10)
			expect(decodeHardhatConsoleLog(`${selector}${payload.slice(0, 2 * draw(32))}` as Hex)).toBeNull()
			const huge = `ff${hex(draw, 31).slice(2)}`
			const lengthAt = types.length * 64
			expect(decodeHardhatConsoleLog(`${selector}${huge}${payload.slice(64)}` as Hex)).toBeNull()
			expect(
				decodeHardhatConsoleLog(
					`${selector}${payload.slice(0, lengthAt)}${huge}${payload.slice(lengthAt + 64)}` as Hex,
				),
			).toBeNull()
			checkResult(raw.slice(0, 10 + 2 * draw(payload.length / 2 + 1)))
			const at = 2 * draw(payload.length / 2)
			checkResult(selector + payload.slice(0, at) + hex(draw, 1).slice(2) + payload.slice(at + 2))
		})
	})

	it('round-trips every overload and legacy spelling with independently generated ABI values', () => {
		// 852 canonical signatures and 662 additional legacy spellings must all have distinct selectors.
		expect(catalog).toHaveLength(852)
		expect(selectors.size).toBe(852 + 662)
		cases((draw, index) => {
			const { name, types } = catalog[index] ?? pick(draw, catalog)
			const args = types.map((type) => value(draw, type))
			const signature = `${name}(${types.join(',')})`
			const legacy = signature.replaceAll('int256', 'int')
			for (const spelling of new Set([signature, legacy])) {
				const raw = encode(spelling, types, args)
				const data = draw(2) ? raw : (`0x${raw.slice(2).toUpperCase()}` as Hex)
				// Only log() and a single empty string legitimately have no printable characters here.
				expect(decodeHardhatConsoleLog(data), spelling).toEqual({ args, signature, formatted: args.join(' ') })
			}
		}, catalog.length + runs)
	})

	it('prints both int256 limits exactly in the same generated format', () => {
		cases((draw) => {
			const prefix = string(draw)
			const token = () => pick(draw, ['%s', '%i', '%o', '%d'])
			const format = `${prefix}%%${token()}/${token()}`
			const [left, right] = draw(2) ? ([minInt, maxInt] as const) : ([maxInt, minInt] as const)
			const types = ['string', 'int256', 'int256']
			const signature = 'log(string,int256,int256)'
			const args = [format, left, right]
			expect(decodeHardhatConsoleLog(encode(signature, types, args))).toEqual({
				signature,
				args,
				formatted: `${prefix}%${left}/${right}`,
			})
		})
	})

	it('renders generated tokens, literal percents, missing and surplus arguments', () => {
		cases((draw) => {
			const types = Array.from({ length: draw(4) }, () => pick(draw, scalar))
			const args = types.map((type) => value(draw, type))
			const parts = Array.from({ length: draw(10) }, () =>
				pick(draw, ['%s', '%d', '%i', '%f', '%o', '%%', '%q', string(draw)]),
			)
			let used = 0
			const rendered = parts.map((part) => {
				if (part === '%%') return '%'
				if (!['%s', '%d', '%i', '%f', '%o'].includes(part) || used === args.length) return part
				const arg = args[used++]!
				if (part === '%o' && typeof arg === 'string') return `'${arg}'`
				if (part === '%s' || part === '%o' || typeof arg === 'bigint') return String(arg)
				// Strings (including addresses) coerce as util.format does. Booleans print NaN.
				return typeof arg === 'string' ? format(part, arg) : 'NaN'
			})
			const trailing = draw(2) ? '%' : ''
			const format_ = parts.join('') + trailing
			// util.format returns a lone format string unchanged: %% is not collapsed.
			const expected = args.length === 0 ? format_ : [rendered.join('') + trailing, ...args.slice(used)].join(' ')
			const allTypes = ['string', ...types]
			const signature = `log(${allTypes.join(',')})`
			const allArgs = [format_, ...args]
			expect(decodeHardhatConsoleLog(encode(signature, allTypes, allArgs))).toEqual({
				signature,
				args: allArgs,
				formatted: expected,
			})
		})
	})

	// Regression (Astra R1-53): Node's util.format is the oracle for both cases.
	it('preserves %% in a format string that has no substitution arguments', () => {
		expect(decodeHardhatConsoleLog(encode('log(string)', ['string'], ['100%%']))?.formatted).toBe('100%%')
		cases((draw) => {
			const text = Array.from({ length: draw(8) }, () =>
				pick(draw, ['%%', '%', '%s', '%d', '%i', '%f', '%o', string(draw)]),
			).join('')
			for (const signature of ['log(string)', 'logString(string)'])
				expect(decodeHardhatConsoleLog(encode(signature, ['string'], [text]))?.formatted).toBe(format(text))
		})
	})

	it('coerces numeric strings for %d, %i and %f instead of printing NaN', () => {
		const decode = (specifier: string, text: string) =>
			decodeHardhatConsoleLog(encode('log(string,string)', ['string', 'string'], [specifier, text]))?.formatted
		expect(decode('%d', '42')).toBe('42')
		expect(decode('%d', '3.14')).toBe('3.14')
		expect(decode('%i', '3.14')).toBe('3')
		expect(decode('%f', '3.14')).toBe('3.14')
		expect(decode('%d', 'not a number')).toBe('NaN')
		const digits = '0123456789'
		cases((draw) => {
			const integer = Array.from({ length: 1 + draw(12) }, () => pick(draw, [...digits])).join('')
			const text = pick(draw, [
				integer,
				`-${integer}`,
				`${integer}.${integer}`,
				`.${integer}`,
				`${integer}e${draw(20)}`,
				` ${integer} `,
				`0x${integer}`,
				`${integer}px`,
				'',
				'-0',
				'Infinity',
				string(draw),
			])
			for (const specifier of ['%d', '%i', '%f'])
				expect(decode(`[${specifier}]`, text), `${specifier} ${JSON.stringify(text)}`).toBe(
					format(`[${specifier}]`, text),
				)
		})
	})
})
