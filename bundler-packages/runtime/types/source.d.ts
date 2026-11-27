/**
 * @typedef {string} Address
 */
/**
 * Mock implementation of useContractRead
 * @template T
 * @param {{enabled: boolean}} options
 * @returns {{data: T|undefined}}
 */
export declare const useContractRead: (options: {
    enabled: boolean;
}) => {
    data: bigint | undefined;
};
/**
 * Example React component that reads from a contract
 * @returns {{testBalance: bigint|undefined, symbol: bigint|undefined, totalSupply: bigint|undefined}}
 */
export declare const WagmiReads: () => {
    testBalance: bigint | undefined;
    symbol: bigint | undefined;
    totalSupply: bigint | undefined;
};
//# sourceMappingURL=source.d.ts.map