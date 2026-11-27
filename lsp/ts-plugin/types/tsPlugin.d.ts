import type typescript from 'typescript/lib/tsserverlibrary.js';
/**
 * TypeScript server plugin factory that enables Solidity support in TypeScript.
 * This plugin allows direct importing of .sol files in TypeScript with proper
 * type definitions, code navigation, and IDE support.
 *
 * The plugin works by decorating the TypeScript language service to handle
 * Solidity files, compile them with solc, and provide TypeScript definitions.
 *
 * Add to your tsconfig.json:
 * @example
 * ```json
 * {
 *   "compilerOptions": {
 *     "plugins": [{ "name": "tevm-ts-plugin" }]
 *   }
 * }
 * ```
 *
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin
 * @see https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#decorator-creation
 */
export declare const tsPlugin: typescript.server.PluginModuleFactory;
