import type { FileAccessObject } from '@tevm/base-bundler';
import type typescript from 'typescript/lib/tsserverlibrary.js';
/**
 * Creates a FileAccessObject implementation that uses the TypeScript LanguageServiceHost
 * to read and write files.
 *
 * This adapter allows the Tevm bundler to interact with the TypeScript language service's
 * virtual file system rather than directly with the real file system. The LSP maintains
 * its own view of files, which may include unsaved changes not yet written to disk.
 *
 * @param lsHost - The TypeScript language service host providing file access
 * @returns A FileAccessObject implementation that delegates to the LanguageServiceHost
 */
export declare const createFileAccessObject: (lsHost: typescript.LanguageServiceHost) => FileAccessObject;
/**
 * Creates a FileAccessObject implementation that uses the real filesystem.
 *
 * This implementation directly uses Node.js fs/fs.promises APIs to access the
 * actual filesystem rather than the TypeScript language service's virtual filesystem.
 * It's primarily used for operations that need to persist outside the language
 * service context, such as caching.
 *
 * @returns A FileAccessObject implementation using real filesystem access
 */
export declare const createRealFileAccessObject: (lsHost?: typescript.LanguageServiceHost, cwd?: string) => FileAccessObject;
