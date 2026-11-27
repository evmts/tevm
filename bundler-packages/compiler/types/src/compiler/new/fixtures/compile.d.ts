export type ContractConfig = {
    /**
     * - The name of the contract
     */
    name: string;
    /**
     * - The main contract file
     */
    main: string;
    /**
     * - The language of the contract
     */
    language: "Solidity" | "Yul";
    /**
     * - Additional files to include (Solidity only)
     */
    dependencies?: string[];
};
//# sourceMappingURL=compile.d.ts.map