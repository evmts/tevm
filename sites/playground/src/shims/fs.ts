// Browser stub for node:fs — tevm only touches fs for optional state
// persistence, which the playground never uses.
export const existsSync = () => false
export const readFileSync = (): never => {
	throw new Error('fs is not available in the browser playground')
}
export const writeFileSync = (): never => {
	throw new Error('fs is not available in the browser playground')
}
export default { existsSync, readFileSync, writeFileSync }
