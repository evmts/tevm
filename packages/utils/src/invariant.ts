import { DefensiveNullCheckError } from '@tevm/errors'

export function invariant(condition: unknown, error: Error = new DefensiveNullCheckError()): asserts condition {
	if (!condition) {
		throw error
	}
}
