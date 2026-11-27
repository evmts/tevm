/**
 * Error thrown if foundry is not found in path while foundryProject is set in config
 * @internal
 */
export class FoundryNotFoundError extends Error {
    /**
     * @param {string} forgeCommand
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(forgeCommand: string, options?: {
        cause?: unknown;
    });
    /**
     * @type {'FoundryNotFoundError'}
     */
    _tag: "FoundryNotFoundError";
}
/**
 * Error thrown if parsing the foundry config with `forge config` fails
 * @internal
 */
export class FoundryConfigError extends Error {
    /**
     * @param {string} forgeCommand
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(forgeCommand: string, options?: {
        cause?: unknown;
    });
    /**
     * @type {'FoundryConfigError'}
     */
    _tag: "FoundryConfigError";
}
/**
 * Error thrown if foundry remappings cannot be parsed while foundryProject is set
 * @internal
 */
export class InvalidRemappingsError extends Error {
    /**
     * @param {string} remappings
     * @param {object} [options]
     * @param {unknown} [options.cause]
     */
    constructor(remappings: string, options?: {
        cause?: unknown;
    });
    /**
     * @type {'InvalidRemappingsError'}
     */
    _tag: "InvalidRemappingsError";
}
export function loadFoundryConfig(foundryProject: string | boolean | undefined, configFilePath: string): import("effect/Effect").Effect<import("../types.js").CompilerConfig, LoadFoundryConfigError, never>;
export type LoadFoundryConfigError = FoundryNotFoundError | FoundryConfigError | InvalidRemappingsError;
//# sourceMappingURL=loadFoundryConfig.d.ts.map