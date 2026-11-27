export function createCompileFingerprint(config: import("@tevm/config").ResolvedCompilerConfig, solc: Omit<import("@tevm/solc").Solc, "version"> & {
    version: string | (() => string);
}, includeAst: boolean, includeBytecode: boolean): string;
//# sourceMappingURL=createCompileFingerprint.d.ts.map