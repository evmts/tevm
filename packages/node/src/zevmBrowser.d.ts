import type { ZevmBackend } from './ZevmEngine.js'
import type { ZevmWasmOptions } from './ZevmWasmOptions.js'

export declare function createWasmBackend(options?: ZevmWasmOptions): Promise<ZevmBackend>
