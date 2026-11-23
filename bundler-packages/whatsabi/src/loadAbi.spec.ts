import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ autoload: vi.fn(async () => ({})), sourcify: vi.fn() }))
vi.mock('@shazow/whatsabi', () => {
	class Loader {
		constructor(public options?: unknown) {}
	}
	return {
		whatsabi: { autoload: mocks.autoload },
		loaders: {
			MultiSignatureLookup: Loader,
			OpenChainSignatureLookup: Loader,
			FourByteSignatureLookup: Loader,
			MultiABILoader: Loader,
			EtherscanV1ABILoader: Loader,
			SourcifyABILoader: class extends Loader {
				constructor(options: unknown) {
					super(options)
					mocks.sourcify(options)
				}
			},
		},
	}
})

import { loadAbi } from './loadAbi.js'

describe('loadAbi', () => {
	it('queries Sourcify with the given chain ID even when the client has no chain', async () => {
		await loadAbi({
			address: '0x4200000000000000000000000000000000000006',
			client: {} as any,
			chainId: 424242,
			explorerUrl: undefined,
			followProxies: false,
			etherscanApiKey: undefined,
		})
		expect(mocks.sourcify).toHaveBeenCalledWith({ chainId: 424242 })
		expect(mocks.autoload).toHaveBeenCalledWith(
			'0x4200000000000000000000000000000000000006',
			expect.objectContaining({ followProxies: false }),
		)
	})
})
