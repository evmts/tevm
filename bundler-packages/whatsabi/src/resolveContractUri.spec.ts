import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ loadAbi: vi.fn(), getCode: vi.fn() }))
vi.mock('./loadAbi.js', () => ({ loadAbi: mocks.loadAbi }))
vi.mock('viem/actions', () => ({ getCode: mocks.getCode }))

import { parseUri } from './parseUri.js'
import { resolveContractUri } from './resolveContractUri.js'

const proxy = '0x4200000000000000000000000000000000000006'
const implementation = '0x1111111111111111111111111111111111111111'

beforeEach(() => {
	mocks.loadAbi.mockReset().mockResolvedValue({ address: implementation, abi: [{ type: 'function', name: 'f' }] })
	mocks.getCode
		.mockReset()
		.mockImplementation(async (_client, { address }) => (address === proxy ? '0xproxy' : '0ximplementation'))
})

describe('resolveContractUri', () => {
	it('pairs the returned address with its own bytecode, not the implementation bytecode', async () => {
		const resolved = await resolveContractUri(`evm://10/${proxy}` as any, {} as any)
		expect(resolved?.address).toBe(proxy)
		expect(resolved?.deployedBytecode).toBe('0xproxy')
		expect(mocks.getCode).toHaveBeenCalledWith(expect.anything(), { address: proxy })
	})

	it('honors followProxies=false and defaults to following proxies', async () => {
		await resolveContractUri(`evm://10/${proxy}?followProxies=false` as any, {} as any)
		expect(mocks.loadAbi).toHaveBeenLastCalledWith(expect.objectContaining({ followProxies: false }))
		await resolveContractUri(`evm://10/${proxy}` as any, {} as any)
		expect(mocks.loadAbi).toHaveBeenLastCalledWith(expect.objectContaining({ followProxies: true }))
	})

	it('passes the URI chain ID for chains viem does not know', async () => {
		await resolveContractUri(`evm://424242/${proxy}?rpcUrl=http%3A%2F%2F127.0.0.1%3A1` as any, {} as any)
		expect(mocks.loadAbi).toHaveBeenLastCalledWith(expect.objectContaining({ chainId: 424242 }))
	})

	it('does not log its config', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {})
		await resolveContractUri(`evm://10/${proxy}` as any, { secret: true } as any)
		expect(log).not.toHaveBeenCalled()
		log.mockRestore()
	})
})

describe('parseUri followProxies', () => {
	it('parses true, false and absent values', () => {
		expect(parseUri(`evm://1/${proxy}?followProxies=true`)?.followProxies).toBe(true)
		expect(parseUri(`evm://1/${proxy}?followProxies=false`)?.followProxies).toBe(false)
		expect(parseUri(`evm://1/${proxy}`)?.followProxies).toBeUndefined()
	})
})
