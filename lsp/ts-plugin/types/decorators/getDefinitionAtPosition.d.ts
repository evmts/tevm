import { type FileAccessObject } from '@tevm/base-bundler';
import type { Cache } from '@tevm/bundler-cache';
import type { ResolvedCompilerConfig } from '@tevm/config';
import type typescript from 'typescript/lib/tsserverlibrary.js';
import type { Logger } from '../factories/logger.js';
/**
 * Decorates the TypeScript LanguageService to provide "Go to Definition" support for Solidity contracts.
 *
 * This decorator extends the standard TypeScript language service by:
 * 1. Detecting when a user attempts to navigate to a definition in a Solidity contract
 * 2. Compiling the Solidity source using solc
 * 3. Parsing the AST to find matching function/event definitions
 * 4. Converting Solidity AST nodes to TypeScript definition information
 * 5. Returning these definitions alongside any TypeScript definitions
 *
 * This enables IDE features like "Go to Definition" to work seamlessly between TypeScript and Solidity.
 *
 * Note: Unlike other decorators in this codebase, this decorates the language service directly,
 * not the LanguageServiceHost. Future refactoring may generalize this approach.
 *
 * @param service - The TypeScript language service to decorate
 * @param config - Compiler configuration for Solidity files
 * @param logger - Logger instance for debugging information
 * @param ts - TypeScript library instance
 * @param fao - File access object for reading files
 * @param solcCache - Cache instance for solc compilations
 * @returns Decorated TypeScript language service with Solidity definition support
 */
export declare const getDefinitionServiceDecorator: (service: typescript.LanguageService, config: ResolvedCompilerConfig, logger: Logger, ts: typeof typescript, fao: FileAccessObject, solcCache: Cache) => typescript.LanguageService;
