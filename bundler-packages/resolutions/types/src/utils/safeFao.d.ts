/**
 * @typedef {ReturnType<typeof safeFao>} SafeFao
 */
export class ReadFileError extends Error {
    /**
     * @param {Error} cause
     */
    constructor(cause: Error);
    /**
     * @type {'ReadFileError'}
     */
    _tag: "ReadFileError";
    /**
     * @type {'ReadFileError'}
     * @override
     */
    override name: "ReadFileError";
}
export class ExistsError extends Error {
    /**
     * @param {Error} cause
     */
    constructor(cause: Error);
    /**
     * @type {'ExistsError'}
     */
    _tag: "ExistsError";
    /**
     * @type {'ExistsError'}
     * @override
     */
    override name: "ExistsError";
}
export function safeFao(fao: import("../types.js").FileAccessObject): {
    /**
     * @param {string} path
     * @param {BufferEncoding} encoding
     */
    readFile: (path: string, encoding: BufferEncoding) => import("effect/Effect").Effect<string, ReadFileError, never>;
    /**
     * @param {string} path
     * @param {BufferEncoding} encoding
     */
    readFileSync: (path: string, encoding: BufferEncoding) => import("effect/Effect").Effect<string, ReadFileError, never>;
    /**
     * @param {string} path
     */
    exists: (path: string) => import("effect/Effect").Effect<boolean, ExistsError, never>;
    /**
     * @param {string} path
     */
    existsSync: (path: string) => import("effect/Effect").Effect<boolean, ExistsError, never>;
};
export type SafeFao = ReturnType<typeof safeFao>;
//# sourceMappingURL=safeFao.d.ts.map