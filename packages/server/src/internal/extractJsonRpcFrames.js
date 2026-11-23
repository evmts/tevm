/**
 * Creates an incremental JSON-RPC frame extractor for streaming IPC connections.
 * Resumes scanning from the end of the previous chunk so large multi-chunk frames
 * are parsed in O(N) time instead of rescanning from byte 0 on every `data` event.
 *
 * @returns {{ push: (chunk: string) => Array<string>, remaining: () => string }}
 */
export const createJsonRpcFrameExtractor = () => {
	let buffer = ''
	let cursor = 0
	let scanIndex = 0
	let depth = 0
	let escaped = false
	let frameStart = -1
	let lineStart = -1
	let inString = false

	return {
		/** @param {string} chunk */
		push(chunk) {
			if (chunk.length > 0) buffer += chunk
			/** @type {Array<string>} */
			const frames = []
			const len = buffer.length
			let start = scanIndex

			if (lineStart !== -1) {
				const newlineIndex = buffer.indexOf('\n', start)
				if (newlineIndex === -1) {
					scanIndex = len
					return frames
				}
				frames.push(buffer.slice(lineStart, newlineIndex).trim())
				lineStart = -1
				cursor = newlineIndex + 1
				start = newlineIndex + 1
			}

			for (let index = start; index < len; index++) {
				const code = buffer.charCodeAt(index)

				if (frameStart === -1) {
					if (code === 32 || code === 9 || code === 10 || code === 13) {
						cursor = index + 1
						continue
					}
					if (code !== 123 /* '{' */ && code !== 91 /* '[' */) {
						const newlineIndex = buffer.indexOf('\n', index)
						if (newlineIndex === -1) {
							buffer = buffer.slice(index)
							cursor = 0
							lineStart = 0
							scanIndex = buffer.length
							return frames
						}
						frames.push(buffer.slice(index, newlineIndex).trim())
						index = newlineIndex
						cursor = newlineIndex + 1
						continue
					}
					frameStart = index
					depth = 1
					continue
				}

				if (inString) {
					if (escaped) {
						escaped = false
					} else if (code === 92 /* '\\' */) {
						escaped = true
					} else if (code === 34 /* '"' */) {
						inString = false
					}
					continue
				}

				if (code === 34 /* '"' */) {
					inString = true
					continue
				}
				if (code === 123 /* '{' */ || code === 91 /* '[' */) {
					depth++
					continue
				}
				if (code === 125 /* '}' */ || code === 93 /* ']' */) {
					depth--
					if (depth === 0) {
						frames.push(buffer.slice(frameStart, index + 1))
						cursor = index + 1
						frameStart = -1
					}
				}
			}

			const keepFrom = frameStart === -1 ? cursor : frameStart
			if (keepFrom > 0) {
				buffer = buffer.slice(keepFrom)
				if (frameStart !== -1) frameStart = 0
				cursor = 0
			}
			scanIndex = buffer.length
			return frames
		},
		remaining: () => buffer,
	}
}

/**
 * Extracts complete JSON object or array frames from an IPC byte stream.
 * JSON-RPC over IPC commonly uses newlines, concatenated JSON values, or both,
 * so framing is based on balanced JSON containers while ignoring braces inside strings.
 *
 * @param {string} input - Buffered UTF-8 input from an IPC connection.
 * @returns {[frames: Array<string>, remaining: string]} Complete JSON frames and the incomplete remainder.
 * @throws {never}
 */
export const extractJsonRpcFrames = (input) => {
	const extractor = createJsonRpcFrameExtractor()
	const frames = extractor.push(input)
	return [frames, extractor.remaining()]
}
