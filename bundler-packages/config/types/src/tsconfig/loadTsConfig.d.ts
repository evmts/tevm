/**
 * Expected shape of tsconfig.json or jsconfig.json
 * @typedef {{ compilerOptions?: { plugins?: ReadonlyArray<{ name: string }> | undefined, baseUrl?: string | undefined, paths?: Record<string, ReadonlyArray<string>> | undefined } | undefined }} TsConfig
 * @internal
 */
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
export class InvalidTsConfigError extends TypeError {
    /**
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(options?: {
        cause?: unknown;
    });
    /**
     * @type {'InvalidConfigError'}
     */
    _tag: "InvalidConfigError";
}
export function loadTsConfig(configFilePath: string): import("effect/Effect").Effect<TsConfig, LoadTsConfigError, never>;
/**
 * Expected shape of tsconfig.json or jsconfig.json
 */
export type TsConfig = {
    compilerOptions?: {
        plugins?: ReadonlyArray<{
            name: string;
        }> | undefined;
        baseUrl?: string | undefined;
        paths?: Record<string, ReadonlyArray<string>> | undefined;
    } | undefined;
};
export type LoadTsConfigError = import("@tevm/effect").ParseJsonError | FailedToReadConfigError | InvalidTsConfigError;
//# sourceMappingURL=loadTsConfig.d.ts.map