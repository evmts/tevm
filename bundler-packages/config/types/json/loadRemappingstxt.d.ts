/**
 * TypeError thrown when the user provided remappings is not properly formatted
 * @internal
 */
export class InvalidRemappingsError extends TypeError {
    /**
     * @type {'InvalidRemappingsError'}
     * @override
     */
    override name: "InvalidRemappingsError";
    /**
     * @type {'InvalidRemappingsError'}
     */
    _tag: "InvalidRemappingsError";
}
export function loadRemappings(configFilePath: string): import("effect/Effect").Effect<import("../types.js").CompilerConfig, LoadRemappingsError, never>;
export type LoadRemappingsError = InvalidRemappingsError;
//# sourceMappingURL=loadRemappingstxt.d.ts.map