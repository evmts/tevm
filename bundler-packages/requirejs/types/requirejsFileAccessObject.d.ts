/**
 * An adapter around the Node.js fs API that implements the FileAccessObject interface
 * required by @tevm/base-bundler.
 *
 * This object provides a complete implementation of the FileAccessObject interface using
 * standard Node.js file system functions, which is used by Tevm bundlers to read and write
 * files during the Solidity compilation process.
 *
 * @type {import("@tevm/base-bundler").FileAccessObject}
 *
 * @example
 * ```javascript
 * import { requirejsFileAccessObject } from '@tevm/requirejs'
 * import { bundler } from '@tevm/base-bundler'
 *
 * // Use in Tevm bundler
 * const tevmBundler = bundler(
 *   config,
 *   console,
 *   requirejsFileAccessObject, // Pass the file access object
 *   solcCompiler,
 *   cacheInstance
 * )
 *
 * // Or use directly
 * const fileExists = await requirejsFileAccessObject.exists('./contracts/Token.sol')
 * if (fileExists) {
 *   const content = await requirejsFileAccessObject.readFile('./contracts/Token.sol', 'utf8')
 *   console.log(content)
 * }
 * ```
 *
 * @see {@link https://nodejs.org/api/fs.html | Node.js File System Documentation}
 */
export const requirejsFileAccessObject: import("@tevm/base-bundler").FileAccessObject;
//# sourceMappingURL=requirejsFileAccessObject.d.ts.map