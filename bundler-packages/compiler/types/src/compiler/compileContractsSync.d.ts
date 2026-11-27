/**
 * Compile the Solidity contract and return its ABI.
 *
 * @template TIncludeAsts
 * @template TIncludeBytecode
 * @param {string} filePath
 * @param {string} basedir
 * @param {import('@tevm/config').ResolvedCompilerConfig} config
 * @param {TIncludeAsts} includeAst
 * @param {TIncludeBytecode} includeBytecode
 * @param {import('../types.js').FileAccessObject} fao
 * @param {import('../types.js').Logger} logger
 * @param {any} solc
 * @returns {import('../types.js').CompiledContracts}
 * @example
 * const { artifacts, modules } = compileContractSync(
 *  './contracts/MyContract.sol',
 *  __dirname,
 *  config,
 *  true,
 *  await import('fs'),
 *  logger,
 *  )
 */
export function compileContractSync<TIncludeAsts, TIncludeBytecode>(filePath: string, basedir: string, config: import("@tevm/config").ResolvedCompilerConfig, includeAst: TIncludeAsts, includeBytecode: TIncludeBytecode, fao: import("../types.js").FileAccessObject, logger: import("../types.js").Logger, solc: any): import("../types.js").CompiledContracts;
//# sourceMappingURL=compileContractsSync.d.ts.map