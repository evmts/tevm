/**
 * An adapter around the Bun file API that implements the FileAccessObject interface
 * required by @tevm/base-bundler.
 *
 * This object combines Node.js file system functions with Bun's optimized file API
 * to provide a complete implementation of the FileAccessObject interface, which is
 * used by Tevm bundlers to read and write files during the Solidity compilation process.
 *
 * @type {import("@tevm/base-bundler").FileAccessObject}
 *
 * @example
 * ```javascript
 * import { bunFileAccesObject } from '@tevm/bun'
 * import { bundler } from '@tevm/base-bundler'
 *
 * // Use in Tevm bundler
 * const tevmBundler = bundler(
 *   config,
 *   console,
 *   bunFileAccesObject, // Pass the file access object
 *   solcCompiler,
 *   cacheInstance
 * )
 *
 * // Or use directly
 * const fileExists = await bunFileAccesObject.exists('./contracts/Token.sol')
 * if (fileExists) {
 *   const content = await bunFileAccesObject.readFile('./contracts/Token.sol', 'utf8')
 *   console.log(content)
 * }
 * ```
 *
 * @see {@link https://bun.sh/docs/api/file-io | Bun File I/O Documentation}
 */
export const bunFileAccesObject: import("@tevm/base-bundler").FileAccessObject;
//# sourceMappingURL=bunFileAccessObject.d.ts.map