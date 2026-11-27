/**
 * Error class for {@link defineConfig}
 */
export class DefineConfigError extends Error {
    /**
     * @param {string} configFilePath
     * @param {import("./types.js").DefineConfigErrorType} underlyingError
     **/
    constructor(configFilePath: string, underlyingError: import("./types.js").DefineConfigErrorType);
    /**
     * @type {import("./types.js").DefineConfigErrorType['_tag']}
     * @override
     */
    override name: import("./types.js").DefineConfigErrorType["_tag"];
    /**
     * @type {import("./types.js").DefineConfigErrorType['_tag']}
     **/
    _tag: import("./types.js").DefineConfigErrorType["_tag"];
}
/**
 * Typesafe way to create an Tevm CompilerConfig
 * @type {import("./types.js").DefineConfig}
 * @example
 * ```ts
 * import { defineConfig } from '@tevm/ts-plugin'
 *
 * export default defineConfig(() => ({
 * 	lib: ['lib'],
 * 	remappings: {
 * 	  'foo': 'foo/bar'
 * 	}
 * })
 * ```
 */
export const defineConfig: import("./types.js").DefineConfig;
//# sourceMappingURL=defineConfig.d.ts.map