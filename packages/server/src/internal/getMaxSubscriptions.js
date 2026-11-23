/**
 * Resolve the per-connection subscription cap before a server accepts connections.
 * @internal
 * @param {number} [limit]
 * @returns {number}
 */
export const getMaxSubscriptions = (limit = 256) => {
	if (limit !== Infinity && (!Number.isInteger(limit) || limit < 0))
		throw new RangeError('maxSubscriptions must be a non-negative integer or Infinity')
	return limit
}
