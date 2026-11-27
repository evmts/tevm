export class UnknownChainError extends Error {
    /**
     * @param {number} chainId
     */
    constructor(chainId: number);
    /**
     * @type {'UnknownChainError'}
     * @override
     */
    override name: "UnknownChainError";
    /**
     * @type {'UnknownChainError'}
     */
    _tag: "UnknownChainError";
}
export function resolveContractUri(contractUri: import("./ContractUri.js").ContractUri, config: import("@tevm/config").ResolvedCompilerConfig): Promise<{
    abi: import("@tevm/utils").Abi;
    address: import("@tevm/utils").Address;
    deployedBytecode: import("@tevm/utils").Hex;
} | undefined>;
//# sourceMappingURL=resolveContractUri.d.ts.map