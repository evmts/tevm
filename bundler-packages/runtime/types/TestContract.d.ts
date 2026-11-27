export namespace TestContract {
    function read(): {
        /**
         * @param {import("abitype").Address} address
         */
        balanceOf: (address: import("abitype").Address) => {
            abi: never[];
            address: string;
            args: `0x${string}`[];
        };
        totalSupply: () => {
            abi: never[];
            address: string;
            args: never[];
        };
        symbol: () => {
            abi: never[];
            address: string;
            args: never[];
        };
    };
}
//# sourceMappingURL=TestContract.d.ts.map