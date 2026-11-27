import type typescript from 'typescript/lib/tsserverlibrary.js';
/**
 * Find the typescript node at the given position in the AST
 */
export declare function findNode(rootNode: typescript.Node, position: number): typescript.Node | null;
