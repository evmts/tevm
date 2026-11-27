import type typescript from 'typescript/lib/tsserverlibrary.js';
/**
 * Resolves a Solidity module name to its filesystem location and TypeScript type information.
 *
 * This utility handles three different import scenarios:
 * 1. Relative Solidity imports (like './Contract.sol')
 * 2. Package Solidity imports (like 'package/Contract.sol')
 * 3. Special case for '@tevm/contract' imports which need special resolution
 *
 * When Solidity files are imported, they're treated as TypeScript declaration files (.d.ts)
 * to provide type checking and IDE support for the contracts.
 *
 * @param moduleName - The module name to resolve (e.g., './Contract.sol')
 * @param ts - TypeScript library instance
 * @param createInfo - Plugin creation information from TypeScript
 * @param containingFile - Path to the file containing the import
 * @returns A resolved module with filename and extension information, or undefined if not resolvable
 */
export declare const solidityModuleResolver: (moduleName: string, ts: typeof typescript, createInfo: typescript.server.PluginCreateInfo, containingFile: string, options?: {
    isRemapped?: boolean;
    projectRoot?: string;
}) => typescript.ResolvedModuleFull | undefined;
