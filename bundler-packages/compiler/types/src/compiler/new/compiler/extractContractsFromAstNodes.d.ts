export function extractContractsFromAstNodes<TWithSourceMap extends boolean = false>(sourceUnits: import("solc-typed-ast").SourceUnit[], options: import("./CompileBaseOptions.js").CompileBaseOptions & {
    withSourceMap?: TWithSourceMap;
}): {
    sources: {
        [sourcePath: string]: string;
    };
    sourceMaps: TSourceMaps<TWithSourceMap>;
};
export type TSourceMaps<TWithSourceMap extends boolean> = TWithSourceMap extends true ? {
    [sourcePath: string]: Map<import("solc-typed-ast").ASTNode, [number, number]>;
} : undefined;
//# sourceMappingURL=extractContractsFromAstNodes.d.ts.map