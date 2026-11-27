import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { AppProps } from 'pastel'

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
		},
	},
})

export default function App({ Component, commandProps }: AppProps) {
	const C = Component as unknown as React.ComponentType<Record<string, unknown>>
	return (
		<QueryClientProvider client={queryClient}>
			<C {...(commandProps as Record<string, unknown>)} />
		</QueryClientProvider>
	)
}
