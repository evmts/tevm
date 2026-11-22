import fc from 'fast-check'
import { type Address, getAddress, type Hex, toHex } from 'viem'

const HEX_CHARS = '0123456789abcdef'
const HEX_NIBBLE = fc.constantFrom(...HEX_CHARS.split(''))

export const hexBytesArb = (minBytes = 0, maxBytes = 64): fc.Arbitrary<Hex> =>
	fc
		.uint8Array({ minLength: minBytes, maxLength: maxBytes })
		.map((bytes) => `0x${Buffer.from(bytes).toString('hex')}` as Hex)

export const bytes32Arb: fc.Arbitrary<Hex> = fc.oneof(
	{ weight: 2, arbitrary: fc.constant(`0x${'00'.repeat(32)}` as Hex) },
	{ weight: 1, arbitrary: fc.constant(`0x${'ff'.repeat(32)}` as Hex) },
	{ weight: 2, arbitrary: fc.integer({ min: 0, max: 32 }).map((n) => toHex(BigInt(n), { size: 32 })) },
	{ weight: 5, arbitrary: hexBytesArb(32, 32) },
)

export const addressArb: fc.Arbitrary<Address> = fc.oneof(
	{ weight: 1, arbitrary: fc.constant('0x0000000000000000000000000000000000000000' as Address) },
	{ weight: 1, arbitrary: fc.constant('0x000000000000000000000000000000000000dEaD' as Address) },
	{
		weight: 2,
		arbitrary: fc.integer({ min: 0x1000, max: 0x10ff }).map((n) => getAddress(toHex(BigInt(n), { size: 20 }))),
	},
	{ weight: 6, arbitrary: hexBytesArb(20, 20).map((hex) => getAddress(hex)) },
)

/**
 * Small pool of deterministic addresses so stateful model tests collide on the
 * same accounts frequently (transfers, storage overwrites, nonce increments).
 */
export const modelAddressPool: readonly Address[] = [
	getAddress('0x0000000000000000000000000000000000001001'),
	getAddress('0x0000000000000000000000000000000000001002'),
	getAddress('0x0000000000000000000000000000000000001003'),
	getAddress('0x0000000000000000000000000000000000001004'),
	getAddress('0x0000000000000000000000000000000000001005'),
]

export const modelAddressArb: fc.Arbitrary<Address> = fc.constantFrom(...modelAddressPool)

export const modelSlotPool: readonly Hex[] = [
	toHex(0n, { size: 32 }),
	toHex(1n, { size: 32 }),
	toHex(2n, { size: 32 }),
	toHex(0xffffn, { size: 32 }),
	`0x${'ff'.repeat(32)}` as Hex,
]

export const modelSlotArb: fc.Arbitrary<Hex> = fc.constantFrom(...modelSlotPool)

export const u256Arb: fc.Arbitrary<bigint> = fc.oneof(
	{
		weight: 3,
		arbitrary: fc.constantFrom(
			0n,
			1n,
			2n,
			255n,
			256n,
			(1n << 32n) - 1n,
			(1n << 64n) - 1n,
			1n << 64n,
			(1n << 128n) - 1n,
			(1n << 255n) - 1n,
			1n << 255n,
			(1n << 256n) - 1n,
		),
	},
	{ weight: 3, arbitrary: fc.bigInt({ min: 0n, max: 10n ** 18n }) },
	{ weight: 4, arbitrary: fc.bigInt({ min: 0n, max: (1n << 256n) - 1n }) },
)

export const u64Arb: fc.Arbitrary<bigint> = fc.oneof(
	{ weight: 3, arbitrary: fc.constantFrom(0n, 1n, 2n, 21_000n, 1_000_000n, (1n << 32n) - 1n, (1n << 53n) - 1n) },
	{ weight: 4, arbitrary: fc.bigInt({ min: 0n, max: 1_000_000_000n }) },
	{ weight: 3, arbitrary: fc.bigInt({ min: 0n, max: (1n << 64n) - 1n }) },
)

export const int256Arb: fc.Arbitrary<bigint> = fc.oneof(
	{
		weight: 3,
		arbitrary: fc.constantFrom(-(1n << 255n), -(1n << 128n), -1n, 0n, 1n, (1n << 128n) - 1n, (1n << 255n) - 1n),
	},
	{ weight: 7, arbitrary: fc.bigInt({ min: -(1n << 255n), max: (1n << 255n) - 1n }) },
)

export const jsonRpcIdArb: fc.Arbitrary<string | number | null> = fc.oneof(
	fc.integer({ min: -1_000_000, max: 1_000_000 }),
	fc.string({ maxLength: 32 }),
	fc.constant(null),
)

export const adversarialJsonStringArb: fc.Arbitrary<string> = fc.oneof(
	{ weight: 3, arbitrary: fc.string({ maxLength: 256 }) },
	{ weight: 2, arbitrary: fc.jsonValue({ maxDepth: 4 }).map((v) => JSON.stringify(v)) },
	{
		weight: 3,
		arbitrary: fc.constantFrom(
			'',
			' ',
			'\n\r\t',
			'{',
			'}',
			'[',
			']',
			'[]',
			'{}',
			'null',
			'true',
			'false',
			'123',
			'"hello"',
			'{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}',
			'{"jsonrpc":"2.0","method":"eth_blockNumber"}',
			'{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":[]}',
			'{"jsonrpc":"2.0","id":1,"method":"unknown_method","params":[1,2,3]}',
			'{"jsonrpc":"1.0","id":1,"method":"eth_blockNumber"}',
			'{"jsonrpc":"2.0","id":{},"method":"eth_blockNumber"}',
			'{"jsonrpc":"2.0","id":1,"method":false,"params":null}',
			'[{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"},{"jsonrpc":"2.0","method":"eth_chainId"}]',
			'{"a":"\\"}{\\""}',
			'{"a":"\\\\"}',
			'\x00\xff\xfe',
			'{"__proto__":{"polluted":true}}',
		),
	},
	{
		weight: 2,
		arbitrary: fc
			.array(fc.constantFrom('{', '}', '[', ']', '"', '\\', ':', ',', '\n', '\r', ' ', 'a', '0', 'x'), {
				minLength: 0,
				maxLength: 96,
			})
			.map((chars) => chars.join('')),
	},
)

/**
 * Valid Solidity identifier (safe as JS/TS export name, excluding reserved words).
 */
const RESERVED_JS_WORDS = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'null',
	'return',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'let',
	'static',
	'implements',
	'interface',
	'package',
	'private',
	'protected',
	'public',
	'await',
	'arguments',
	'eval',
	'artifacts',
])

export const solidityIdentifierArb: fc.Arbitrary<string> = fc
	.tuple(
		fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_'.split('')),
		fc.stringMatching(/^[A-Za-z0-9_]{0,20}$/),
	)
	.map(([head, tail]) => `${head}${tail}`)
	.filter((id) => !RESERVED_JS_WORDS.has(id) && !id.startsWith('_'))

/**
 * Builds minimal EVM runtime bytecode that returns an arbitrary 32-byte constant:
 * PUSH32 <value> PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
 */
export function buildConstantReturnRuntime(value: bigint): Hex {
	const word = toHex(value & ((1n << 256n) - 1n), { size: 32 }).slice(2)
	return `0x7f${word}60005260206000f3`
}

/**
 * Builds minimal EVM initcode that deploys any runtime bytecode of length <= 255 bytes:
 * PUSH1 <len> PUSH1 0x0c PUSH1 0x00 CODECOPY PUSH1 <len> PUSH1 0x00 RETURN <runtime>
 */
export function buildDeployInitcode(runtime: Hex): Hex {
	const raw = runtime.slice(2)
	const len = raw.length / 2
	if (len > 255) throw new RangeError('Runtime exceeds 255 bytes')
	const lenHex = len.toString(16).padStart(2, '0')
	return `0x60${lenHex}600c60003960${lenHex}6000f3${raw}` as Hex
}

/**
 * Builds EVM runtime bytecode that echoes its exact calldata back:
 * CALLDATASIZE PUSH1 0x00 PUSH1 0x00 CALLDATACOPY CALLDATASIZE PUSH1 0x00 RETURN
 */
export const ECHO_CALLDATA_RUNTIME: Hex = '0x366000600037366000f3'

/**
 * Builds EVM runtime bytecode that stores calldata[0..32] into slot 0 on write
 * (when calldatasize >= 32) and returns SLOAD(0) (when calldatasize == 0).
 *
 * 0x00: 36          CALLDATASIZE
 * 0x01: 60 0c       PUSH1 0x0c
 * 0x03: 57          JUMPI (if calldatasize > 0 -> write)
 * 0x04: 60 00       PUSH1 0x00
 * 0x06: 54          SLOAD
 * 0x07: 60 00       PUSH1 0x00
 * 0x09: 52          MSTORE
 * 0x0a: 60 20 60 00 f3  PUSH1 0x20 PUSH1 0x00 RETURN
 * 0x0f: 5b          JUMPDEST (offset 0x0f!)
 */
export const STORAGE_BOX_RUNTIME: Hex = '0x36600f5760005460005260206000f35b60003560005560005460005260206000f3'

/**
 * Builds EVM runtime bytecode that emits LOG1(topic0 = calldata[0..32], data = calldata[32..])
 * and returns the emitted topic0.
 *
 * 0x00: 36          CALLDATASIZE
 * 0x01: 60 20       PUSH1 0x20
 * 0x03: 10          LT (calldatasize < 32)
 * 0x04: 60 23       PUSH1 0x23 (revert)
 * 0x06: 57          JUMPI
 * 0x07: 60 20       PUSH1 0x20
 * 0x09: 36          CALLDATASIZE
 * 0x0a: 03          SUB (dataLen = calldatasize - 32)
 * 0x0b: 80          DUP1
 * 0x0c: 60 20       PUSH1 0x20
 * 0x0e: 60 00       PUSH1 0x00
 * 0x10: 37          CALLDATACOPY (mem[0..dataLen] = calldata[32..])
 * 0x11: 60 00       PUSH1 0x00
 * 0x13: 35          CALLDATALOAD (topic0 = calldata[0..32])
 * 0x14: 90          SWAP1 (stack: topic0, dataLen)
 * 0x15: 60 00       PUSH1 0x00 (stack: 0, dataLen, topic0)
 * 0x17: a1          LOG1
 * 0x18: 60 00       PUSH1 0x00
 * 0x1a: 35          CALLDATALOAD
 * 0x1b: 60 00       PUSH1 0x00
 * 0x1d: 52          MSTORE
 * 0x1e: 60 20       PUSH1 0x20
 * 0x20: 60 00       PUSH1 0x00
 * 0x22: f3          RETURN
 * 0x23: 5b          JUMPDEST
 * 0x24: 60 00 60 00 fd  REVERT(0, 0)
 */
export const LOG_EMITTER_RUNTIME: Hex =
	'0x6020361060235760203603806020600037600035906000a160003560005260206000f35b60006000fd'

/**
 * Builds EVM runtime bytecode that reverts with its exact calldata as revert data:
 * CALLDATASIZE PUSH1 0x00 PUSH1 0x00 CALLDATACOPY CALLDATASIZE PUSH1 0x00 REVERT
 */
export const REVERT_ECHO_RUNTIME: Hex = '0x366000600037366000fd'

export const hexCharArb = HEX_NIBBLE
