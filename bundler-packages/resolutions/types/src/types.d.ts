export type FileAccessObject = {
    readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
    readFileSync: (path: string, encoding: BufferEncoding) => string;
    existsSync: (path: string) => boolean;
    exists: (path: string) => Promise<boolean>;
};
export type Logger = {
    info: (...messages: string[]) => void;
    error: (...message: string[]) => void;
    warn: (...message: string[]) => void;
    log: (...message: string[]) => void;
};
/**
 * Copied from rollup (kinda)
 * @see https://rollupjs.org/plugin-development/#this-getmoduleinfo
 */
export interface ModuleInfo {
    id: string;
    rawCode: string | null;
    code: string | null;
    importedIds: string[];
}
/**
 * The result of the resolution of an  import
 */
export type ResolvedImport = {
    original: string;
    absolute: string;
    updated: string;
};
//# sourceMappingURL=types.d.ts.map