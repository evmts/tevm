import { Rlp } from '@evmts/zevm/rlp'
import type { TypedTransaction } from '@evmts/zevm/tx'
import { Capability, createImpersonatedTx, TransactionFactory } from '@evmts/zevm/tx'
import { createMockKzg } from '@tevm/common'
import { InternalError, MisconfiguredClientError } from '@tevm/errors'
import {
	concatBytes,
	createAddressFromString,
	type Hex,
	hexToBytes,
	keccak256,
	setLengthLeft,
	TypeOutput,
	toBytes,
	toType,
} from '@tevm/utils'
import { ClRequest } from './ClRequest.js'
import { blockHeaderFromRpc } from './header-from-rpc.js'
import type { BlockData, BlockOptions, JsonRpcBlock } from './index.js'
import { Block } from './index.js'

function normalizeTxParams(_txParams: any) {
	const txParams = Object.assign({}, _txParams)

	txParams.gasLimit = toType(txParams.gasLimit ?? txParams.gas, TypeOutput.BigInt)
	txParams.data = txParams.data === undefined ? txParams.input : txParams.data

	// check and convert gasPrice and value params
	txParams.gasPrice = txParams.gasPrice !== undefined ? BigInt(txParams.gasPrice) : undefined
	txParams.value = txParams.value !== undefined ? BigInt(txParams.value) : undefined

	// strict byte length checking
	txParams.to = txParams.to !== null && txParams.to !== undefined ? setLengthLeft(toBytes(txParams.to), 20) : null

	txParams.v = toType(txParams.v, TypeOutput.BigInt)

	return txParams
}

const createOptimismDepositTransaction = (txParams: any, common: BlockOptions['common']): TypedTransaction => {
	const sourceHash = hexToBytes(txParams.sourceHash)
	const from = createAddressFromString(txParams.from)
	const mint = txParams.mint === null || txParams.mint === undefined ? undefined : BigInt(txParams.mint)
	const isSystemTransaction = Boolean(txParams.isSystemTx ?? txParams.isSystemTransaction)
	const raw = [
		sourceHash,
		from.bytes,
		txParams.to === null ? new Uint8Array() : txParams.to,
		mint,
		txParams.value ?? 0n,
		txParams.gasLimit,
		isSystemTransaction ? 1n : 0n,
		txParams.data ?? new Uint8Array(),
	]
	const serialized = concatBytes(new Uint8Array([0x7e]), Rlp.encode(raw))
	const executionTx = createImpersonatedTx(
		{
			chainId: BigInt(common.id),
			nonce: txParams.nonce ?? 0n,
			maxPriorityFeePerGas: 0n,
			maxFeePerGas: 0n,
			gasLimit: txParams.gasLimit,
			to: txParams.to,
			value: txParams.value ?? 0n,
			data: txParams.data ?? new Uint8Array(),
			accessList: [],
			v: 0n,
			r: 0n,
			s: 0n,
			impersonatedAddress: from,
		},
		{ common: common.ethjsCommon, freeze: false },
	)

	return new Proxy(executionTx, {
		get(target, property, receiver) {
			switch (property) {
				case 'type':
					return 0x7e
				case 'gasPrice':
					return 0n
				case 'sourceHash':
					return sourceHash
				case 'mint':
					return mint
				case 'isSystemTransaction':
					return isSystemTransaction
				case 'raw':
					return () => raw
				case 'serialize':
					return () => serialized
				case 'hash':
					return () => keccak256(serialized, 'bytes')
				case 'supports':
					return (capability: number) => capability === Capability.EIP2718TypedTransaction
				case 'getValidationErrors':
					return () => []
				case 'isValid':
				case 'isSigned':
				case 'verifySignature':
					return () => true
				case 'getUpfrontCost':
					return () => 0n
				case 'toJSON':
					return () => ({
						...target.toJSON(),
						type: '0x7e',
						gasPrice: '0x0',
						sourceHash: txParams.sourceHash,
						mint: txParams.mint,
						isSystemTransaction,
					})
				default:
					return Reflect.get(target, property, receiver)
			}
		},
	}) as TypedTransaction
}

/**
 * Creates a new block object from Ethereum JSON RPC.
 *
 * @param blockParams - Ethereum JSON RPC of block (eth_getBlockByNumber)
 * @param uncles - Optional list of Ethereum JSON RPC of uncles (eth_getUncleByBlockHashAndIndex)
 * @param options - An object describing the blockchain
 * @deprecated
 */
export function blockFromRpc(blockParams: JsonRpcBlock, options: BlockOptions, uncles: any[] = []) {
	let reconstructionOptions = options
	const requiresKzg = blockParams.transactions?.some(
		(transaction) => typeof transaction === 'object' && transaction !== null && Number(transaction.type) === 3,
	)
	if (requiresKzg && options.common.ethjsCommon.customCrypto.kzg === undefined) {
		const common = options.common.copy()
		// RPC block reconstruction has versioned hashes but no blobs or proofs, so no
		// KZG operation is performed. Deliberately bundle Tevm's tiny KZG shim here
		// instead of eagerly or lazily loading the ~500 kB kzg-wasm browser payload.
		common.ethjsCommon.customCrypto.kzg = createMockKzg()
		reconstructionOptions = { ...options, common }
	}
	const header = blockHeaderFromRpc(blockParams, reconstructionOptions)
	if (requiresKzg && header.common.ethjsCommon.customCrypto.kzg === undefined) {
		header.common.ethjsCommon.customCrypto.kzg = createMockKzg()
	}

	const transactions: TypedTransaction[] = []
	const opts = { common: header.common.ethjsCommon }
	for (const _txParams of blockParams.transactions ?? []) {
		const txParams = normalizeTxParams(_txParams)
		try {
			const tx =
				Number(txParams.type) === 0x7e
					? createOptimismDepositTransaction(txParams, reconstructionOptions.common)
					: TransactionFactory(txParams, opts)
			transactions.push(tx)
		} catch (e) {
			if (e instanceof Error && e.message.includes('The chain ID does not match the chain ID of Common.')) {
				throw new MisconfiguredClientError(
					'Detected that forked blocks do not have same chain id as the tevm client. To fix this explicitly pass in a `common` property with correct chain id',
				)
			}
			if (e instanceof Error) {
				throw new InternalError(e.message, { cause: e })
			}
			throw new InternalError('Unexpected error', { cause: e })
		}
	}

	const uncleHeaders = uncles.map((uh) => blockHeaderFromRpc(uh, options))

	const requests = blockParams.requests?.map((req) => {
		const bytes = hexToBytes(req as Hex)
		return new ClRequest(bytes[0] as number, bytes.slice(1))
	})
	return Block.fromBlockData(
		{
			header,
			transactions,
			uncleHeaders,
			withdrawals: blockParams.withdrawals,
			requests,
		} as BlockData,
		reconstructionOptions,
	)
}
