/**
 * Model-based stateful differential fuzzer for `createZevmEngine`.
 *
 * Every generated command sequence drives three systems in lockstep:
 *   (A) a direct native ZEVM engine: `createZevmEngine()`
 *   (B) a pluggable async WASM-style `ZevmBackend` bridging an isolated native node with
 *       randomized latency, JSON round-tripping and per-entry batch dispatch:
 *       `createZevmEngine({ backend })`
 *   (C) a reference JavaScript model of balances, nonces, code, storage, block height
 *       and the nested `evm_snapshot` / `evm_revert` stack.
 *
 * After every step the command result, the complete tracked state, the latest block and
 * the engine events of (A) and (B) must be identical, and both must match (C).
 *
 * The generator, runner and shrinker are dependency-free and deterministic.
 * Replay with `FUZZ_SEED=<n> FUZZ_RUNS=<n> vitest run src/statefulDifferential.fuzz.spec.ts`.
 */
import { createRequire } from 'node:module'
import { isDeepStrictEqual } from 'node:util'
import { getContractAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import { createZevmEngine } from './createZevmEngine.js'
import type { JsonValue, ZevmBackend, ZevmEngine } from './ZevmEngine.js'

// ---------------------------------------------------------------------------------------
// Deterministic PRNG
// ---------------------------------------------------------------------------------------

type Rng = { next: () => number; int: (n: number) => number; bool: (p?: number) => boolean }

/** mulberry32: small, fast and fully determined by its 32-bit seed. */
const prng = (seed: number): Rng => {
	let s = seed >>> 0
	const next = () => {
		s = (s + 0x6d2b79f5) >>> 0
		let t = s
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const int = (n: number) => Math.floor(next() * n)
	return { next, int, bool: (p = 0.5) => next() < p }
}

// ---------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------

const MAX_U256 = 2n ** 256n - 1n
const MAX_U64 = 2n ** 64n - 1n
const GAS_PRICE = 0x77359400n
const CALL_GAS = 100_000n
const DEPLOY_GAS = 200_000n
const INITIAL_BALANCE = 0x21e19e0c9bab2400000n

/** Managed dev account 0: the coinbase. It never sends transactions. */
const MINER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
/** Managed dev accounts 1-3: the only transaction senders. */
const SENDERS = [
	'0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
	'0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
	'0x90f79bf6eb2c4f870365e785982e1f101e93b906',
]
const PLAIN = ['a1', 'a2', 'a3', 'a4'].map((suffix) => `0x${'00'.repeat(19)}${suffix}`)

const q = (value: bigint) => `0x${value.toString(16)}`
const word = (value: bigint) => value.toString(16).padStart(64, '0')

/**
 * calldatasize == 64: sstore(word0, word1). calldatasize == 32: return sload(word0).
 * Anything else: revert(sload(0)).
 */
const STORE = '366020146019573660401460265760005460005260206000fd5b6000355460005260206000f35b6020356000355500'
/** Returns the 32-byte word 42 and accepts value. */
const RET42 = '602a60005260206000f3'
/** Always reverts with the four bytes 0xdeadbeef. */
const REVERT = '63deadbeef6000526004601cfd'
/** slot0 += 1 (mod 2^256) and returns the new value. */
const COUNTER = '6000546001018060005560005260206000f3'
const PROGRAMS = [STORE, RET42, REVERT, COUNTER, '', STORE]
/** Init code that returns `runtime` unchanged. */
const initCode = (runtime: string) =>
	`60${(runtime.length / 2).toString(16).padStart(2, '0')}80600b6000396000f3${runtime}`

const BALANCES = [0n, 1n, 21_000n * GAS_PRICE, CALL_GAS * GAS_PRICE + 5n, 10n ** 18n, 10n ** 20n, 2n ** 128n]
const SLOTS = [0n, 1n, 2n, MAX_U256]
const STORAGE_VALUES = [0n, 1n, 0x2an, 0xabcn, 2n ** 255n, MAX_U256]

// ---------------------------------------------------------------------------------------
// Abstract commands. Indices are resolved against the model at run time, so any
// subsequence of a command list is still a valid command list (required for shrinking).
// ---------------------------------------------------------------------------------------

type Via = 'request' | 'rpc'
type Single =
	| { t: 'setBalance'; a: number; v: number; via: Via }
	| { t: 'setNonce'; a: number; n: number; mode: 'abs' | 'dec' | 'bad'; via: Via }
	| { t: 'setCode'; a: number; p: number; bad: boolean; via: Via }
	| { t: 'setStorage'; a: number; s: number; v: number; short: boolean; via: Via }
	| {
			t: 'tx'
			from: number
			deploy: boolean
			to: number
			p: number
			mode: number
			s: number
			v: number
			value: number
			via: Via
	  }
	| {
			t: 'call'
			from: number
			to: number
			mode: number
			s: number
			v: number
			value: number
			pending: boolean
			via: Via
	  }
	| { t: 'mine'; n: number | null; via: Via }
	| { t: 'snapshot'; via: Via }
	| { t: 'revert'; kind: 'live' | 'stale' | 'bogus' | 'malformed'; pick: number; via: Via }
	| { t: 'read'; what: number; a: number; s: number; via: Via }
	| { t: 'unknown'; via: Via }
type Entry = { c: Single; id: 'num' | 'str' | 'none' }
type Cmd =
	| Single
	| { t: 'batch'; entries: Entry[]; junk: boolean }
	| { t: 'raw'; kind: 'malformed' | 'empty' | 'notifyRead' | 'notifyMine' }
	| { t: 'fault'; mode: 'throw' | 'reject'; via: Via }
type Sequence = { seed: number; listen: boolean; commands: Cmd[] }

const genSingle = (r: Rng, kind: Single['t']): Single => {
	const via: Via = r.bool() ? 'request' : 'rpc'
	const a = r.int(64)
	switch (kind) {
		case 'setBalance':
			return { t: kind, a, v: r.int(BALANCES.length + 1), via }
		case 'setNonce':
			return { t: kind, a, n: r.int(13), mode: r.bool(0.08) ? 'bad' : r.bool(0.4) ? 'dec' : 'abs', via }
		case 'setCode':
			return { t: kind, a, p: r.int(PROGRAMS.length), bad: r.bool(0.06), via }
		case 'setStorage':
			return { t: kind, a, s: r.int(SLOTS.length), v: r.int(STORAGE_VALUES.length), short: r.bool(0.3), via }
		case 'tx':
			return {
				t: kind,
				from: r.int(SENDERS.length),
				deploy: r.bool(0.3),
				to: a,
				p: r.int(PROGRAMS.length),
				mode: r.int(4),
				s: r.int(SLOTS.length),
				v: r.int(STORAGE_VALUES.length),
				value: r.int(8),
				via,
			}
		case 'call':
			return {
				t: kind,
				from: r.int(64),
				to: a,
				mode: r.int(4),
				s: r.int(SLOTS.length),
				v: r.int(STORAGE_VALUES.length),
				value: r.int(8),
				pending: r.bool(0.3),
				via,
			}
		case 'mine':
			return { t: kind, n: r.bool(0.5) ? null : r.int(5), via }
		case 'snapshot':
			return { t: kind, via }
		case 'revert': {
			const roll = r.int(20)
			return {
				t: kind,
				kind: roll < 14 ? 'live' : roll < 17 ? 'stale' : roll < 19 ? 'bogus' : 'malformed',
				pick: r.int(64),
				via,
			}
		}
		case 'read':
			return { t: kind, what: r.int(5), a, s: r.int(SLOTS.length), via }
		case 'unknown':
			return { t: kind, via }
	}
}

const weighted = <T>(r: Rng, table: [T, number][]): T => {
	let roll = r.int(table.reduce((sum, [, weight]) => sum + weight, 0))
	for (const [value, weight] of table) {
		if (roll < weight) return value
		roll -= weight
	}
	throw new Error('unreachable')
}

const genCmd = (r: Rng): Cmd => {
	const kind = weighted<Cmd['t']>(r, [
		['setBalance', 9],
		['setNonce', 6],
		['setCode', 8],
		['setStorage', 9],
		['tx', 22],
		['call', 12],
		['mine', 7],
		['snapshot', 10],
		['revert', 9],
		['batch', 8],
		['raw', 2],
		['fault', 2],
		['unknown', 1],
		['read', 1],
	])
	if (kind === 'raw') {
		return { t: kind, kind: (['malformed', 'empty', 'notifyRead', 'notifyMine'] as const)[r.int(4)] ?? 'empty' }
	}
	if (kind === 'fault') return { t: kind, mode: r.bool() ? 'throw' : 'reject', via: r.bool() ? 'request' : 'rpc' }
	if (kind === 'batch') {
		const entries: Entry[] = []
		const count = 1 + r.int(7)
		for (let i = 0; i < count; i++) {
			const entryKind = weighted<Single['t']>(r, [
				['read', 8],
				['setBalance', 3],
				['setStorage', 3],
				['setCode', 2],
				['setNonce', 1],
				['call', 3],
				['mine', 4],
				['snapshot', 2],
				['revert', 2],
				['unknown', 2],
			])
			entries.push({ c: genSingle(r, entryKind), id: (['num', 'str', 'none', 'none'] as const)[r.int(4)] ?? 'num' })
		}
		// A transaction needs its receipt to finalize the model, so it is always last and has an id.
		if (r.bool(0.35)) entries.push({ c: genSingle(r, 'tx'), id: r.bool() ? 'num' : 'str' })
		return { t: kind, entries, junk: r.bool(0.08) }
	}
	return genSingle(r, kind)
}

const genSequence = (seed: number): Sequence => {
	const r = prng(seed)
	const length = 10 + r.int(21)
	return { seed, listen: r.bool(), commands: Array.from({ length }, () => genCmd(r)) }
}

// ---------------------------------------------------------------------------------------
// (C) Reference model
// ---------------------------------------------------------------------------------------

type Account = { balance: bigint; nonce: bigint; code: string; storage: Map<bigint, bigint> }
type State = { accounts: Map<string, Account>; block: bigint }
type Call = { method: string; params: JsonValue[] }
type RpcError = { code: number; message: string; data?: string }
type Outcome = { result: JsonValue } | { error: RpcError }

/** Placeholder for a transaction hash, which the model does not predict. */
const TX_HASH = '<transaction hash>'
const INVALID_PARAMS: Outcome = { error: { code: -32602, message: 'Invalid params' } }
const INTERNAL_ERROR: Outcome = { error: { code: -32603, message: 'Internal error' } }
const METHOD_NOT_FOUND: Outcome = { error: { code: -32601, message: 'Method not found' } }
const reverted = (data: string): Outcome => ({ error: { code: 3, message: 'execution reverted', data: `0x${data}` } })

const cloneState = (state: State): State => ({
	block: state.block,
	accounts: new Map(
		[...state.accounts].map(([address, account]) => [address, { ...account, storage: new Map(account.storage) }]),
	),
})

/** Interpret one of the fixture programs. `writes` apply only when the frame succeeds. */
const runProgram = (account: Account, data: string): { success: boolean; ret: string; writes: [bigint, bigint][] } => {
	const size = data.length / 2
	const load = (slot: bigint) => account.storage.get(slot) ?? 0n
	switch (account.code) {
		case '':
			return { success: true, ret: '', writes: [] }
		case STORE:
			if (size === 64) {
				return { success: true, ret: '', writes: [[BigInt(`0x${data.slice(0, 64)}`), BigInt(`0x${data.slice(64)}`)]] }
			}
			if (size === 32) return { success: true, ret: word(load(BigInt(`0x${data}`))), writes: [] }
			return { success: false, ret: word(load(0n)), writes: [] }
		case RET42:
			return { success: true, ret: word(42n), writes: [] }
		case REVERT:
			return { success: false, ret: 'deadbeef', writes: [] }
		case COUNTER: {
			const next = (load(0n) + 1n) & MAX_U256
			return { success: true, ret: word(next), writes: [[0n, next]] }
		}
		default:
			throw new Error(`model has no semantics for code 0x${account.code}`)
	}
}

type PendingTx = { from: string; status: 0 | 1; gasLimit: bigint; exactGas?: bigint; created?: string; to?: string }

class Model {
	state: State = { accounts: new Map(), block: 0n }
	snapshots: { id: string; state: State }[] = []
	snapshotCounter = 0
	/** Snapshot ids that were consumed by a revert. Reverting to them again must fail. */
	staleIds: string[] = []
	/** Every contract address a mined deployment targeted. Deliberately not reverted. */
	deployed: string[] = []
	pendingTx: PendingTx | undefined
	/** Mirrors the engine's `lastBlock` cursor for `block` events. */
	emitted = 0n

	constructor() {
		for (const address of [MINER, ...SENDERS]) this.account(address).balance = INITIAL_BALANCE
	}

	account(address: string): Account {
		let account = this.state.accounts.get(address)
		if (!account) {
			account = { balance: 0n, nonce: 0n, code: '', storage: new Map() }
			this.state.accounts.set(address, account)
		}
		return account
	}

	tracked(): string[] {
		return [MINER, ...SENDERS, ...PLAIN, ...this.deployed]
	}

	/** Block numbers the engine must emit after one dispatch. */
	blockEvents(): string[] {
		const numbers: string[] = []
		for (let number = this.emitted + 1n; number <= this.state.block; number++) numbers.push(q(number))
		this.emitted = this.state.block
		return numbers
	}

	/** Turn an abstract command into a concrete JSON-RPC call against the current state. */
	resolve(cmd: Single): Call {
		const all = this.tracked()
		const pick = (list: string[], index: number) => list[index % list.length] as string
		// Calls carrying calldata prefer accounts that hold code, so contract paths stay well exercised.
		const withCode = all.filter((address) => this.account(address).code !== '')
		const callee = (mode: number, index: number) => pick(mode !== 0 && withCode.length > 0 ? withCode : all, index)
		const calldata = (mode: number, s: number, v: number) => {
			const slot = word(SLOTS[s] as bigint)
			if (mode === 1) return slot + word(STORAGE_VALUES[v] as bigint)
			if (mode === 2) return slot
			return mode === 3 ? '01' : ''
		}
		switch (cmd.t) {
			case 'setBalance': {
				const value = BALANCES[cmd.v]
				return {
					method: 'anvil_setBalance',
					params: [pick(all, cmd.a), value === undefined ? `0x${'f'.repeat(65)}` : q(value)],
				}
			}
			case 'setNonce': {
				const address = pick(all.slice(1), cmd.a)
				const current = this.account(address).nonce
				const nonce =
					cmd.mode === 'bad' ? MAX_U64 + 1n : cmd.mode === 'abs' ? BigInt(cmd.n) : current - BigInt(cmd.n % 4)
				return { method: 'anvil_setNonce', params: [address, q(nonce < 0n ? 0n : nonce)] }
			}
			case 'setCode':
				return {
					method: 'anvil_setCode',
					params: [pick(all.slice(1 + SENDERS.length), cmd.a), cmd.bad ? '0xzz' : `0x${PROGRAMS[cmd.p]}`],
				}
			case 'setStorage': {
				const value = STORAGE_VALUES[cmd.v] as bigint
				return {
					method: 'anvil_setStorageAt',
					params: [pick(all.slice(1), cmd.a), q(SLOTS[cmd.s] as bigint), cmd.short ? q(value) : `0x${word(value)}`],
				}
			}
			case 'tx': {
				const from = SENDERS[cmd.from] as string
				const gas = cmd.deploy ? DEPLOY_GAS : CALL_GAS
				const balance = this.account(from).balance
				const affordable = balance - gas * GAS_PRICE
				const value = [0n, 0n, 1n, 1000n, 10n ** 18n, 10n ** 18n, balance + 1n, affordable > 0n ? affordable : 0n][
					cmd.value
				] as bigint
				return {
					method: 'eth_sendTransaction',
					params: [
						{
							from,
							...(cmd.deploy ? {} : { to: callee(cmd.mode, cmd.to) }),
							data: `0x${cmd.deploy ? initCode(PROGRAMS[cmd.p] as string) : calldata(cmd.mode, cmd.s, cmd.v)}`,
							value: q(value),
							gas: q(gas),
							gasPrice: q(GAS_PRICE),
						},
					],
				}
			}
			case 'call': {
				const from = pick(all, cmd.from)
				const value = cmd.value < 5 ? 0n : cmd.value < 7 ? 1n : this.account(from).balance + 1n
				return {
					method: 'eth_call',
					params: [
						{ from, to: callee(cmd.mode, cmd.to), data: `0x${calldata(cmd.mode, cmd.s, cmd.v)}`, value: q(value) },
						cmd.pending ? 'pending' : 'latest',
					],
				}
			}
			case 'mine':
				return cmd.n === null
					? { method: 'evm_mine', params: [] }
					: { method: 'anvil_mine', params: [q(BigInt(cmd.n))] }
			case 'snapshot':
				return { method: 'evm_snapshot', params: [] }
			case 'revert': {
				const live = this.snapshots[cmd.pick % Math.max(this.snapshots.length, 1)]?.id
				const stale = this.staleIds[cmd.pick % Math.max(this.staleIds.length, 1)]
				if (cmd.kind === 'malformed')
					return { method: 'evm_revert', params: [[], ['zz'], [1]][cmd.pick % 3] as JsonValue[] }
				const id = cmd.kind === 'live' ? live : cmd.kind === 'stale' ? stale : undefined
				return { method: 'evm_revert', params: [id ?? '0x99'] }
			}
			case 'read': {
				const address = pick(all, cmd.a)
				if (cmd.what === 0) return { method: 'eth_blockNumber', params: [] }
				if (cmd.what === 1) return { method: 'eth_getBalance', params: [address, 'latest'] }
				if (cmd.what === 2) return { method: 'eth_getTransactionCount', params: [address, 'latest'] }
				if (cmd.what === 3) return { method: 'eth_getCode', params: [address, 'latest'] }
				return { method: 'eth_getStorageAt', params: [address, q(SLOTS[cmd.s] as bigint), 'latest'] }
			}
			case 'unknown':
				return { method: 'fuzz_missingMethod', params: [] }
		}
	}

	/** Apply one JSON-RPC call and predict its outcome. */
	apply({ method, params }: Call): Outcome {
		const address = params[0] as string
		switch (method) {
			case 'eth_chainId':
				return { result: '0x7a69' }
			case 'eth_blockNumber':
				return { result: q(this.state.block) }
			case 'eth_getBalance':
				return { result: q(this.account(address).balance) }
			case 'eth_getTransactionCount':
				return { result: q(this.account(address).nonce) }
			case 'eth_getCode':
				return { result: `0x${this.account(address).code}` }
			case 'eth_getStorageAt':
				return { result: `0x${word(this.account(address).storage.get(BigInt(params[1] as string)) ?? 0n)}` }
			case 'anvil_setBalance': {
				const value = BigInt(params[1] as string)
				if (value > MAX_U256) return INVALID_PARAMS
				this.account(address).balance = value
				return { result: true }
			}
			case 'anvil_setNonce': {
				const value = BigInt(params[1] as string)
				if (value > MAX_U64) return INVALID_PARAMS
				this.account(address).nonce = value
				return { result: true }
			}
			case 'anvil_setCode': {
				const code = params[1] as string
				if (!/^0x([0-9a-f]{2})*$/.test(code)) return INVALID_PARAMS
				this.account(address).code = code.slice(2)
				return { result: true }
			}
			case 'anvil_setStorageAt': {
				this.store(this.account(address), BigInt(params[1] as string), BigInt(params[2] as string))
				return { result: true }
			}
			case 'evm_mine':
				this.state.block += 1n
				return { result: true }
			case 'anvil_mine':
				this.state.block += BigInt(params[0] as string)
				return { result: true }
			case 'evm_snapshot': {
				const id = q(BigInt(++this.snapshotCounter))
				this.snapshots.push({ id, state: cloneState(this.state) })
				return { result: id }
			}
			case 'evm_revert': {
				const id = params[0]
				if (typeof id !== 'string' || !/^0x[0-9a-f]+$/.test(id)) return INVALID_PARAMS
				const index = this.snapshots.findIndex((snapshot) => snapshot.id === id)
				if (index === -1) return { result: false }
				this.state = (this.snapshots[index] as { state: State }).state
				// Reverting consumes the snapshot and every snapshot taken after it.
				this.staleIds.push(...this.snapshots.splice(index).map((snapshot) => snapshot.id))
				return { result: true }
			}
			case 'eth_call': {
				const tx = params[0] as { from: string; to: string; data: string; value: string }
				if (BigInt(tx.value) > this.account(tx.from).balance) return reverted('')
				const frame = runProgram(this.account(tx.to), tx.data.slice(2))
				return frame.success ? { result: `0x${frame.ret}` } : reverted(frame.ret)
			}
			case 'eth_sendTransaction':
				return this.sendTransaction(
					params[0] as { from: string; to?: string; data: string; value: string; gas: string },
				)
			default:
				return METHOD_NOT_FOUND
		}
	}

	private store(account: Account, slot: bigint, value: bigint) {
		if (value === 0n) account.storage.delete(slot)
		else account.storage.set(slot, value)
	}

	private sendTransaction(tx: { from: string; to?: string; data: string; value: string; gas: string }): Outcome {
		const sender = this.account(tx.from)
		const value = BigInt(tx.value)
		const gasLimit = BigInt(tx.gas)
		// Admission requires the full up-front cost; a rejected transaction changes nothing.
		if (sender.balance < value + gasLimit * GAS_PRICE) return INTERNAL_ERROR
		const nonce = sender.nonce
		sender.nonce += 1n
		this.state.block += 1n
		const data = tx.data.slice(2)
		if (tx.to === undefined) {
			const created = getContractAddress({ from: tx.from as `0x${string}`, nonce }).toLowerCase()
			if (!this.deployed.includes(created)) this.deployed.push(created)
			const target = this.account(created)
			if (target.nonce !== 0n || target.code !== '') {
				// Address collision: the create fails and burns the whole gas limit.
				this.pendingTx = { from: tx.from, status: 0, gasLimit, exactGas: gasLimit }
			} else {
				target.code = data.slice(initCode('').length)
				target.nonce = 1n
				// A created contract starts with fresh storage, even where anvil_setStorageAt planted slots.
				target.storage.clear()
				sender.balance -= value
				target.balance += value
				this.pendingTx = { from: tx.from, status: 1, gasLimit, created }
			}
			return { result: TX_HASH }
		}
		const target = this.account(tx.to)
		const frame = runProgram(target, data)
		if (frame.success) {
			sender.balance -= value
			target.balance += value
			for (const [slot, stored] of frame.writes) this.store(target, slot, stored)
			// EIP-161: a successfully touched account that is still empty (no nonce, balance or code)
			// is deleted, which also drops storage planted there with anvil_setStorageAt.
			if (target.nonce === 0n && target.balance === 0n && target.code === '') target.storage.clear()
		}
		this.pendingTx = {
			from: tx.from,
			status: frame.success ? 1 : 0,
			gasLimit,
			to: tx.to,
			...(target.code === '' && data === '' ? { exactGas: 21_000n } : {}),
		}
		return { result: TX_HASH }
	}

	/** Charge fees once the receipt reveals gas used: the sender pays, the base fee burns. */
	finalizeTx(gasUsed: bigint, baseFee: bigint) {
		const pending = this.pendingTx
		if (!pending) throw new Error('no pending transaction')
		this.pendingTx = undefined
		this.account(pending.from).balance -= gasUsed * GAS_PRICE
		this.account(MINER).balance += gasUsed * (GAS_PRICE - baseFee)
	}
}

// ---------------------------------------------------------------------------------------
// (B) Async WASM-style bridge backend
// ---------------------------------------------------------------------------------------

type BridgeBug = 'dropBatchNotifications' | 'staleBalanceAcrossRevert'
type NativeNodeHandle = { rpc: (json: string) => string | null; close: () => void }

/**
 * Simulate a WASM bridge: every message is JSON round-tripped across the "boundary", batches are
 * split and dispatched entry by entry, and each hop has randomized microtask, immediate or timer
 * latency. Some calls return synchronously, which the `ZevmBackend` contract also allows.
 */
const createWasmBridge = (seed: number, bug?: BridgeBug) => {
	const { NativeNode } = createRequire(import.meta.url)('@evmts/zevm') as {
		NativeNode: new (config: object) => NativeNodeHandle
	}
	const inner = new NativeNode({})
	const r = prng(seed)
	const stats = { calls: 0, inFlight: 0, maxInFlight: 0, closed: false, usedAfterClose: false }
	let failNext: 'throw' | 'reject' | undefined
	let lastFault: Error | undefined
	const balanceCache = new Map<string, unknown>()

	const latency = async (timerPercent: number) => {
		const roll = r.next() * 100
		if (roll < timerPercent) return new Promise<void>((resolve) => setTimeout(resolve, r.int(3)))
		if (roll < timerPercent * 3) return new Promise<void>((resolve) => setImmediate(resolve))
		if (roll < 40) return
		if (roll < 60) return new Promise<void>((resolve) => queueMicrotask(resolve))
		for (let hops = 1 + r.int(4); hops > 0; hops--) await Promise.resolve()
	}
	/** Cross the boundary once: serialize the message, run it, deserialize the reply. */
	const cross = (message: unknown): unknown => {
		const request = message as { method?: string; params?: unknown; id?: unknown }
		const cacheKey =
			bug === 'staleBalanceAcrossRevert' && request?.method === 'eth_getBalance'
				? JSON.stringify(request.params)
				: undefined
		if (
			bug === 'staleBalanceAcrossRevert' &&
			request?.method !== undefined &&
			!/^eth_get|^eth_blockNumber$|^evm_revert$/.test(request.method)
		) {
			balanceCache.clear()
		}
		if (cacheKey !== undefined && balanceCache.has(cacheKey))
			return { jsonrpc: '2.0', id: request.id, result: balanceCache.get(cacheKey) }
		const reply = inner.rpc(JSON.stringify(message))
		const parsed = reply === null ? null : (JSON.parse(reply) as { result?: unknown })
		if (cacheKey !== undefined && parsed?.result !== undefined) balanceCache.set(cacheKey, parsed.result)
		return parsed
	}
	const finish = (replies: unknown[]) => {
		const kept = replies.filter((reply) => reply !== null)
		return kept.length === 0 ? null : JSON.stringify(kept)
	}
	const isDropped = (entry: unknown) =>
		bug === 'dropBatchNotifications' && typeof entry === 'object' && entry !== null && !('id' in entry)

	const backend: ZevmBackend = {
		rpc: (json) => {
			stats.calls++
			if (stats.closed) stats.usedAfterClose = true
			if (failNext) {
				const mode = failNext
				failNext = undefined
				lastFault = new Error(`injected bridge fault #${stats.calls}`)
				if (mode === 'throw') throw lastFault
				return Promise.reject(lastFault)
			}
			let message: unknown
			try {
				message = JSON.parse(json)
			} catch {
				// Unparseable input crosses untouched so the node produces its own parse error.
				return inner.rpc(json)
			}
			const batch = Array.isArray(message) && message.length > 0 ? message : undefined
			stats.inFlight++
			stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight)
			if (r.bool(0.15)) {
				try {
					if (batch) return finish(batch.filter((entry) => !isDropped(entry)).map(cross))
					const reply = cross(message)
					return reply === null ? null : JSON.stringify(reply)
				} finally {
					stats.inFlight--
				}
			}
			return (async () => {
				try {
					await latency(4)
					if (batch) {
						const replies: unknown[] = []
						for (const entry of batch) {
							if (isDropped(entry)) continue
							await latency(0.3)
							replies.push(cross(entry))
						}
						await latency(2)
						return finish(replies)
					}
					const reply = cross(message)
					await latency(2)
					return reply === null ? null : JSON.stringify(reply)
				} finally {
					stats.inFlight--
				}
			})()
		},
		close: async () => {
			await latency(20)
			inner.close()
			stats.closed = true
		},
	}
	return {
		backend,
		stats,
		armFault: (mode: 'throw' | 'reject') => {
			failNext = mode
		},
		lastFault: () => lastFault,
	}
}

// ---------------------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------------------

type Settled =
	| { ok: true; value: JsonValue }
	| { ok: false; error: { name: string; code: unknown; message: string; data: unknown } }
type Plan = {
	via: Via
	call?: Call
	json?: string
	/** Return a description of the mismatch between the model and an engine outcome, if any. */
	check: (main: Settled) => string | undefined
	hash?: (main: Settled) => unknown
}
type Observation = {
	main: Settled
	observed: string | null
	number: JsonValue
	block: Record<string, JsonValue>
	receipt: Record<string, JsonValue> | null
	log: string[]
	blocks: string[]
}
type Stats = {
	sequences: number
	steps: number
	commands: Record<string, number>
	txMined: number
	txFailed: number
	txRejected: number
	revertsApplied: number
	nestedReverts: number
	maxSnapshotDepth: number
	rpcErrors: number
	observedValues: number
	bridgeCalls: number
}
const newStats = (): Stats => ({
	sequences: 0,
	steps: 0,
	commands: {},
	txMined: 0,
	txFailed: 0,
	txRejected: 0,
	revertsApplied: 0,
	nestedReverts: 0,
	maxSnapshotDepth: 0,
	rpcErrors: 0,
	observedValues: 0,
	bridgeCalls: 0,
})

class Mismatch extends Error {
	override name = 'Mismatch'
}

const show = (value: unknown) => {
	const text = JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? `${item}n` : item))
	return text.length > 600 ? `${text.slice(0, 600)}…` : text
}

const settle = async (promise: Promise<JsonValue>): Promise<Settled> => {
	try {
		return { ok: true, value: await promise }
	} catch (error) {
		const failure = error as { name: string; code?: unknown; message: string; data?: unknown }
		return {
			ok: false,
			error: { name: failure.name, code: failure.code, message: failure.message, data: failure.data },
		}
	}
}

/** Compare a model expectation with an actual value, accepting any hash for `TX_HASH`. */
const matches = (expected: unknown, actual: unknown): boolean => {
	if (expected === TX_HASH) return typeof actual === 'string' && /^0x[0-9a-f]{64}$/.test(actual)
	if (Array.isArray(expected)) {
		return (
			Array.isArray(actual) &&
			actual.length === expected.length &&
			expected.every((item, index) => matches(item, actual[index]))
		)
	}
	if (typeof expected === 'object' && expected !== null) {
		if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) return false
		const keys = Object.keys(expected)
		return (
			keys.length === Object.keys(actual).length &&
			keys.every(
				(key) =>
					key in actual &&
					matches((expected as Record<string, unknown>)[key], (actual as Record<string, unknown>)[key]),
			)
		)
	}
	return expected === actual
}

const observationCalls = (addresses: string[]): Call[] => [
	{ method: 'eth_blockNumber', params: [] },
	...addresses.flatMap((address) => [
		{ method: 'eth_getBalance', params: [address, 'latest'] },
		{ method: 'eth_getTransactionCount', params: [address, 'latest'] },
		{ method: 'eth_getCode', params: [address, 'latest'] },
		...SLOTS.map((slot) => ({ method: 'eth_getStorageAt', params: [address, q(slot), 'latest'] })),
	]),
]

/** Build the concrete input for a command, apply it to the model and capture the expectation. */
const plan = (model: Model, cmd: Exclude<Cmd, { t: 'fault' }>, index: number): Plan => {
	const response = (id: JsonValue, outcome: Outcome) => ({ jsonrpc: '2.0', id, ...outcome })
	if (cmd.t === 'raw') {
		const describe = (expected: unknown, main: Settled) =>
			main.ok && matches(expected, main.value === null ? null : JSON.parse(main.value as string))
				? undefined
				: `expected raw response ${show(expected)}`
		if (cmd.kind === 'malformed') {
			return {
				via: 'rpc',
				json: '{',
				check: (main) =>
					main.ok && JSON.parse(main.value as string)?.error?.code === -32700
						? undefined
						: 'expected a -32700 parse error',
			}
		}
		if (cmd.kind === 'empty') {
			const expected = { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } }
			return { via: 'rpc', json: '[]', check: (main) => describe(expected, main) }
		}
		const call: Call =
			cmd.kind === 'notifyMine' ? { method: 'evm_mine', params: [] } : { method: 'eth_chainId', params: [] }
		model.apply(call)
		return { via: 'rpc', json: JSON.stringify({ jsonrpc: '2.0', ...call }), check: (main) => describe(null, main) }
	}
	if (cmd.t === 'batch') {
		// Resolve every entry against the pre-batch state, then apply them in order.
		const calls = cmd.entries.map((entry) => ({ entry, call: model.resolve(entry.c) }))
		const wire: unknown[] = []
		const expected: unknown[] = []
		calls.forEach(({ entry, call }, position) => {
			const outcome = model.apply(call)
			if (entry.id === 'none') {
				wire.push({ jsonrpc: '2.0', ...call })
				return
			}
			const id = entry.id === 'num' ? position + 1 : `id-${position}`
			wire.push({ jsonrpc: '2.0', id, ...call })
			expected.push(response(id, outcome))
		})
		if (cmd.junk) {
			wire.push(1)
			expected.push({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } })
		}
		return {
			via: 'rpc',
			json: JSON.stringify(wire),
			check: (main) =>
				main.ok &&
				matches(expected.length === 0 ? null : expected, main.value === null ? null : JSON.parse(main.value as string))
					? undefined
					: `expected batch response ${show(expected)}`,
			hash: (main) =>
				main.ok && main.value !== null ? JSON.parse(main.value as string).at(cmd.junk ? -2 : -1)?.result : undefined,
		}
	}
	const call = model.resolve(cmd)
	const outcome = model.apply(call)
	if (cmd.via === 'request') {
		return {
			via: 'request',
			call,
			check: (main) => {
				if ('result' in outcome)
					return main.ok && matches(outcome.result, main.value) ? undefined : `expected result ${show(outcome.result)}`
				const { error } = outcome
				return !main.ok &&
					main.error.name === 'NativeRpcError' &&
					main.error.code === error.code &&
					main.error.message.split('\n')[0] === error.message &&
					main.error.data === error.data
					? undefined
					: `expected NativeRpcError ${show(error)}`
			},
			hash: (main) => (main.ok ? main.value : undefined),
		}
	}
	const id = 1000 + index
	const expected = response(id, outcome)
	return {
		via: 'rpc',
		json: JSON.stringify({ jsonrpc: '2.0', id, ...call }),
		check: (main) =>
			main.ok && matches(expected, JSON.parse(main.value as string))
				? undefined
				: `expected response ${show(expected)}`,
		hash: (main) => (main.ok ? JSON.parse(main.value as string).result : undefined),
	}
}

type Probe = { engine: ZevmEngine; log: string[]; blocks: string[] }

const track = (engine: ZevmEngine, listen: boolean): Probe => {
	const probe: Probe = { engine, log: [], blocks: [] }
	engine.events.on('request', (request: { method: string }) => probe.log.push(`req:${request.method}`))
	engine.events.on('response', ({ request }: { request: { method: string } }) =>
		probe.log.push(`res:${request.method}`),
	)
	if (listen) engine.events.on('block', (block: { number: string }) => probe.blocks.push(block.number))
	return probe
}

/**
 * Issue the command and every follow-up read in the same tick, without awaiting in between.
 * The engine queue alone must make the reads observe the command's effects.
 */
const drive = async (probe: Probe, step: Plan, observationJson: string, mined: boolean): Promise<Observation> => {
	const { engine } = probe
	probe.log.length = 0
	probe.blocks.length = 0
	const main = settle(step.via === 'request' ? engine.request(step.call as Call) : engine.rpc(step.json as string))
	const observed = engine.rpc(observationJson)
	const number = engine.request({ method: 'eth_blockNumber' })
	const block = engine.request({ method: 'eth_getBlockByNumber', params: ['latest', false] })
	const settled = await main
	const hash = mined ? step.hash?.(settled) : undefined
	const receipt =
		typeof hash === 'string' ? await engine.request({ method: 'eth_getTransactionReceipt', params: [hash] }) : null
	return {
		main: settled,
		observed: await observed,
		number: await number,
		block: (await block) as Record<string, JsonValue>,
		receipt: receipt as Record<string, JsonValue> | null,
		log: [...probe.log],
		blocks: [...probe.blocks],
	}
}

type RunOptions = { bug?: BridgeBug; stats?: Stats }

/** Run one sequence against (A), (B) and (C). Throws `Mismatch` at the first divergence. */
const runSequence = async (sequence: Sequence, options: RunOptions = {}): Promise<void> => {
	const { stats } = options
	const model = new Model()
	const bridge = createWasmBridge(sequence.seed ^ 0x9e3779b9, options.bug)
	const a = createZevmEngine()
	const b = createZevmEngine({ backend: bridge.backend })
	const probes = [track(a, sequence.listen), track(b, sequence.listen)] as const

	const step = async (index: number, original: Cmd) => {
		const where = `step ${index} ${show(original)}`
		const fail = (what: string, detail: Record<string, unknown>): never => {
			throw new Mismatch(
				`${where}: ${what}\n${Object.entries(detail)
					.map(([name, value]) => `    ${name}: ${show(value)}`)
					.join('\n')}`,
			)
		}
		let cmd = original
		if (cmd.t === 'fault') {
			// Error propagation: a failing backend call must reject exactly that request with the
			// backend's own error, leave the queue usable and leave state untouched.
			bridge.armFault(cmd.mode)
			probes[1].log.length = 0
			const failed = await settle(
				cmd.via === 'request'
					? b.request({ method: 'eth_chainId' })
					: b.rpc('{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}'),
			)
			const fault = bridge.lastFault()
			if (failed.ok || failed.error.message !== fault?.message)
				fail('backend fault was not propagated', { failed, fault: fault?.message })
			if (!isDeepStrictEqual(probes[1].log, cmd.via === 'request' ? ['req:eth_chainId'] : [])) {
				fail('unexpected events for a failed backend call', { log: probes[1].log })
			}
			cmd = { t: 'read', what: 0, a: 0, s: 0, via: cmd.via }
		}
		const depthBefore = model.snapshots.length
		const current = plan(model, cmd, index)
		const mined = model.pendingTx !== undefined
		const calls = observationCalls(model.tracked())
		const observationJson = JSON.stringify(calls.map((call, id) => ({ jsonrpc: '2.0', id, ...call })))
		const [ra, rb] = await Promise.all([
			drive(probes[0], current, observationJson, mined),
			drive(probes[1], current, observationJson, mined),
		])

		// (A) versus (B): byte-identical wire results and identical derived state.
		if (!isDeepStrictEqual(ra.main, rb.main))
			fail('command outcome differs between native and bridge', { native: ra.main, bridge: rb.main })
		if (ra.observed !== rb.observed)
			fail('observed state differs between native and bridge', { native: ra.observed, bridge: rb.observed })
		if (ra.number !== rb.number)
			fail('block number differs between native and bridge', { native: ra.number, bridge: rb.number })
		// Timestamps are pinned at setup, so hashes, parent hashes and state roots must match exactly.
		if (!isDeepStrictEqual(ra.block, rb.block)) {
			fail('latest block differs between native and bridge', { native: ra.block, bridge: rb.block })
		}
		if (!isDeepStrictEqual(ra.receipt, rb.receipt)) {
			fail('receipt differs between native and bridge', { native: ra.receipt, bridge: rb.receipt })
		}
		if (!isDeepStrictEqual(ra.log, rb.log)) fail('request/response events differ', { native: ra.log, bridge: rb.log })
		if (!isDeepStrictEqual(ra.blocks, rb.blocks)) fail('block events differ', { native: ra.blocks, bridge: rb.blocks })
		if (bridge.stats.maxInFlight > 1)
			fail('engine dispatched overlapping calls to the async backend', { ...bridge.stats })

		// (C) versus (A): (B) already equals (A).
		const mismatch = current.check(ra.main)
		if (mismatch) fail(`native outcome disagrees with the model: ${mismatch}`, { native: ra.main })
		if (mined) {
			const pending = model.pendingTx as PendingTx
			const receipt = ra.receipt
			if (receipt === null)
				return fail('model expected a mined transaction but there is no receipt', { native: ra.main })
			const gasUsed = BigInt(receipt.gasUsed as string)
			const expectedReceipt = {
				status: q(BigInt(pending.status)),
				blockNumber: q(model.state.block),
				from: pending.from,
				to: pending.to ?? null,
				...(pending.created ? { contractAddress: pending.created } : {}),
				...(pending.exactGas === undefined ? {} : { gasUsed: q(pending.exactGas) }),
				effectiveGasPrice: q(GAS_PRICE),
			}
			for (const [key, value] of Object.entries(expectedReceipt)) {
				if (receipt[key] !== value) fail(`receipt.${key} disagrees with the model`, { expected: value, receipt })
			}
			if (gasUsed > pending.gasLimit) fail('gasUsed exceeds the gas limit', { receipt })
			if (stats) pending.status === 1 ? stats.txMined++ : stats.txFailed++
			model.finalizeTx(gasUsed, BigInt(ra.block.baseFeePerGas as string))
		}
		const actual = JSON.parse(ra.observed as string) as { id: number; result?: JsonValue }[]
		calls.forEach((call, id) => {
			const expected = model.apply(call)
			if (!isDeepStrictEqual(actual[id], { jsonrpc: '2.0', id, ...expected })) {
				fail(`state disagrees with the model for ${call.method} ${show(call.params)}`, { expected, native: actual[id] })
			}
		})
		if (ra.number !== q(model.state.block) || ra.block.number !== q(model.state.block)) {
			fail('block number disagrees with the model', {
				expected: q(model.state.block),
				native: ra.number,
				latest: ra.block.number,
			})
		}
		if (sequence.listen) {
			const expected = model.blockEvents()
			if (!isDeepStrictEqual(ra.blocks, expected))
				fail('block events disagree with the model', { expected, native: ra.blocks })
		}
		if (stats) {
			stats.steps++
			stats.commands[original.t] = (stats.commands[original.t] ?? 0) + 1
			stats.observedValues += calls.length
			stats.maxSnapshotDepth = Math.max(stats.maxSnapshotDepth, model.snapshots.length)
			if (!ra.main.ok || (typeof ra.main.value === 'string' && ra.main.value.includes('"error"'))) stats.rpcErrors++
			if (cmd.t === 'tx' && !mined) stats.txRejected++
			if (model.snapshots.length < depthBefore) {
				stats.revertsApplied++
				if (depthBefore - model.snapshots.length >= 2) stats.nestedReverts++
			}
		}
	}

	try {
		await Promise.all([a.ready(), b.ready()])
		// Block timestamps default to max(wall clock, parent + 1) and feed block hashes and, through
		// the EIP-2935 history contract, state roots. Pinning the first block in the future makes
		// every later block of both engines byte-for-byte reproducible.
		for (const engine of [a, b]) {
			await engine.request({ method: 'evm_setNextBlockTimestamp', params: ['0xf0000000'] })
			await engine.request({ method: 'evm_mine' })
		}
		model.state.block = 1n
		model.emitted = 1n
		await step(-1, { t: 'read', what: 0, a: 0, s: 0, via: 'request' })
		for (const [index, cmd] of sequence.commands.entries()) await step(index, cmd)

		// Queue ordering across close: work issued before close() must finish before the engine closes.
		const expectedBalance = q(model.account(MINER).balance)
		const expectedNumber = JSON.stringify({ jsonrpc: '2.0', id: 'tail', result: q(model.state.block) })
		for (const [name, engine] of [
			['native', a],
			['bridge', b],
		] as const) {
			const balance = settle(engine.request({ method: 'eth_getBalance', params: [MINER, 'latest'] }))
			const number = settle(engine.rpc('{"jsonrpc":"2.0","id":"tail","method":"eth_blockNumber"}'))
			const closing = engine.close()
			const tail = [await balance, await number]
			await closing
			if (
				!isDeepStrictEqual(tail, [
					{ ok: true, value: expectedBalance },
					{ ok: true, value: expectedNumber },
				])
			) {
				throw new Mismatch(`close: ${name} engine dropped requests issued before close()\n    outcome: ${show(tail)}`)
			}
			const after = await settle(engine.request({ method: 'eth_blockNumber' }))
			if (after.ok || !after.error.message.includes('engine is closed')) {
				throw new Mismatch(`close: ${name} engine accepted a request after close()\n    outcome: ${show(after)}`)
			}
		}
		if (!bridge.stats.closed || bridge.stats.usedAfterClose || bridge.stats.maxInFlight > 1) {
			throw new Mismatch(`close: bridge lifecycle violated ${show(bridge.stats)}`)
		}
		if (stats) {
			stats.sequences++
			stats.bridgeCalls += bridge.stats.calls
		}
	} finally {
		await Promise.allSettled([a.close(), b.close()])
	}
}

// ---------------------------------------------------------------------------------------
// Shrinker
// ---------------------------------------------------------------------------------------

const attempt = async (sequence: Sequence, options: RunOptions = {}): Promise<Error | undefined> => {
	try {
		await runSequence(sequence, options)
		return undefined
	} catch (error) {
		return error as Error
	}
}

/**
 * Delta-debug a failing sequence: drop the tail after the failing step, then remove chunks of
 * halving size while the sequence still fails. Removal is always valid because commands are abstract.
 */
const shrink = async (sequence: Sequence, error: Error, options: RunOptions = {}, budget = 250) => {
	let best = sequence
	let bestError = error
	const failingStep = /^step (-?\d+)/.exec(error.message)
	const tryCommands = async (commands: Cmd[]) => {
		if (budget-- <= 0) return false
		const candidate = { ...best, commands }
		const failure = await attempt(candidate, { ...(options.bug ? { bug: options.bug } : {}) })
		if (!failure) return false
		best = candidate
		bestError = failure
		return true
	}
	if (failingStep) await tryCommands(best.commands.slice(0, Number(failingStep[1]) + 1))
	for (let chunk = Math.max(1, best.commands.length >> 1); chunk >= 1; chunk >>= 1) {
		for (let start = 0; start < best.commands.length; ) {
			const removed = await tryCommands([...best.commands.slice(0, start), ...best.commands.slice(start + chunk)])
			if (!removed) start += chunk
		}
	}
	return { sequence: best, error: bestError }
}

const report = (original: Sequence, shrunk: { sequence: Sequence; error: Error }) =>
	[
		`stateful differential fuzz failure (seed ${original.seed}, ${original.commands.length} commands)`,
		`replay: FUZZ_SEED=${original.seed} FUZZ_RUNS=1 vitest run src/statefulDifferential.fuzz.spec.ts`,
		`shrunk to ${shrunk.sequence.commands.length} commands (listen=${shrunk.sequence.listen}):`,
		JSON.stringify(shrunk.sequence.commands),
		shrunk.error.stack ?? shrunk.error.message,
	].join('\n')

// ---------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------

const BASE_SEED = Number(process.env.FUZZ_SEED ?? 0x5eedf00d)
const RUNS = Number(process.env.FUZZ_RUNS ?? 256)
const CHUNKS = 4

describe('stateful differential fuzz: native ZEVM vs async WASM-style backend vs reference model', () => {
	const stats = newStats()

	it.each(
		Array.from({ length: CHUNKS }, (_, chunk) => chunk),
	)('native, bridge and model agree at every step (seed chunk %i)', async (chunk) => {
		for (let run = chunk; run < RUNS; run += CHUNKS) {
			const sequence = genSequence(BASE_SEED + run)
			const failure = await attempt(sequence, { stats })
			if (failure) throw new Error(report(sequence, await shrink(sequence, failure)))
		}
	}, 600_000)

	it('explores every command kind, nested reverts and both success and failure paths', () => {
		console.info(`stateful differential fuzz coverage: ${JSON.stringify(stats)}`)
		expect(stats.sequences).toBe(RUNS)
		if (RUNS < 100) return
		expect(stats.steps).toBeGreaterThanOrEqual(RUNS * 11)
		for (const kind of [
			'setBalance',
			'setNonce',
			'setCode',
			'setStorage',
			'tx',
			'call',
			'mine',
			'snapshot',
			'revert',
			'batch',
			'raw',
			'fault',
		]) {
			expect(stats.commands[kind] ?? 0, kind).toBeGreaterThan(20)
		}
		expect(stats.txMined).toBeGreaterThan(100)
		expect(stats.txFailed).toBeGreaterThan(20)
		expect(stats.txRejected).toBeGreaterThan(10)
		expect(stats.revertsApplied).toBeGreaterThan(50)
		expect(stats.nestedReverts).toBeGreaterThan(10)
		expect(stats.maxSnapshotDepth).toBeGreaterThanOrEqual(4)
		expect(stats.rpcErrors).toBeGreaterThan(50)
	})
})

describe('stateful differential fuzz: the harness detects and shrinks injected bridge bugs', () => {
	const hunt = async (bug: BridgeBug) => {
		for (let run = 0; run < 60; run++) {
			const sequence = genSequence(0xb06 + run)
			const failure = await attempt(sequence, { bug })
			if (failure) return { sequence, shrunk: await shrink(sequence, failure, { bug }) }
		}
		return undefined
	}

	it('finds a bridge that drops notifications inside batches', async () => {
		const found = await hunt('dropBatchNotifications')
		expect(found).toBeDefined()
		const commands = found?.shrunk.sequence.commands ?? []
		expect(commands.length).toBeLessThanOrEqual(3)
		expect(commands.at(-1)?.t).toBe('batch')
		expect(found?.shrunk.error.message).toMatch(/differs between native and bridge/)
	}, 300_000)

	it('finds a bridge whose balance cache survives evm_revert', async () => {
		const found = await hunt('staleBalanceAcrossRevert')
		expect(found).toBeDefined()
		const commands = found?.shrunk.sequence.commands ?? []
		expect(commands.length).toBeLessThanOrEqual(6)
		expect(JSON.stringify(commands)).toContain('"revert"')
		expect(found?.shrunk.error.message).toMatch(/differs between native and bridge/)
	}, 300_000)

	it('is deterministic: a seed always generates the same sequence', () => {
		expect(genSequence(1234)).toEqual(genSequence(1234))
		expect(genSequence(1234)).not.toEqual(genSequence(1235))
	})
})

describe('stateful differential fuzz: permanent regressions', () => {
	// Found by this fuzzer and shrunk to an empty command sequence (seed 1592651789): request() and
	// rpc() awaited `ready` before joining the queue while close() joined it immediately, so work
	// issued before close() in the same tick ran after it and rejected with "engine is closed".
	it.each([
		'native',
		'bridge',
	] as const)('runs requests issued before close() ahead of the close on the %s engine', async (kind) => {
		const bridge = createWasmBridge(7)
		if (kind === 'native') await bridge.backend.close()
		const engine = kind === 'native' ? createZevmEngine() : createZevmEngine({ backend: bridge.backend })
		const order: string[] = []
		engine.events.on('request', (request: { method: string }) => order.push(request.method))
		engine.events.on('close', () => order.push('close'))
		const mined = engine.request({ method: 'evm_mine' })
		const number = engine.rpc('{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}')
		const balance = engine.request({ method: 'eth_getBalance', params: [MINER, 'latest'] })
		const closing = engine.close()
		const late = engine.request({ method: 'eth_blockNumber' })
		late.catch(() => {})
		expect(await mined).toBe(true)
		expect(await number).toBe('{"jsonrpc":"2.0","id":1,"result":"0x1"}')
		expect(await balance).toBe(q(INITIAL_BALANCE))
		await closing
		await expect(late).rejects.toThrow('engine is closed')
		expect(order).toEqual(['evm_mine', 'eth_getBalance', 'close'])
		if (kind === 'bridge') expect(bridge.stats).toMatchObject({ closed: true, usedAfterClose: false, maxInFlight: 1 })
	})

	it('keeps issue order when requests race engine initialization on an async backend', async () => {
		const bridge = createWasmBridge(11)
		const engine = createZevmEngine({ backend: bridge.backend, mining: { auto: true } })
		// Nothing is awaited: these join the queue while initialization is still in flight.
		const results = Promise.all([
			engine.request({ method: 'evm_snapshot' }),
			engine.request({ method: 'anvil_mine', params: ['0x3'] }),
			engine.rpc('{"jsonrpc":"2.0","id":"n","method":"eth_blockNumber"}'),
			engine.request({ method: 'evm_revert', params: ['0x1'] }),
			engine.request({ method: 'eth_blockNumber' }),
		])
		const closing = engine.close()
		expect(await results).toEqual(['0x1', true, '{"jsonrpc":"2.0","id":"n","result":"0x3"}', true, '0x0'])
		await closing
	})
})
