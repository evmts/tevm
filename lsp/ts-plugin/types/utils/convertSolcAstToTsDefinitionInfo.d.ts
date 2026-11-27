import type { Node } from 'solidity-ast/node.js';
import type { SolcInput } from 'solidity-ast/solc.js';
import type typescript from 'typescript/lib/tsserverlibrary.js';
/**
 * Adapter from solc to typescript
 * When given basic solc information it will turn it into a TypeScript DefinitionInfo object
 */
export declare function convertSolcAstToTsDefinitionInfo(astNode: Node, fileName: string, containerName: string, solcInput: SolcInput, ts: typeof typescript): typescript.DefinitionInfo;
