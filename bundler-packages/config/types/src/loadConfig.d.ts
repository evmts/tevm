/**
 * @typedef {import("./tsconfig/index.js").LoadTsConfigError | import("./tsconfig/index.js").GetTevmConfigFromTsConfigError | import("./foundry/index.js").LoadFoundryConfigError | InvalidJsonConfigError} LoadConfigErrorType
 */
/**
 * Error class for {@link loadConfig}
 */
export class LoadConfigError extends Error {
    /**
     * @param {string} configFilePath
     * @param {LoadConfigErrorType} underlyingError
     **/
    constructor(configFilePath: string, underlyingError: LoadConfigErrorType);
    /**
     * @type {LoadConfigError['_tag']}
     * @override
     */
    override name: LoadConfigError["_tag"];
    /**
     * @type {LoadConfigErrorType['_tag']}
     **/
    _tag: LoadConfigErrorType["_tag"];
}
export function loadConfig(configFilePath: string): import("effect/Effect").Effect<import("./types.js").ResolvedCompilerConfig, LoadConfigError, never>;
export type LoadConfigErrorType = import("./tsconfig/index.js").LoadTsConfigError | import("./tsconfig/index.js").GetTevmConfigFromTsConfigError | import("./foundry/index.js").LoadFoundryConfigError | InvalidJsonConfigError;
import { InvalidJsonConfigError } from './json/loadJsonConfig.js';
//# sourceMappingURL=loadConfig.d.ts.map