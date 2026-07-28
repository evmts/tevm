// eventemitter3's CJS entry can't be served as ESM from the excluded tevm
// graph; our EventEmitter implements the same surface.
import { EventEmitter } from './events'
export { EventEmitter }
export default EventEmitter
