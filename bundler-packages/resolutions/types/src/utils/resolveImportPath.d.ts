export class CouldNotResolveImportError extends Error {
    /**
     * @param {string} importPath
     * @param {string} absolutePath
     * @param {Error} cause
     */
    constructor(importPath: string, absolutePath: string, cause: Error);
    /**
     * @type {'CouldNotResolveImportError'}
     */
    _tag: "CouldNotResolveImportError";
    /**
     * @type {'CouldNotResolveImportError'}
     * @override
     */
    override name: "CouldNotResolveImportError";
}
export function resolveImportPath(absolutePath: string, importPath: string, remappings: Record<string, string>, libs: ReadonlyArray<string>, sync: boolean): import("effect/Effect").Effect<string, CouldNotResolveImportError, never>;
//# sourceMappingURL=resolveImportPath.d.ts.map