/**
 * Determines if a path is both a Solidity file and a relative import.
 *
 * This is used to distinguish between relative Solidity imports
 * (like './Contract.sol') and package imports (like 'package/Contract.sol'),
 * which need different resolution strategies.
 *
 * @param fileName - The file path to check
 * @returns True if the path is both a relative path and a Solidity file, false otherwise
 * @example
 * ```typescript
 * isRelativeSolidity('./Contract.sol')       // true
 * isRelativeSolidity('../Contract.sol')      // true
 * isRelativeSolidity('Contract.sol')         // false (not relative)
 * isRelativeSolidity('./Contract.js')        // false (not Solidity)
 * ```
 */
export declare const isRelativeSolidity: (fileName: string) => boolean;
