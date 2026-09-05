import type { ZevmEngine } from '@tevm/node'
import type { Account, Chain, Client, PublicActions, TestActions, Transport, WalletActions } from 'viem'
import type { tevmViemActions } from './tevmViemActions.js'

/** Viem client whose transport delegates all execution to a native ZEVM node. */
export type MemoryClient = Client<Transport<'tevm', { tevm: ZevmEngine }>, Chain, Account | undefined> &
	PublicActions &
	WalletActions<Chain, Account | undefined> &
	TestActions &
	ReturnType<ReturnType<typeof tevmViemActions>>
