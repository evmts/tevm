import type { Logger } from './types.js';
type MockFileAccessObject = {
    readFile: (path: string, encoding?: BufferEncoding) => Promise<string>;
    readFileSync: (path: string, encoding?: BufferEncoding) => string;
    exists: (path: string) => Promise<boolean>;
    existsSync: (path: string) => boolean;
};
/**
 * Creates a mock file access object for testing
 *
 * @param fileMap - Map of file paths to file contents
 * @returns The mock file access object
 */
export declare function createMockFileAccessObject(fileMap?: Record<string, string>): MockFileAccessObject;
/**
 * Creates a mock logger for testing
 *
 * @returns The mock logger object
 */
export declare function createMockLogger(): Logger;
/**
 * Simple Solidity contract for testing
 */
export declare const SIMPLE_CONTRACT = "\npragma solidity ^0.8.0;\n\ncontract SimpleContract {\n  uint256 public value;\n  \n  constructor() {\n    value = 0;\n  }\n  \n  function setValue(uint256 _value) public {\n    value = _value;\n  }\n  \n  function getValue() public view returns (uint256) {\n    return value;\n  }\n}\n";
/**
 * Creates a mock solc compiler with the specified outputs
 *
 * @param outputs - The compiler outputs to return
 * @returns The mock solc compiler
 */
export declare function createMockSolc(outputs?: any): {
    compile: (...args: any[]) => any;
};
export {};
//# sourceMappingURL=testing-utils.d.ts.map