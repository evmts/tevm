import { bytesToHex, numberToHex } from '@tevm/utils'

/**
 * @param {import('@tevm/utils').Hex} address
 * @param {Array<import('@tevm/utils').Hex>} topics
 * @param {unknown} filter
 * @returns {boolean}
 * @throws {never}
 */
const matchesLogFilter = (address, topics, filter) => {
	if (typeof filter !== 'object' || filter === null) return true
	const addressFilter = 'address' in filter ? filter.address : undefined
	if (typeof addressFilter === 'string' && addressFilter.toLowerCase() !== address.toLowerCase()) return false
	if (
		Array.isArray(addressFilter) &&
		!addressFilter.some(
			(candidate) => typeof candidate === 'string' && candidate.toLowerCase() === address.toLowerCase(),
		)
	) {
		return false
	}

	const topicFilters = 'topics' in filter && Array.isArray(filter.topics) ? filter.topics : undefined
	if (!topicFilters) return true
	return topicFilters.every((topicFilter, index) => {
		if (topicFilter === null || topicFilter === undefined) return true
		const topic = topics[index]
		if (topic === undefined) return false
		if (typeof topicFilter === 'string') return topicFilter.toLowerCase() === topic.toLowerCase()
		if (Array.isArray(topicFilter)) {
			return topicFilter.some(
				(candidate) => typeof candidate === 'string' && candidate.toLowerCase() === topic.toLowerCase(),
			)
		}
		return false
	})
}

/**
 * Registers the event listener that streams a Tevm subscription to one IPC connection.
 *
 * @param {import('../Client.js').Tevm} tevm - Tevm node backing the IPC server.
 * @param {string} subscriptionId - ID returned by `eth_subscribe`.
 * @param {ReadonlyArray<unknown>} params - `eth_subscribe` parameters.
 * @param {(message: unknown) => void} send - Writes a JSON-RPC notification to the socket.
 * @returns {() => void} Removes the transport event listener.
 * @throws {never}
 */
export const createIpcSubscription = (tevm, subscriptionId, params, send) => {
	const subscriptionType = params[0]
	/** @param {unknown} result */
	const notify = (result) => {
		send({
			jsonrpc: '2.0',
			method: 'eth_subscription',
			params: {
				result,
				subscription: subscriptionId,
			},
		})
	}

	switch (subscriptionType) {
		case 'newHeads': {
			/**
			 * @param {import('@tevm/block').Block} block
			 * @returns {Promise<void>}
			 */
			const listener = async (block) => {
				try {
					const result = await tevm.request({
						method: 'eth_getBlockByHash',
						params: [bytesToHex(block.hash()), false],
					})
					notify(result)
				} catch (error) {
					tevm.logger.error(error)
				}
			}
			tevm.on('newBlock', listener)
			return () => tevm.removeListener('newBlock', listener)
		}
		case 'newPendingTransactions': {
			/** @param {import('@evmts/zevm/tx').TypedTransaction | import('@evmts/zevm/tx').ImpersonatedTx} transaction */
			const listener = (transaction) => notify(bytesToHex(transaction.hash()))
			tevm.on('newPendingTransaction', listener)
			return () => tevm.removeListener('newPendingTransaction', listener)
		}
		case 'logs': {
			/**
			 * @param {import('@tevm/utils').EthjsLog} rawLog
			 * @param {{ blockHash?: import('@tevm/utils').Hex; blockNumber?: bigint; transactionHash?: import('@tevm/utils').Hex; transactionIndex?: bigint; logIndex?: bigint }} [metadata]
			 */
			const listener = (rawLog, metadata = {}) => {
				const [addressBytes, topicBytes, dataBytes] = rawLog
				const address = bytesToHex(addressBytes)
				const topics = topicBytes.map((topic) => bytesToHex(topic))
				if (!matchesLogFilter(address, topics, params[1])) return
				notify({
					address,
					blockHash: metadata.blockHash ?? '0x',
					blockNumber: numberToHex(metadata.blockNumber ?? 0n),
					data: bytesToHex(dataBytes),
					logIndex: numberToHex(metadata.logIndex ?? 0n),
					removed: false,
					topics,
					transactionHash: metadata.transactionHash ?? '0x',
					transactionIndex: numberToHex(metadata.transactionIndex ?? 0n),
				})
			}
			tevm.on('newLog', listener)
			return () => tevm.removeListener('newLog', listener)
		}
		default:
			return () => {}
	}
}
