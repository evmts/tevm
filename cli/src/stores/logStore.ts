import { create } from 'zustand'

// Define log entry types
export type LogEntry = {
	id: number
	timestamp: string
	type: 'request' | 'response' | 'error'
	content: string
}

// Create a simple store for logs
export interface LogStore {
	logs: LogEntry[]
	nextId: number
	addLog: (type: 'request' | 'response' | 'error', content: unknown) => void
	clearLogs: () => void
}

export const useLogStore = create<LogStore>((set) => ({
	logs: [],
	nextId: 1,
	addLog: (type, content) =>
		set((state) => {
			// Format timestamp
			const now = new Date()
			const timestamp = now.toLocaleTimeString()

			// Format content
			let contentStr
			try {
				contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
			} catch (_err) {
				contentStr = String(content)
			}

			// Add new log entry
			return {
				logs: [
					...state.logs.slice(-100),
					{
						id: state.nextId,
						timestamp,
						type,
						content: contentStr,
					},
				],
				nextId: state.nextId + 1,
			}
		}),
	clearLogs: () => set({ logs: [] }),
}))

/**
 * Create a proxy around the request function that logs to Zustand store
 */
export function createLoggingRequestProxy<T extends (...args: never[]) => Promise<unknown>>(
	originalRequest: T,
	verbose: boolean,
): T {
	const { addLog } = useLogStore.getState()

	const proxiedRequest = async (...args: unknown[]) => {
		if (verbose) {
			addLog('request', args)
		}

		try {
			// Call original function and await result
			const result = await (originalRequest as unknown as (...params: unknown[]) => Promise<unknown>)(...args)

			if (verbose) {
				addLog('response', result)
			}

			return result
		} catch (error) {
			if (verbose) {
				addLog('error', error)
			}
			throw error
		}
	}

	return proxiedRequest as unknown as T
}
