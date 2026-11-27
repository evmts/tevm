/**
 * Error type for {@link getTevmConfigFromTsConfig}
 * @internal
 */
export class NoPluginInTsConfigFoundError extends Error {
    /**
     * @type {'NoPluginInTsConfigFoundError'}
     */
    _tag: "NoPluginInTsConfigFoundError";
}
export function getTevmConfigFromTsConfig(tsConfig: import("./loadTsConfig.js").TsConfig, configPath: string): import("effect/Effect").Effect<import("../types.js").CompilerConfig, GetTevmConfigFromTsConfigError, never>;
export type GetTevmConfigFromTsConfigError = NoPluginInTsConfigFoundError | import("../config/index.js").InvalidConfigError;
//# sourceMappingURL=getTevmConfigFromTsConfig.d.ts.map