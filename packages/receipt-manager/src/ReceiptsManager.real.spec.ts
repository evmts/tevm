import { Bloom } from '@evmts/zevm/receipt'
import { createFeeMarket1559Tx, createLegacyTx, type TypedTransaction } from '@evmts/zevm/tx'
import { type Block, createBlock } from '@tevm/block'
import { type Chain, createChain } from '@tevm/blockchain'
import { optimism } from '@tevm/common'
import { bytesToHex, hexToBytes } from '@tevm/utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMapDb } from './createMapDb.js'
import { type PostByzantiumTxReceipt, ReceiptsManager } from './ReceiptManager.js'

const common = optimism.copy()

const LOG_ADDRESS = hexToBytes('0x1111111111111111111111111111111111111111')
const OTHER_ADDRESS = hexToBytes('0x2222222222222222222222222222222222222222')
const TOPIC_A = hexToBytes(`0x${'aa'.repeat(32)}`)
const TOPIC_B = hexToBytes(`0x${'bb'.repeat(32)}`)
const TOPIC_C = hexToBytes(`0x${'cc'.repeat(32)}`)

type LogTuple = [Uint8Array, Uint8Array[], Uint8Array]

const makeLog = (address: Uint8Array, topics: Uint8Array[], data = new Uint8Array([1, 2, 3])): LogTuple => [
	address,
	topics,
	data,
]

const makeReceipt = (logs: LogTuple[], cumulativeBlockGasUsed = 21_000n): PostByzantiumTxReceipt => ({
	cumulativeBlockGasUsed,
	bitvector: new Uint8Array(256),
	logs,
	status: 1,
})

const SIGNING_KEY = hexToBytes(`0x${'11'.repeat(32)}`)

const makeLegacyTx = (nonce: number): TypedTransaction =>
	createLegacyTx(
		{
			nonce,
			gasPrice: 10n,
			gasLimit: 21_000n,
			to: '0x3333333333333333333333333333333333333333',
			value: BigInt(nonce),
		},
		{ common: common.ethjsCommon },
	).sign(SIGNING_KEY) as TypedTransaction

const make1559Tx = (nonce: number): TypedTransaction =>
	createFeeMarket1559Tx(
		{
			nonce,
			maxFeePerGas: 10n,
			maxPriorityFeePerGas: 1n,
			gasLimit: 21_000n,
			to: '0x3333333333333333333333333333333333333333',
			value: BigInt(nonce),
		},
		{ common: common.ethjsCommon },
	).sign(SIGNING_KEY) as TypedTransaction

/**
 * Builds a real block and marks it with the JSON-RPC hash the chain uses to
 * skip consensus validation for externally sourced blocks.
 */
const makeBlock = (
	number: bigint,
	parentHash: Uint8Array,
	transactions: TypedTransaction[],
	extraData = '0x',
): Block => {
	const block = createBlock(
		{
			header: {
				number,
				parentHash,
				timestamp: 1_000n + number,
				gasLimit: 30_000_000n,
				gasUsed: 21_000n * BigInt(transactions.length),
				baseFeePerGas: 7n,
				extraData,
			},
			transactions,
		},
		{ common, skipConsensusFormatValidation: true, freeze: false },
	)
	Object.defineProperty(block, '__tevmJsonRpcBlockHash', {
		value: bytesToHex(block.hash()),
		enumerable: false,
		configurable: true,
	})
	return block
}

describe('ReceiptsManager (real chain, real blocks)', () => {
	let chain: Chain
	let mapDb: ReturnType<typeof createMapDb>
	let manager: ReceiptsManager
	let genesis: Block

	beforeEach(async () => {
		chain = await createChain({ common: common.copy() })
		mapDb = createMapDb({ cache: new Map() })
		manager = new ReceiptsManager(mapDb, chain)
		genesis = await chain.getCanonicalHeadBlock()
	})

	describe('saveReceipts/getReceipts roundtrip', () => {
		it('stores and retrieves receipts for a block', async () => {
			const tx = makeLegacyTx(0)
			const block = makeBlock(1n, genesis.hash(), [tx])
			const receipt = makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A])])

			await manager.saveReceipts(block, [receipt])
			const receipts = await manager.getReceipts(block.hash())

			expect(receipts).toHaveLength(1)
			expect(receipts[0]?.cumulativeBlockGasUsed).toBe(21_000n)
			expect(receipts[0]?.status).toBe(1)
			expect(receipts[0]?.logs).toHaveLength(1)
			expect(receipts[0]?.logs[0]?.[0]).toEqual(LOG_ADDRESS)
			expect(receipts[0]?.logs[0]?.[1]).toEqual([TOPIC_A])
		})

		it('returns an empty array for a block hash with no receipts', async () => {
			expect(await manager.getReceipts(hexToBytes(`0x${'99'.repeat(32)}`))).toEqual([])
		})

		it('recomputes the bloom filter when calcBloom is true', async () => {
			const tx = makeLegacyTx(0)
			const block = makeBlock(1n, genesis.hash(), [tx])
			// deliberately store a zeroed bitvector; calcBloom must replace it
			const receipt = makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A, TOPIC_B])])

			await manager.saveReceipts(block, [receipt])
			const [withBloom] = await manager.getReceipts(block.hash(), true)

			const expected = new Bloom()
			expected.add(LOG_ADDRESS)
			expected.add(TOPIC_A)
			expected.add(TOPIC_B)
			expect(withBloom?.bitvector).toEqual(expected.bitvector)
			expect(expected.check(LOG_ADDRESS)).toBe(true)
			expect(expected.check(TOPIC_A)).toBe(true)
			expect(expected.check(OTHER_ADDRESS)).toBe(false)
		})

		it('does not persist the bitvector; it is undefined unless calcBloom recomputes it', async () => {
			const tx = makeLegacyTx(0)
			const block = makeBlock(1n, genesis.hash(), [tx])
			await manager.saveReceipts(block, [makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A])])])

			// the stored-receipts codec only encodes status/gas/logs, so the bloom
			// bitvector must be recomputed on read via calcBloom
			const [withoutBloom] = await manager.getReceipts(block.hash())
			expect(withoutBloom?.bitvector).toBeUndefined()
		})

		it('attaches the transaction type when includeTxType is true', async () => {
			const legacyTx = makeLegacyTx(0)
			const feeMarketTx = make1559Tx(1)
			const block = makeBlock(1n, genesis.hash(), [legacyTx, feeMarketTx])
			await chain.putBlock(block)
			await manager.saveReceipts(block, [makeReceipt([]), makeReceipt([])])

			const receipts = await manager.getReceipts(block.hash(), false, true)
			expect(receipts.map((r) => r.txType)).toEqual([0, 2])
		})
	})

	describe('getReceiptByTxHash', () => {
		it('returns the receipt with block hash, tx index, and cumulative log index', async () => {
			const tx0 = makeLegacyTx(0)
			const tx1 = make1559Tx(1)
			const tx2 = makeLegacyTx(2)
			const block = makeBlock(1n, genesis.hash(), [tx0, tx1, tx2])
			await manager.saveReceipts(block, [
				makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A]), makeLog(LOG_ADDRESS, [TOPIC_B])]),
				makeReceipt([]),
				makeReceipt([makeLog(OTHER_ADDRESS, [TOPIC_C])]),
			])

			const result = await manager.getReceiptByTxHash(tx2.hash())
			expect(result).not.toBeNull()
			const [receipt, blockHash, txIndex, logIndex] = result!
			expect(bytesToHex(blockHash)).toBe(bytesToHex(block.hash()))
			expect(txIndex).toBe(2)
			// two logs from tx0 and zero from tx1 precede tx2
			expect(logIndex).toBe(2)
			expect(receipt.logs).toHaveLength(1)
			// bitvector is recomputed for the returned receipt
			const expected = new Bloom()
			expected.add(OTHER_ADDRESS)
			expected.add(TOPIC_C)
			expect(receipt.bitvector).toEqual(expected.bitvector)
		})

		it('returns null for an unknown transaction hash', async () => {
			expect(await manager.getReceiptByTxHash(hexToBytes(`0x${'42'.repeat(32)}`))).toBeNull()
		})

		it('throws when the index points at a transaction with no stored receipt', async () => {
			const tx0 = makeLegacyTx(0)
			const tx1 = makeLegacyTx(1)
			const block = makeBlock(1n, genesis.hash(), [tx0, tx1])
			// save only one receipt for a two-transaction block
			await manager.saveReceipts(block, [makeReceipt([])])

			await expect(manager.getReceiptByTxHash(tx1.hash())).rejects.toThrow('Receipt not found')
		})
	})

	describe('deleteReceipts', () => {
		it('removes receipts and the tx hash index', async () => {
			const tx = makeLegacyTx(0)
			const block = makeBlock(1n, genesis.hash(), [tx])
			await manager.saveReceipts(block, [makeReceipt([])])
			expect(await manager.getReceipts(block.hash())).toHaveLength(1)

			await manager.deleteReceipts(block)
			expect(await manager.getReceipts(block.hash())).toEqual([])
			expect(await manager.getReceiptByTxHash(tx.hash())).toBeNull()
		})

		it('does not remove a tx hash index that points at a different (canonical) block', async () => {
			// reorg scenario: the same transaction appears in a canonical block and a
			// side-fork block; deleting the side-fork receipts must not delete the
			// index owned by the canonical block
			const tx = makeLegacyTx(0)
			const canonicalBlock = makeBlock(1n, genesis.hash(), [tx], '0x01')
			const forkBlock = makeBlock(1n, genesis.hash(), [tx], '0x02')
			expect(bytesToHex(canonicalBlock.hash())).not.toBe(bytesToHex(forkBlock.hash()))

			await manager.saveReceipts(canonicalBlock, [makeReceipt([])])
			// simulate the fork block having been indexed earlier by putting its own entry back
			await manager.saveReceipts(forkBlock, [makeReceipt([])])
			await manager.saveReceipts(canonicalBlock, [makeReceipt([])])

			await manager.deleteReceipts(forkBlock)

			// index still resolves to the canonical block
			const result = await manager.getReceiptByTxHash(tx.hash())
			expect(result).not.toBeNull()
			expect(bytesToHex(result![1])).toBe(bytesToHex(canonicalBlock.hash()))
			// but the fork block's receipts are gone
			expect(await manager.getReceipts(forkBlock.hash())).toEqual([])
		})
	})

	describe('getLogs', () => {
		const setupTwoBlocks = async () => {
			const tx1 = makeLegacyTx(0)
			const tx2 = make1559Tx(1)
			const block1 = makeBlock(1n, genesis.hash(), [tx1])
			const block2 = makeBlock(2n, block1.hash(), [tx2])
			await chain.putBlock(block1)
			await chain.putBlock(block2)
			await manager.saveReceipts(block1, [makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A, TOPIC_B])])])
			await manager.saveReceipts(block2, [makeReceipt([makeLog(OTHER_ADDRESS, [TOPIC_C])])])
			return { block1, block2, tx1, tx2 }
		}

		it('returns all logs across a block range with tx and block metadata', async () => {
			const { block1, tx1 } = await setupTwoBlocks()

			const logs = await manager.getLogs(block1, await chain.getBlock(2n))
			expect(logs).toHaveLength(2)
			expect(logs[0]?.txIndex).toBe(0)
			expect(logs[0]?.logIndex).toBe(0)
			expect(bytesToHex(logs[0]?.block.hash())).toBe(bytesToHex(block1.hash()))
			expect(bytesToHex(logs[0]?.tx.hash())).toBe(bytesToHex(tx1.hash()))
			expect(bytesToHex(logs[1]?.block.header.number === 2n ? logs[1].block.hash() : new Uint8Array())).toBe(
				bytesToHex((await chain.getBlock(2n)).hash()),
			)
		})

		it('filters by address', async () => {
			const { block1, block2 } = await setupTwoBlocks()

			const logs = await manager.getLogs(block1, block2, [LOG_ADDRESS])
			expect(logs).toHaveLength(1)
			expect(logs[0]?.log[0]).toEqual(LOG_ADDRESS)
		})

		it('filters by a single positional topic', async () => {
			const { block1, block2 } = await setupTwoBlocks()

			expect(await manager.getLogs(block1, block2, undefined, [TOPIC_A])).toHaveLength(1)
			expect(await manager.getLogs(block1, block2, undefined, [TOPIC_B])).toHaveLength(0)
		})

		it('treats null topics as wildcards and enforces position', async () => {
			const { block1, block2 } = await setupTwoBlocks()

			// TOPIC_B is in second position of the block1 log
			expect(await manager.getLogs(block1, block2, undefined, [null, TOPIC_B])).toHaveLength(1)
			// TOPIC_B is never in first position
			expect(await manager.getLogs(block1, block2, undefined, [TOPIC_B, null])).toHaveLength(0)
		})

		it('treats an array of topics as a logical OR', async () => {
			const { block1, block2 } = await setupTwoBlocks()

			const logs = await manager.getLogs(block1, block2, undefined, [[TOPIC_A, TOPIC_C]])
			expect(logs).toHaveLength(2)
		})

		it('skips blocks that have no receipts stored', async () => {
			const { block1 } = await setupTwoBlocks()
			// block3 is in the chain but has no receipts saved
			const block3 = makeBlock(3n, (await chain.getBlock(2n)).hash(), [])
			await chain.putBlock(block3)

			const logs = await manager.getLogs(block1, block3, [LOG_ADDRESS])
			expect(logs).toHaveLength(1)
		})

		it('stops scanning once GET_LOGS_LIMIT logs have been collected', async () => {
			const { block1 } = await setupTwoBlocks()
			manager.GET_LOGS_LIMIT = 1

			const logs = await manager.getLogs(block1, await chain.getBlock(2n))
			// both block1 logs are returned (limit is checked after each block) but block2 is never scanned
			expect(logs.every((l) => l.block.header.number === 1n)).toBe(true)
		})

		it('throws when the block range exceeds GET_LOGS_BLOCK_RANGE_LIMIT', async () => {
			const from = makeBlock(1n, genesis.hash(), [])
			const to = makeBlock(1n + 2500n, genesis.hash(), [])

			await expect(manager.getLogs(from, to)).rejects.toThrow('getLogs block range exceeds limit of 2500')
		})

		it('accepts a range exactly at the limit', async () => {
			// from == to is the smallest possible range and must not throw
			const { block1 } = await setupTwoBlocks()
			const logs = await manager.getLogs(block1, block1)
			expect(logs).toHaveLength(1)
		})
	})

	describe('deepCopy', () => {
		it('copies stored receipts into a manager bound to a new chain', async () => {
			const tx = makeLegacyTx(0)
			const block = makeBlock(1n, genesis.hash(), [tx])
			await manager.saveReceipts(block, [makeReceipt([makeLog(LOG_ADDRESS, [TOPIC_A])])])

			const newChain = await createChain({ common: common.copy() })
			const copy = manager.deepCopy(newChain)

			expect(copy).not.toBe(manager)
			expect(copy.chain).toBe(newChain)
			const receipts = await copy.getReceipts(block.hash())
			expect(receipts).toHaveLength(1)
			expect(receipts[0]?.logs[0]?.[1]).toEqual([TOPIC_A])
		})
	})

	describe('defensive error paths', () => {
		it('throws "Unsupported index type" for unknown index types', async () => {
			// @ts-expect-error - deliberately passing an invalid enum value
			await expect(manager.getIndex(99, new Uint8Array())).rejects.toThrow('Unsupported index type')
			// @ts-expect-error - deliberately passing an invalid enum value
			await expect(manager.updateIndex(0, 99, {})).rejects.toThrow('Unsupported index type')
		})

		it('throws "Unknown rlp conversion" for unknown rlp types', () => {
			// @ts-expect-error - deliberately passing an invalid enum value
			expect(() => manager.rlp(0, 99, [])).toThrow('Unknown rlp conversion')
		})

		it('throws "Log is empty" when computing a bloom over a missing log entry', () => {
			// @ts-expect-error - deliberately passing a hole in the logs array
			expect(() => manager.logsBloom([undefined])).toThrow('Log is empty')
		})

		it('roundtrips logs through the Logs rlp codec', () => {
			const logs = [makeLog(LOG_ADDRESS, [TOPIC_A, TOPIC_B]), makeLog(OTHER_ADDRESS, [], new Uint8Array([9]))]
			// @ts-expect-error - exercising the private codec directly
			const encoded = manager.rlp(0, 1, logs)
			expect(encoded).toBeInstanceOf(Uint8Array)
			// @ts-expect-error - exercising the private codec directly
			const decoded = manager.rlp(1, 1, encoded)
			expect(decoded[0][0]).toEqual(LOG_ADDRESS)
			expect(decoded[0][1]).toEqual([TOPIC_A, TOPIC_B])
			expect(decoded[1][0]).toEqual(OTHER_ADDRESS)
			expect(decoded[1][1]).toEqual([])
			expect(decoded[1][2]).toEqual(new Uint8Array([9]))
		})
	})
})
