export function compileSolidity(input: {
    source: string;
    contractName?: string;
    optimize?: boolean;
}): {
    contractName: string;
    abi: Array<Record<string, unknown>>;
    bytecode: `0x${string}`;
    deployedBytecode: `0x${string}`;
    compilerVersion: string;
    warnings: string[];
};
//# sourceMappingURL=compileSolidity.d.ts.map