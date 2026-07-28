// Browser stub for readable-stream. Only @ethereumjs/trie's createReadStream
// util imports it, and none of the playground examples walk a trie as a
// stream. Constructing one loudly fails rather than silently misbehaving.
export class Readable {
	constructor() {
		throw new Error('Node streams are not available in the browser playground')
	}
	static from(): never {
		throw new Error('Node streams are not available in the browser playground')
	}
}
export class Writable extends Readable {}
export class Duplex extends Readable {}
export class Transform extends Readable {}
export default { Readable, Writable, Duplex, Transform }
