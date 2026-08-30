import { createAddress } from '@tevm/address'
import { bytesToHex, hexToBytes, keccak256 } from '@tevm/utils'
import { describe, expect, it, vi } from 'vitest'
import { createBaseState } from '../createBaseState.js'
import { getAccount } from './getAccount.js'
import { getAccountFromProvider } from './getAccountFromProvider.js'
import { getContractCode } from './getContractCode.js'

const createMockForkTransport = () => ({
	request: vi.fn(async ({ method }: { method: string }) => {
		if (method === 'eth_getProof') {
			return {
				address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
				accountProof: [],
				balance: '0x1a4',
				codeHash: `0x${'00'.repeat(32)}`,
				nonce: '0x2',
				storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
				storageProof: [],
			}
		}
		throw new Error(`Unexpected RPC method: ${method}`)
	}),
})

describe(getAccountFromProvider.name, () => {
	it('should get an account from fork transport', async () => {
		const address = createAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
		const state = createBaseState({ fork: { transport: createMockForkTransport(), blockTag: 1n } })
		const account = await getAccountFromProvider(state)(address)
		expect(account).toMatchObject({
			_codeSize: expect.any(Number),
			_version: 0,
		})
		expect(typeof account?._nonce).toBe('bigint')
		expect(account?._codeHash).toHaveLength(32)
		expect(account?._storageRoot).toHaveLength(32)
	})
})

const mockProof = {
	address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
	accountProof: [],
	balance: '0x1a4',
	codeHash: `0x${'00'.repeat(32)}`,
	nonce: '0x2',
	storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
	storageProof: [],
}

const mockBlock = {
	hash: `0x${'11'.repeat(32)}`,
	parentHash: `0x${'00'.repeat(32)}`,
	sha3Uncles: `0x${'00'.repeat(32)}`,
	miner: `0x${'00'.repeat(20)}`,
	stateRoot: `0x${'00'.repeat(32)}`,
	transactionsRoot: `0x${'00'.repeat(32)}`,
	receiptsRoot: `0x${'00'.repeat(32)}`,
	logsBloom: `0x${'00'.repeat(256)}`,
	difficulty: '0x0',
	number: '0x1',
	gasLimit: '0x1',
	gasUsed: '0x0',
	timestamp: '0x1',
	extraData: '0x',
	mixHash: `0x${'00'.repeat(32)}`,
	nonce: '0x0000000000000000',
	transactions: [],
	uncles: [],
}

const MOCK_CODE = '0x6080604052'
const EMPTY_STORAGE_ROOT = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
const SCALAR_METHODS = ['eth_getBalance', 'eth_getTransactionCount', 'eth_getCode']

type RecordedCall = { method: string; params: unknown[] }

// The capability WeakMap is keyed by transport identity — each test needs a fresh transport
const createRecordingTransport = ({
	getProofError,
	balance = '0x1bc16d674ec80000',
	transactionCount = '0x5',
	code = MOCK_CODE,
}: {
	getProofError?: unknown
	balance?: string
	transactionCount?: string
	code?: string
} = {}) => {
	const calls: RecordedCall[] = []
	return {
		calls,
		request: vi.fn(async ({ method, params }: { method: string; params: unknown[] }) => {
			calls.push({ method, params })
			if (method === 'eth_getProof') {
				if (getProofError !== undefined) throw getProofError
				return mockProof
			}
			if (method === 'eth_getBalance') return balance
			if (method === 'eth_getTransactionCount') return transactionCount
			if (method === 'eth_getCode') return code
			if (method === 'eth_getBlockByNumber') return mockBlock
			throw new Error(`Unexpected RPC method: ${method}`)
		}),
	}
}

const methodCount = (calls: RecordedCall[], method: string) => calls.filter((c) => c.method === method).length

describe(`${getAccountFromProvider.name} eth_getProof scalar fallback`, () => {
	const address = createAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')

	it('uses eth_getProof alone when the provider serves it', async () => {
		const transport = createRecordingTransport()
		const state = createBaseState({ fork: { transport, blockTag: 1n } })

		const account = await getAccountFromProvider(state)(address)

		expect(account.balance).toBe(BigInt(mockProof.balance))
		expect(account.nonce).toBe(BigInt(mockProof.nonce))
		expect(bytesToHex(account.codeHash)).toBe(mockProof.codeHash)
		expect(bytesToHex(account.storageRoot)).toBe(mockProof.storageHash)
		expect(methodCount(transport.calls, 'eth_getProof')).toBe(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}
	})

	it('falls back to scalar methods on -32601 Method not found', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32601, message: 'Method not found' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		const account = await getAccountFromProvider(state)(address)

		expect(account.balance).toBe(2000000000000000000n)
		expect(account.nonce).toBe(5n)
		expect(bytesToHex(account.codeHash)).toBe(keccak256(MOCK_CODE))
		expect(bytesToHex(account.storageRoot)).toBe(EMPTY_STORAGE_ROOT)
		expect(methodCount(transport.calls, 'eth_getProof')).toBe(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(1)
		}
	})

	it('falls back to scalar methods on -32004 Method not supported', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32004, message: 'Method not supported' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		const account = await getAccountFromProvider(state)(address)

		expect(account.balance).toBe(2000000000000000000n)
		expect(account.nonce).toBe(5n)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(1)
		}
	})

	it('falls back on -32600 whose message says the method is not available (Monad shape)', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32600, message: 'eth_getProof is not available on the MONAD_MAINNET' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		const account = await getAccountFromProvider(state)(address)

		expect(account.balance).toBe(2000000000000000000n)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(1)
		}
	})

	it('falls back on -32600 whose message says the method is unavailable', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32600, message: 'Method unavailable' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		const account = await getAccountFromProvider(state)(address)

		expect(account.balance).toBe(2000000000000000000n)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(1)
		}
	})

	it('does NOT fall back on a generic -32600 invalid request', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32600, message: 'invalid request' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		await expect(getAccountFromProvider(state)(address)).rejects.toThrow()

		expect(methodCount(transport.calls, 'eth_getProof')).toBeGreaterThanOrEqual(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}
	})

	it('does NOT fall back or stick on -32005 rate limiting', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32005, message: 'rate limited' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		// viem retries rate-limit errors, so eth_getProof count is >= 1, not exactly 1
		await expect(getAccountFromProvider(state)(address)).rejects.toThrow()
		const callsAfterFirst = methodCount(transport.calls, 'eth_getProof')
		expect(callsAfterFirst).toBeGreaterThanOrEqual(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}

		await expect(getAccountFromProvider(state)(address)).rejects.toThrow()
		expect(methodCount(transport.calls, 'eth_getProof')).toBeGreaterThan(callsAfterFirst)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}
	}, 30_000)

	it('does NOT fall back or stick on plain network errors', async () => {
		const transport = createRecordingTransport({
			getProofError: new Error('ECONNRESET'),
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		await expect(getAccountFromProvider(state)(address)).rejects.toThrow()
		const callsAfterFirst = methodCount(transport.calls, 'eth_getProof')
		expect(callsAfterFirst).toBeGreaterThanOrEqual(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}

		await expect(getAccountFromProvider(state)(address)).rejects.toThrow()
		expect(methodCount(transport.calls, 'eth_getProof')).toBeGreaterThan(callsAfterFirst)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(0)
		}
	}, 30_000)

	it('downgrades the transport permanently: second address skips eth_getProof entirely', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32601, message: 'Method not found' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })
		const secondAddress = createAddress(`0x${'02'.repeat(20)}`)

		await getAccountFromProvider(state)(address)
		await getAccountFromProvider(state)(secondAddress)

		expect(methodCount(transport.calls, 'eth_getProof')).toBe(1)
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(2)
		}
	})

	it('pins every scalar request to the fork block', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32601, message: 'Method not found' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 123n } })

		await getAccountFromProvider(state)(address)

		const scalarCalls = transport.calls.filter((c) => SCALAR_METHODS.includes(c.method))
		expect(scalarCalls).toHaveLength(3)
		for (const call of scalarCalls) {
			expect(call.params).toContain('0x7b')
		}
	})

	it('primes the contract code cache so getContractCode makes no extra eth_getCode call', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32601, message: 'Method not found' },
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })

		await getAccountFromProvider(state)(address)
		expect(methodCount(transport.calls, 'eth_getCode')).toBe(1)

		const codeBytes = await getContractCode(state)(address)

		expect(codeBytes).toEqual(hexToBytes(MOCK_CODE))
		expect(methodCount(transport.calls, 'eth_getCode')).toBe(1)
	})

	it('resolves a nonexistent account to undefined through the real getAccount action', async () => {
		const transport = createRecordingTransport({
			getProofError: { code: -32601, message: 'Method not found' },
			balance: '0x0',
			transactionCount: '0x0',
			code: '0x',
		})
		const state = createBaseState({ loggingLevel: 'error', fork: { transport, blockTag: 1n } })
		const emptyAddress = createAddress(`0x${'03'.repeat(20)}`)

		const result = await getAccount(state)(emptyAddress)

		expect(result).toBeUndefined()
		for (const method of SCALAR_METHODS) {
			expect(methodCount(transport.calls, method)).toBe(1)
		}
		expect(state.caches.accounts.get(emptyAddress)?.accountRLP).toBeUndefined()
		expect(state.forkCache.accounts.get(emptyAddress)?.accountRLP).toBeUndefined()
	})
})
