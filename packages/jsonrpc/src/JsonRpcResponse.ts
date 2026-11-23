export type JsonRpcResponse<TMethod extends string, TResult, TErrorCode extends string | number> =
	| {
			jsonrpc: '2.0'
			method: TMethod
			result: TResult
			id?: string | number | null
			error?: never
	  }
	| {
			jsonrpc: '2.0'
			method: TMethod
			error: {
				code: TErrorCode
				message: string
				/** Additional JSON data supplied by the RPC provider. */
				data?: unknown
			}
			id?: string | number | null
			result?: never
	  }
