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
	/** @type {Array<string>} */
	const frames = []
	let cursor = 0
	let depth = 0
	let escaped = false
	let frameStart = -1
	let inString = false

	for (let index = 0; index < input.length; index++) {
		const character = input[index]

		if (frameStart === -1) {
			if (character === undefined || /\s/.test(character)) {
				cursor = index + 1
				continue
			}
			if (character !== '{' && character !== '[') {
				const newlineIndex = input.indexOf('\n', index)
				if (newlineIndex === -1) {
					return [frames, input.slice(index)]
				}
				frames.push(input.slice(index, newlineIndex).trim())
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
			} else if (character === '\\') {
				escaped = true
			} else if (character === '"') {
				inString = false
			}
			continue
		}

		if (character === '"') {
			inString = true
			continue
		}
		if (character === '{' || character === '[') {
			depth++
			continue
		}
		if (character === '}' || character === ']') {
			depth--
			if (depth === 0) {
				frames.push(input.slice(frameStart, index + 1))
				cursor = index + 1
				frameStart = -1
			}
		}
	}

	return [frames, input.slice(frameStart === -1 ? cursor : frameStart)]
}
