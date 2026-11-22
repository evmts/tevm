import {
	tevmCall,
	tevmDeal,
	tevmDeploy,
	tevmDumpState,
	tevmGetAccount,
	tevmLoadState,
	tevmMine,
	tevmSetAccount,
} from '@tevm/actions'
import { createZevmEngine, type ZevmEngine } from '@tevm/node'
import fc from 'fast-check'
import { type Address, type Hex, toHex } from 'viem'
import { describe, expect, it } from 'vitest'
import {
	buildDeployInitcode,
	bytes32Arb,
	hexBytesArb,
	LOG_EMITTER_RUNTIME,
	modelAddressArb,
	modelAddressPool,
	modelSlotArb,
	modelSlotPool,
	STORAGE_BOX_RUNTIME,
	u256Arb,
} from './arbitraries.js'
import { FUZZ_CONFIG, fcParams } from './config.js'

interface AccountSnapshot {
	balance: bigint
	nonce: bigint
	code: Hex
	storage: Map<Hex, Hex>
}

interface WorldSnapshot {
	blockNumber: bigint
	accounts: Map<Address, AccountSnapshot>
	storageBoxAddress: Address | undefined
	storageBoxValue: Hex
}

interface EvmModel {
	blockNumber: bigint
	automine: boolean
	pendingTxCount: number
	accounts: Map<Address, AccountSnapshot>
	snapshots: Array<{ id: Hex; state: WorldSnapshot }>
	storageBoxAddress: Address | undefined
	storageBoxValue: Hex
	logEmitterAddress: Address | undefined
	emittedLogTopics: Hex[]
}

interface EvmReal {
	engine: ZevmEngine
	fundedSender: Address
}

const cloneAccount = (acc: AccountSnapshot): AccountSnapshot => ({
	balance: acc.balance,
	nonce: acc.nonce,
	code: acc.code,
	storage: new Map(acc.storage),
})

const cloneWorld = (m: EvmModel): WorldSnapshot => ({
	blockNumber: m.blockNumber,
	accounts: new Map(Array.from(m.accounts.entries(), ([k, v]) => [k, cloneAccount(v)])),
	storageBoxAddress: m.storageBoxAddress,
	storageBoxValue: m.storageBoxValue,
})

const getOrInitAccount = (m: EvmModel, address: Address): AccountSnapshot => {
	let acc = m.accounts.get(address)
	if (!acc) {
		acc = { balance: 0n, nonce: 0n, code: '0x', storage: new Map() }
		m.accounts.set(address, acc)
	}
	return acc
}

class SetBalanceCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly address: Address,
		readonly balance: bigint,
	) {}
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		await tevmDeal(r.engine, { address: this.address, amount: this.balance })
		getOrInitAccount(m, this.address).balance = this.balance
		const acc = await tevmGetAccount(r.engine, { address: this.address })
		expect(acc.balance).toBe(this.balance)
	}
	toString = () => `SetBalance(${this.address.slice(-4)}, ${this.balance})`
}

class SetNonceCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly address: Address,
		readonly nonce: bigint,
	) {}
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		await tevmSetAccount(r.engine, { address: this.address, nonce: this.nonce })
		getOrInitAccount(m, this.address).nonce = this.nonce
		const acc = await tevmGetAccount(r.engine, { address: this.address })
		expect(acc.nonce).toBe(this.nonce)
	}
	toString = () => `SetNonce(${this.address.slice(-4)}, ${this.nonce})`
}

class SetStorageCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly address: Address,
		readonly slot: Hex,
		readonly value: Hex,
	) {}
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		await tevmSetAccount(r.engine, {
			address: this.address,
			storage: { [this.slot]: this.value },
		})
		getOrInitAccount(m, this.address).storage.set(this.slot, this.value)
		const actual = (await r.engine.request({
			method: 'eth_getStorageAt',
			params: [this.address, this.slot, 'latest'],
		})) as Hex
		expect(actual.toLowerCase()).toBe(this.value.toLowerCase())
	}
	toString = () => `SetStorage(${this.address.slice(-4)}, ${this.slot.slice(-4)}, ${this.value.slice(-4)})`
}

class SetCodeCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly address: Address,
		readonly code: Hex,
	) {}
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		await tevmSetAccount(r.engine, { address: this.address, deployedBytecode: this.code })
		getOrInitAccount(m, this.address).code = this.code
		const acc = await tevmGetAccount(r.engine, { address: this.address })
		expect(acc.deployedBytecode.toLowerCase()).toBe(this.code.toLowerCase())
	}
	toString = () => `SetCode(${this.address.slice(-4)}, len=${(this.code.length - 2) / 2})`
}

class MineBlocksCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly blocks: number,
		readonly interval: number,
	) {}
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		await tevmMine(r.engine, { blocks: this.blocks, interval: this.interval })
		m.blockNumber += BigInt(this.blocks)
		m.pendingTxCount = 0
		const actual = BigInt((await r.engine.request({ method: 'eth_blockNumber' })) as string)
		expect(actual).toBe(m.blockNumber)
	}
	toString = () => `Mine(${this.blocks}, interval=${this.interval})`
}

class TransferEthCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(
		readonly to: Address,
		readonly value: bigint,
	) {}
	check = (m: Readonly<EvmModel>) => m.automine && getOrInitAccount(m as EvmModel, this.to).code === '0x'
	async run(m: EvmModel, r: EvmReal) {
		const beforeTo = (await tevmGetAccount(r.engine, { address: this.to })).balance
		const beforeSenderNonce = BigInt(
			(await r.engine.request({
				method: 'eth_getTransactionCount',
				params: [r.fundedSender, 'latest'],
			})) as string,
		)
		const result = await tevmCall(r.engine, {
			from: r.fundedSender,
			to: this.to,
			value: this.value,
			gas: 21_000n,
			addToBlockchain: true,
		})
		expect(result.receipt).toMatchObject({ status: '0x1' })
		m.blockNumber += 1n
		const afterTo = (await tevmGetAccount(r.engine, { address: this.to })).balance
		const afterSenderNonce = BigInt(
			(await r.engine.request({
				method: 'eth_getTransactionCount',
				params: [r.fundedSender, 'latest'],
			})) as string,
		)
		expect(afterTo).toBe(beforeTo + this.value)
		expect(afterSenderNonce).toBe(beforeSenderNonce + 1n)
		getOrInitAccount(m, this.to).balance = afterTo
	}
	toString = () => `TransferEth(${this.to.slice(-4)}, ${this.value})`
}

class SnapshotCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	check = (m: Readonly<EvmModel>) => m.snapshots.length < 6
	async run(m: EvmModel, r: EvmReal) {
		const id = (await r.engine.request({ method: 'evm_snapshot' })) as Hex
		expect(id).toMatch(/^0x[0-9a-f]+$/i)
		m.snapshots.push({ id, state: cloneWorld(m) })
	}
	toString = () => 'Snapshot()'
}

class RevertCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(readonly depthFromTop: number) {}
	check = (m: Readonly<EvmModel>) => m.snapshots.length > 0
	async run(m: EvmModel, r: EvmReal) {
		const idx = Math.max(0, m.snapshots.length - 1 - (this.depthFromTop % m.snapshots.length))
		const target = m.snapshots[idx]!
		const reverted = (await r.engine.request({ method: 'evm_revert', params: [target.id] })) as boolean
		expect(reverted).toBe(true)
		// Reverting invalidates this snapshot and any newer snapshots.
		m.snapshots = m.snapshots.slice(0, idx)
		m.blockNumber = target.state.blockNumber
		m.accounts = new Map(Array.from(target.state.accounts.entries(), ([k, v]) => [k, cloneAccount(v)]))
		m.storageBoxAddress = target.state.storageBoxAddress
		m.storageBoxValue = target.state.storageBoxValue

		// Verify EVERY modeled account, balance, nonce, code, and storage slot matches!
		const actualBlock = BigInt((await r.engine.request({ method: 'eth_blockNumber' })) as string)
		expect(actualBlock).toBe(m.blockNumber)
		for (const addr of modelAddressPool) {
			const expected = m.accounts.get(addr) ?? { balance: 0n, nonce: 0n, code: '0x' as Hex, storage: new Map() }
			const actual = await tevmGetAccount(r.engine, { address: addr })
			expect(actual.balance).toBe(expected.balance)
			expect(actual.nonce).toBe(expected.nonce)
			expect(actual.deployedBytecode.toLowerCase()).toBe(expected.code.toLowerCase())
			for (const slot of modelSlotPool) {
				const expectedSlot = expected.storage.get(slot) ?? toHex(0n, { size: 32 })
				const actualSlot = (await r.engine.request({
					method: 'eth_getStorageAt',
					params: [addr, slot, 'latest'],
				})) as Hex
				expect(actualSlot.toLowerCase()).toBe(expectedSlot.toLowerCase())
			}
		}
		if (m.storageBoxAddress) {
			const call = await tevmCall(r.engine, { to: m.storageBoxAddress, data: '0x' })
			expect(call.rawData.toLowerCase()).toBe(m.storageBoxValue.toLowerCase())
		}
	}
	toString = () => `Revert(offset=${this.depthFromTop})`
}

class DeployAndWriteStorageBoxCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	constructor(readonly value: Hex) {}
	check = (m: Readonly<EvmModel>) => m.automine
	async run(m: EvmModel, r: EvmReal) {
		if (!m.storageBoxAddress) {
			const deployed = await tevmDeploy(r.engine, {
				from: r.fundedSender,
				bytecode: buildDeployInitcode(STORAGE_BOX_RUNTIME),
			})
			expect(deployed.createdAddress).toMatch(/^0x[0-9a-f]{40}$/i)
			m.storageBoxAddress = deployed.createdAddress!
			m.storageBoxValue = toHex(0n, { size: 32 })
			m.blockNumber += 1n
		}
		const tx = await tevmCall(r.engine, {
			from: r.fundedSender,
			to: m.storageBoxAddress,
			data: this.value,
			gas: 100_000n,
			addToBlockchain: true,
		})
		expect(tx.receipt).toMatchObject({ status: '0x1' })
		m.blockNumber += 1n
		m.storageBoxValue = this.value
		const read = await tevmCall(r.engine, { to: m.storageBoxAddress, data: '0x' })
		expect(read.rawData.toLowerCase()).toBe(this.value.toLowerCase())
	}
	toString = () => `StorageBoxWrite(${this.value.slice(-8)})`
}

class DumpAndVerifyInFreshEngineCmd implements fc.AsyncCommand<EvmModel, EvmReal> {
	check = () => true
	async run(m: EvmModel, r: EvmReal) {
		const dumped = await tevmDumpState(r.engine)
		expect(dumped).toMatch(/^0x[0-9a-f]*$/i)
		const cloneEngine = createZevmEngine()
		try {
			await cloneEngine.ready()
			await tevmLoadState(cloneEngine, dumped)
			for (const [addr, expected] of m.accounts.entries()) {
				const actual = await tevmGetAccount(cloneEngine, { address: addr })
				expect(actual.balance).toBe(expected.balance)
				expect(actual.nonce).toBe(expected.nonce)
				expect(actual.deployedBytecode.toLowerCase()).toBe(expected.code.toLowerCase())
				for (const [slot, val] of expected.storage.entries()) {
					const got = (await cloneEngine.request({
						method: 'eth_getStorageAt',
						params: [addr, slot, 'latest'],
					})) as Hex
					expect(got.toLowerCase()).toBe(val.toLowerCase())
				}
			}
		} finally {
			await cloneEngine.close()
		}
	}
	toString = () => 'DumpAndVerifyInFreshEngine()'
}

describe('Native ZEVM stateful model-based EVM fuzzing', () => {
	it('fuzz: arbitrary sequences of account mutations, transfers, contracts, mining, snapshots/reverts, and state dump/load preserve exact invariants', async () => {
		const commandArb = fc.commands(
			[
				fc.tuple(modelAddressArb, u256Arb).map(([a, b]) => new SetBalanceCmd(a, b)),
				fc.tuple(modelAddressArb, fc.bigInt({ min: 0n, max: 1_000_000n })).map(([a, n]) => new SetNonceCmd(a, n)),
				fc.tuple(modelAddressArb, modelSlotArb, bytes32Arb).map(([a, s, v]) => new SetStorageCmd(a, s, v)),
				fc.tuple(modelAddressArb, hexBytesArb(0, 48)).map(([a, c]) => new SetCodeCmd(a, c)),
				fc
					.tuple(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 0, max: 60 }))
					.map(([b, i]) => new MineBlocksCmd(b, i)),
				fc
					.tuple(modelAddressArb, fc.bigInt({ min: 0n, max: 10n ** 15n }))
					.map(([to, val]) => new TransferEthCmd(to, val)),
				fc.constant(new SnapshotCmd()),
				fc.integer({ min: 0, max: 5 }).map((d) => new RevertCmd(d)),
				bytes32Arb.map((v) => new DeployAndWriteStorageBoxCmd(v)),
				fc.constant(new DumpAndVerifyInFreshEngineCmd()),
			],
			{ maxCommands: FUZZ_CONFIG.maxCommands },
		)

		await fc.assert(
			fc.asyncProperty(commandArb, async (cmds) => {
				const engine = createZevmEngine()
				try {
					await engine.ready()
					const [fundedSender] = (await engine.request({ method: 'eth_accounts' })) as Address[]
					expect(fundedSender).toBeDefined()
					const model: EvmModel = {
						blockNumber: 0n,
						automine: true,
						pendingTxCount: 0,
						accounts: new Map(),
						snapshots: [],
						storageBoxAddress: undefined,
						storageBoxValue: toHex(0n, { size: 32 }),
						logEmitterAddress: undefined,
						emittedLogTopics: [],
					}
					await fc.asyncModelRun(() => ({ model, real: { engine, fundedSender: fundedSender! } }), cmds)
				} finally {
					await engine.close()
				}
			}),
			fcParams('model'),
		)
	})

	it('fuzz: log emission, eth_newFilter, eth_getFilterChanges, and eth_getLogs agree across fuzzed topics and payloads', async () => {
		const engine = createZevmEngine()
		try {
			await engine.ready()
			const [sender] = (await engine.request({ method: 'eth_accounts' })) as Address[]
			const deployed = await tevmDeploy(engine, {
				from: sender!,
				bytecode: buildDeployInitcode(LOG_EMITTER_RUNTIME),
			})
			const emitter = deployed.createdAddress!
			const filterId = (await engine.request({
				method: 'eth_newFilter',
				params: [{ address: emitter }],
			})) as Hex

			const allTopics: Hex[] = []
			const allData: Hex[] = []
			await fc.assert(
				fc.asyncProperty(bytes32Arb, hexBytesArb(0, 64), async (topic, payload) => {
					const calldata = `${topic}${payload.slice(2)}` as Hex
					const tx = await tevmCall(engine, {
						from: sender!,
						to: emitter,
						data: calldata,
						gas: 100_000n,
						addToBlockchain: true,
					})
					expect(tx.receipt).toMatchObject({ status: '0x1' })
					allTopics.push(topic.toLowerCase() as Hex)
					allData.push(payload.toLowerCase() as Hex)

					const changes = (await engine.request({
						method: 'eth_getFilterChanges',
						params: [filterId],
					})) as Array<{ address: string; topics: string[]; data: string }>
					expect(changes.length).toBe(1)
					expect(changes[0]!.address.toLowerCase()).toBe(emitter.toLowerCase())
					expect(changes[0]!.topics[0]?.toLowerCase()).toBe(topic.toLowerCase())
					expect(changes[0]!.data.toLowerCase()).toBe(payload.toLowerCase())
				}),
				fcParams('io', { numRuns: 35 }),
			)

			const fullLogs = (await engine.request({
				method: 'eth_getLogs',
				params: [{ address: emitter, fromBlock: '0x0', toBlock: 'latest' }],
			})) as Array<{ topics: string[]; data: string }>
			expect(fullLogs.length).toBe(allTopics.length)
			for (let i = 0; i < allTopics.length; i++) {
				expect(fullLogs[i]!.topics[0]?.toLowerCase()).toBe(allTopics[i])
				expect(fullLogs[i]!.data.toLowerCase()).toBe(allData[i])
			}
			expect(await engine.request({ method: 'eth_uninstallFilter', params: [filterId] })).toBe(true)
		} finally {
			await engine.close()
		}
	})

	it('fuzz: deferred automine=false queues transactions into txpool and mines them atomically on tevmMine', async () => {
		const engine = createZevmEngine({ mining: { auto: false } })
		try {
			await engine.ready()
			const [sender] = (await engine.request({ method: 'eth_accounts' })) as Address[]
			await fc.assert(
				fc.asyncProperty(
					fc.array(fc.tuple(modelAddressArb, fc.bigInt({ min: 1n, max: 10_000n })), { minLength: 1, maxLength: 6 }),
					async (transfers) => {
						const startBalances = new Map<Address, bigint>()
						for (const addr of modelAddressPool) {
							startBalances.set(addr, (await tevmGetAccount(engine, { address: addr })).balance)
						}
						const expectedDeltas = new Map<Address, bigint>()
						const hashes: Hex[] = []
						let nonce = BigInt(
							(await engine.request({
								method: 'eth_getTransactionCount',
								params: [sender!, 'pending'],
							})) as string,
						)
						for (const [to, value] of transfers) {
							const res = await tevmCall(engine, {
								from: sender!,
								to,
								value,
								gas: 21_000n,
								nonce: nonce++,
								addToMempool: true,
							})
							expect(res.txHash).toMatch(/^0x[0-9a-f]{64}$/i)
							hashes.push(res.txHash!)
							expectedDeltas.set(to, (expectedDeltas.get(to) ?? 0n) + value)
							// Must remain unmined until explicit tevmMine.
							expect(await engine.request({ method: 'eth_getTransactionReceipt', params: [res.txHash!] })).toBeNull()
						}
						await tevmMine(engine, { blocks: 1 })
						for (const hash of hashes) {
							const receipt = await engine.request({ method: 'eth_getTransactionReceipt', params: [hash] })
							expect(receipt).toMatchObject({ status: '0x1' })
						}
						for (const [addr, delta] of expectedDeltas.entries()) {
							const after = (await tevmGetAccount(engine, { address: addr })).balance
							expect(after).toBe((startBalances.get(addr) ?? 0n) + delta)
						}
					},
				),
				fcParams('io', { numRuns: 20 }),
			)
		} finally {
			await engine.close()
		}
	})
})
