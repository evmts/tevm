/** A remote viem client with TEVM native-RPC helpers. */
export type HttpClient = ReturnType<typeof import('./createHttpClient.js').createHttpClient>
