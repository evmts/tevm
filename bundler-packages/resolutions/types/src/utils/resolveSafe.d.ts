/**
 * Error thrown when resolve fails
 */
export class ResolveError extends Error {
    /**
     * @param {Error} cause
     */
    constructor(cause: Error);
    /**
     * @type {'ResolveError'}
     */
    _tag: "ResolveError";
    /**
     * @type {'ResolveError'}
     * @override
     */
    override name: "ResolveError";
}
export function resolveSafe(filePath: string, basedir: string, fao: import("./safeFao.js").SafeFao): import("effect/Effect").Effect<string, ResolveSafeError, never>;
export type ResolveSafeError = ResolveError | import("./safeFao.js").ReadFileError | import("./safeFao.js").ExistsError;
//# sourceMappingURL=resolveSafe.d.ts.map