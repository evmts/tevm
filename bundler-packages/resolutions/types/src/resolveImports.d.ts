export function resolveImports(absolutePath: string, code: string, remappings: Record<string, string>, libs: ReadonlyArray<string>, sync: boolean): import("effect/Effect").Effect<ReadonlyArray<import("./types.js").ResolvedImport>, ResolveImportsError, never>;
export type ResolveImportsError = ImportDoesNotExistError | import("./utils/resolveImportPath.js").CouldNotResolveImportError;
declare class ImportDoesNotExistError extends Error {
    constructor();
    /**
     * @type {'ImportDoesNotExistError'}
     */
    _tag: "ImportDoesNotExistError";
    /**
     * @type {'ImportDoesNotExistError'}
     * @override
     */
    override name: "ImportDoesNotExistError";
}
export {};
//# sourceMappingURL=resolveImports.d.ts.map