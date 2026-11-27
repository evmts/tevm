export { resolveArtifacts } from "./resolveArtifacts.js";
export { resolveArtifactsSync } from "./resolveArtifactsSync.js";
/**
 * ./types.ts
 */
export type Artifacts = import("./types.js").Artifacts;
/**
 * ./types.ts
 */
export type CompiledContracts = import("./types.js").CompiledContracts;
/**
 * ./types.ts
 */
export type FileAccessObject = import("./types.js").FileAccessObject;
/**
 * ./types.ts
 */
export type Logger = import("./types.js").Logger;
/**
 * ./types.ts
 */
export type ModuleInfo = import("./types.js").ModuleInfo;
/**
 * ./types.ts
 */
export type ResolvedArtifacts = import("./types.js").ResolvedArtifacts;
export { compileFiles, compileFilesWithShadow, compileSource, compileSources, compileSourcesWithShadow, compileSourceWithShadow, createCompiler, extractContractsFromAstNodes, extractContractsFromSolcOutput, solcSourcesToAstNodes } from "./compiler/new/index.js";
//# sourceMappingURL=index.d.ts.map