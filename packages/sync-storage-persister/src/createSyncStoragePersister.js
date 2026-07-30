import { throttle } from './throttle.js'

/**
 * Creates a synchronous storage persister to be used in tevm clients
 * Persists tevm state to a synchronous storage backend such as `window.localStorage`
 * so state can be restored between sessions. Saving is throttled to avoid
 * spamming the storage backend.
 * @param {import('./CreateSyncStoragePersisterOptions.js').CreateSyncStoragePersisterOptions} options - The persister options including the `storage` backend
 * @returns {import('./SyncStoragePersister.js').SyncStoragePersister} A persister that can persist, restore, and remove tevm state
 * @throws {never} Errors during persisting are returned rather than thrown
 * @example
 * ```typescript
 * import { createSyncStoragePersister } from '@tevm/sync-storage-persister'
 *
 * const persister = createSyncStoragePersister({
 *   storage: window.localStorage,
 *   key: 'TEVM_CACHE',
 *   throttleTime: 1000,
 * })
 *
 * // Persist state (throttled)
 * persister.persistTevmState({
 *   '0x420': {
 *     balance: '0x69',
 *     codeHash: '0xdeadbeef',
 *     nonce: '0x0',
 *     storageRoot: '0xdeadbeef',
 *     storage: {
 *       '0x420420': '0x42069',
 *     },
 *   },
 * })
 *
 * // Restore the persisted state later
 * const restoredState = persister.restoreState()
 *
 * // Remove the persisted state
 * persister.removePersistedState()
 * ```
 */
export const createSyncStoragePersister = ({
	storage,
	key = 'REACT_QUERY_OFFLINE_CACHE',
	throttleTime = 1000,
	serialize = JSON.stringify,
	deserialize = JSON.parse,
}) => {
	/**
	 * @param {import('@tevm/state').SerializableTevmState} state
	 * @returns {Error | undefined}
	 */
	const trySave = (state) => {
		try {
			const serializedState = serialize(state)
			storage.setItem(key, serializedState)
			if (storage.getItem(key) !== serializedState) {
				throw new Error(
					'Detected a failure to save state. There appears to be a problem with the provided state persister',
				)
			}
			return undefined
		} catch (error) {
			return /** @type {Error}*/ (error)
		}
	}
	const persistTevmState = throttle((persistedState, onError) => {
		if (!persistedState) {
			return
		}
		// TODO make this configurable
		const retries = 3
		let error = trySave(persistedState)
		let errorCount = 0
		while (error && errorCount < retries) {
			errorCount++
			error = trySave(persistedState)
		}
		if (onError && error) {
			onError(error)
		}
		return error
	}, throttleTime)
	return {
		/**
		 * @param {import('@tevm/state').SerializableTevmState | undefined} persistedState
		 * @param {(error: Error | undefined) => void} [onError]
		 * @returns {Error | undefined}
		 */
		persistTevmState,
		/**
		 * @returns {import('@tevm/state').SerializableTevmState | undefined}
		 */
		restoreState: () => {
			const cacheString = storage.getItem(key)
			if (!cacheString) {
				return
			}
			return deserialize(cacheString)
		},
		/**
		 * @returns {Error | undefined}
		 */
		removePersistedState: () => {
			try {
				persistTevmState.cancel()
				storage.removeItem(key)
				return undefined
			} catch (e) {
				return /** @type {Error} */ (e)
			}
		},
	}
}
