/**
 * A persister that does nothing, useful as a default
 * Every method is a no-op that returns `undefined` so it can be dropped in
 * anywhere a {@link import('./SyncStoragePersister.js').SyncStoragePersister} is expected
 * without persisting any state.
 * @type {import('./SyncStoragePersister.js').SyncStoragePersister}
 * @example
 * ```typescript
 * import { noopPersister } from '@tevm/sync-storage-persister'
 *
 * // Safe to call every method; nothing is persisted
 * noopPersister.persistTevmState({})
 * const state = noopPersister.restoreState() // undefined
 * noopPersister.removePersistedState()
 * ```
 */
export const noopPersister = {
	persistTevmState: () => undefined,
	restoreState: () => undefined,
	removePersistedState: () => undefined,
}
