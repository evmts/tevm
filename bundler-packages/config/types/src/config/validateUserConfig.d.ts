/**
 * Error thrown when the user provided config factory throws
 * @internal
 */
export class ConfigFnThrowError extends Error {
    /**
     * @param {object} options
     * @param {unknown} options.cause
     */
    constructor(options: {
        cause: unknown;
    });
    /**
     * @type {'ConfigFnThrowError'}
     */
    _tag: "ConfigFnThrowError";
}
/**
 * TypeError thrown when the user provided config factory is incorrectly typed
 * @internal
 */
export class InvalidConfigError extends TypeError {
    /**
     * @type {'InvalidConfigError'}
     */
    _tag: "InvalidConfigError";
}
export function validateUserConfig(untrustedConfigFactory: () => import("../types.js").CompilerConfig): import("effect/Effect").Effect<import("../types.js").CompilerConfig, ValidateUserConfigError, never>;
export type ValidateUserConfigError = ConfigFnThrowError | InvalidConfigError;
//# sourceMappingURL=validateUserConfig.d.ts.map