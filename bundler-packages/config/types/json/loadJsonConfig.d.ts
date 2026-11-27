export class FailedToReadConfigError extends Error {
    /**
     * @param {string} configFilePath
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(configFilePath: string, options?: {
        cause?: unknown;
    });
    /**
     * @type {'FailedToReadConfigError'}
     */
    _tag: "FailedToReadConfigError";
}
/**
 * TypeError thrown when the user provided config factory is incorrectly typed
 * @internal
 */
export class InvalidJsonConfigError extends TypeError {
    /**
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(options?: {
        cause?: unknown;
    });
    /**
     * @type {'InvalidJsonConfigError'}
     * @override
     */
    override name: "InvalidJsonConfigError";
    /**
     * @type {'InvalidJsonConfigError'}
     */
    _tag: "InvalidJsonConfigError";
}
export function loadJsonConfig(configFilePath: string): import("effect/Effect").Effect<import("../types.js").CompilerConfig, LoadJsonConfigError, never>;
export type LoadJsonConfigError = import("@tevm/effect").ParseJsonError | FailedToReadConfigError | InvalidJsonConfigError | InvalidConfigError;
import { InvalidConfigError } from '../config/validateUserConfig.js';
//# sourceMappingURL=loadJsonConfig.d.ts.map