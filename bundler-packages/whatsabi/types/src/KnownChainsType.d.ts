import * as chains from 'viem/chains';
export type KnownChainsType = typeof knownChains;
declare const knownChains: {
    1: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://etherscan.io";
                readonly apiUrl: "https://api.etherscan.io/api";
            };
        };
        blockTime: 12000;
        contracts: {
            readonly ensUniversalResolver: {
                readonly address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee";
                readonly blockCreated: 23085558;
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14353601;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1;
        name: "Ethereum";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth.merkle.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    10: {
        blockExplorers: {
            readonly default: {
                readonly name: "Optimism Explorer";
                readonly url: "https://optimistic.etherscan.io";
                readonly apiUrl: "https://api-optimistic.etherscan.io/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 1: {
                    readonly address: "0xe5965Ab5962eDc7477C8520243A95517CD252fA9";
                };
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0xdfe97868233d1aa22e815a266982f2cf17685a27";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 4286263;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0xbEb5Fc579115071764c7423A4f12eDde41f106Ed";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 10;
        name: "OP Mainnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.optimism.io"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    11155420: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://optimism-sepolia.blockscout.com";
                readonly apiUrl: "https://optimism-sepolia.blockscout.com/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 11155111: {
                    readonly address: "0x05F9613aDB30026FFd634f38e5C4dFd30a197Fa1";
                };
            };
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0x90E9c4f8a994a250F6aEfd61CAFb4F2e895D458F";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1620204;
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0x16Fc5058F25648194471939df75CF27A2fdC48BC";
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0xFBb0621E0B23b5478B630BD55a5f21f67730B0F1";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 11155420;
        name: "OP Sepolia";
        nativeCurrency: {
            readonly name: "Sepolia Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.optimism.io"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    42161: {
        blockExplorers: {
            readonly default: {
                readonly name: "Arbiscan";
                readonly url: "https://arbiscan.io";
                readonly apiUrl: "https://api.arbiscan.io/api";
            };
        };
        blockTime: 250;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 7654707;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42161;
        name: "Arbitrum One";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://arb1.arbitrum.io/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    8453: {
        blockExplorers: {
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://basescan.org";
                readonly apiUrl: "https://api.basescan.org/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 1: {
                    readonly address: "0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e";
                };
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x56315b90c40730925ec5485cf004d835058518A0";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 5022;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e";
                    readonly blockCreated: 17482143;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";
                    readonly blockCreated: 17482143;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 8453;
        name: "Base";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.base.org"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    84532: {
        blockExplorers: {
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://sepolia.basescan.org";
                readonly apiUrl: "https://api-sepolia.basescan.org/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 11155111: {
                    readonly address: "0xd6E6dBf4F7EA0ac412fD8b65ED297e64BB7a06E1";
                };
            };
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0x84457ca9D0163FbC4bbfe4Dfbb20ba46e48DF254";
                };
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0x49f53e41452c74589e85ca1677426ba426459e85";
                    readonly blockCreated: 4446677;
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0xfd0Bf71F60660E2f608ed56e1659C450eB113120";
                    readonly blockCreated: 4446677;
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1059647;
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 84532;
        name: "Base Sepolia";
        nativeCurrency: {
            readonly name: "Sepolia Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.base.org"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "base-sepolia";
    };
    137: {
        blockExplorers: {
            readonly default: {
                readonly name: "PolygonScan";
                readonly url: "https://polygonscan.com";
                readonly apiUrl: "https://api.etherscan.io/v2/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 25770160;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 137;
        name: "Polygon";
        nativeCurrency: {
            readonly name: "POL";
            readonly symbol: "POL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://polygon.drpc.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7777777: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://explorer.zora.energy";
                readonly apiUrl: "https://explorer.zora.energy/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 1: {
                    readonly address: "0xB0F15106fa1e473Ddb39790f197275BC979Aa37e";
                };
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x9E6204F750cD866b299594e2aC9eA824E2e5f95c";
                };
            };
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 5882;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x1a0ad011913A150f69f6A19DF447A0CfD9551054";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x3e2Ea9B92B7E48A52296fD261dc26fd995284631";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7777777;
        name: "Zora";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.zora.energy"];
                readonly webSocket: readonly ["wss://rpc.zora.energy"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    11155111: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://sepolia.etherscan.io";
                readonly apiUrl: "https://api-sepolia.etherscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 751532;
            };
            readonly ensUniversalResolver: {
                readonly address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee";
                readonly blockCreated: 8928790;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 11155111;
        name: "Sepolia";
        nativeCurrency: {
            readonly name: "Sepolia Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://11155111.rpc.thirdweb.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    123: {
        blockExplorers: {
            readonly default: {
                readonly name: "Sparkent Explorer";
                readonly url: "https://explorer.fusespark.io";
                readonly apiUrl: "https://explorer.fusespark.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 123;
        name: "Fuse Sparknet";
        nativeCurrency: {
            readonly name: "Spark";
            readonly symbol: "SPARK";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.fusespark.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    33979: {
        blockExplorers: {
            readonly default: {
                readonly name: "Funki Mainnet Explorer";
                readonly url: "https://funkiscan.io";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 33979;
        name: "Funki";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-mainnet.funkichain.com"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    3397901: {
        blockExplorers: {
            readonly default: {
                readonly name: "Funki Sepolia Sandbox Explorer";
                readonly url: "https://sepolia-sandbox.funkichain.com/";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1620204;
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 3397901;
        name: "Funki Sepolia Sandbox";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://funki-testnet.alt.technology"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "funkiSepolia";
    };
    114: {
        blockExplorers: {
            readonly default: {
                readonly name: "Coston2 Explorer";
                readonly url: "https://coston2-explorer.flare.network";
                readonly apiUrl: "https://coston2-explorer.flare.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 114;
        name: "Flare Testnet Coston2";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Coston2 Flare";
            readonly symbol: "C2FLR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://coston2-api.flare.network/ext/C/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    9000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Evmos Testnet Block Explorer";
                readonly url: "https://evm.evmos.dev/";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 9000;
        name: "Evmos Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Evmos";
            readonly symbol: "EVMOS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth.bd.evmos.dev:8545"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1130: {
        blockExplorers: {
            readonly default: {
                readonly name: "DeFiScan";
                readonly url: "https://meta.defiscan.live";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 137852;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1130;
        name: "DeFiChain EVM Mainnet";
        nativeCurrency: {
            readonly name: "DeFiChain";
            readonly symbol: "DFI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth.mainnet.ocean.jellyfishsdk.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "defichain-evm";
    };
    111557560: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://testnet.cyberscan.co";
                readonly apiUrl: "https://testnet.cyberscan.co/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xffc391F0018269d4758AEA1a144772E8FB99545E";
                readonly blockCreated: 304545;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 111557560;
        name: "Cyber Testnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://cyber-testnet.alt.technology"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    168587773: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blastscan";
                readonly url: "https://sepolia.blastscan.io";
                readonly apiUrl: "https://api-sepolia.blastscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 756690;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 168587773;
        name: "Blast Sepolia";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.blast.io"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    463: {
        blockExplorers: {
            readonly default: {
                readonly name: "Areonscan";
                readonly url: "https://areonscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 353286;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 463;
        name: "Areon Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "AREA";
            readonly symbol: "AREA";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet-rpc.areon.network"];
                readonly webSocket: readonly ["wss://mainnet-ws.areon.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    42170: {
        blockExplorers: {
            readonly default: {
                readonly name: "Arbiscan";
                readonly url: "https://nova.arbiscan.io";
                readonly apiUrl: "https://api-nova.arbiscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1746963;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42170;
        name: "Arbitrum Nova";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://nova.arbitrum.io/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    999: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://testnet.explorer.zora.energy";
                readonly apiUrl: "https://testnet.explorer.zora.energy/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 189123;
            };
            readonly portal: {
                readonly 5: {
                    readonly address: "0xDb9F51790365e7dc196e7D072728df39Be958ACe";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 999;
        name: "Zora Goerli Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Zora Goerli";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://testnet.rpc.zora.energy"];
                readonly webSocket: readonly ["wss://testnet.rpc.zora.energy"];
            };
        };
        sourceId: 5;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    999999999: {
        blockExplorers: {
            readonly default: {
                readonly name: "Zora Sepolia Explorer";
                readonly url: "https://sepolia.explorer.zora.energy/";
                readonly apiUrl: "https://sepolia.explorer.zora.energy/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0x2615B481Bd3E5A1C0C7Ca3Da1bdc663E8615Ade9";
                };
            };
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 83160;
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0xeffE2C6cA9Ab797D418f0D91eA60807713f3536f";
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0x5376f1D543dcbB5BD416c56C189e4cB7399fCcCB";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 999999999;
        name: "Zora Sepolia";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Zora Sepolia";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.rpc.zora.energy"];
                readonly webSocket: readonly ["wss://sepolia.rpc.zora.energy"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "zora-sepolia";
    };
    50005: {
        blockExplorers: {
            readonly default: {
                readonly name: "Yooldo Verse Explorer";
                readonly url: "https://explorer.yooldo-verse.xyz";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 50005;
        name: "Yooldo Verse";
        nativeCurrency: {
            readonly name: "OAS";
            readonly symbol: "OAS";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.yooldo-verse.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    167007: {
        blockExplorers: {
            readonly default: {
                readonly name: "blockscout";
                readonly url: "https://explorer.jolnir.taiko.xyz";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 732706;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 167007;
        name: "Taiko Jolnir (Alpha-5 Testnet)";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.jolnir.taiko.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1482601649: {
        blockExplorers: {
            readonly default: {
                readonly name: "SKALE Explorer";
                readonly url: "https://green-giddy-denebola.explorer.mainnet.skalenodes.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 2372986;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1482601649;
        name: "SKALE Nebula Hub";
        nativeCurrency: {
            readonly name: "sFUEL";
            readonly symbol: "sFUEL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.skalenodes.com/v1/green-giddy-denebola"];
                readonly webSocket: readonly ["wss://mainnet.skalenodes.com/v1/ws/green-giddy-denebola"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2139927552: {
        blockExplorers: {
            readonly default: {
                readonly name: "SKALE Explorer";
                readonly url: "https://light-vast-diphda.explorer.mainnet.skalenodes.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {};
        ensTlds?: readonly string[] | undefined;
        id: 2139927552;
        name: "Exorde Network";
        nativeCurrency: {
            readonly name: "sFUEL";
            readonly symbol: "sFUEL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.skalenodes.com/v1/light-vast-diphda"];
                readonly webSocket: readonly ["wss://mainnet.skalenodes.com/v1/ws/light-vast-diphda"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2046399126: {
        blockExplorers: {
            readonly default: {
                readonly name: "SKALE Explorer";
                readonly url: "https://elated-tan-skat.explorer.mainnet.skalenodes.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 3113495;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2046399126;
        name: "SKALE Europa Hub";
        nativeCurrency: {
            readonly name: "sFUEL";
            readonly symbol: "sFUEL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.skalenodes.com/v1/elated-tan-skat"];
                readonly webSocket: readonly ["wss://mainnet.skalenodes.com/v1/ws/elated-tan-skat"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2331: {
        blockExplorers: {
            readonly default: {
                readonly name: "RSS3 VSL Sepolia Testnet Scan";
                readonly url: "https://scan.testnet.rss3.io";
                readonly apiUrl: "https://scan.testnet.rss3.io/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0xDb5c46C3Eaa6Ed6aE8b2379785DF7dd029C0dC81";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 55697;
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0xcBD77E8E1E7F06B25baDe67142cdE82652Da7b57";
                    readonly blockCreated: 5345035;
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0xdDD29bb63B0839FB1cE0eE439Ff027738595D07B";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2331;
        name: "RSS3 VSL Sepolia Testnet";
        nativeCurrency: {
            readonly name: "RSS3";
            readonly symbol: "RSS3";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.testnet.rss3.io"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7672: {
        blockExplorers: {
            readonly default: {
                readonly name: "Rootscan";
                readonly url: "https://porcini.rootscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xc9C2E2429AeC354916c476B30d729deDdC94988d";
                readonly blockCreated: 10555692;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7672;
        name: "The Root Network - Porcini";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "XRP";
            readonly symbol: "XRP";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://porcini.rootnet.app/archive"];
                readonly webSocket: readonly ["wss://porcini.rootnet.app/archive/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1729: {
        blockExplorers: {
            readonly default: {
                readonly name: "Reya Network Explorer";
                readonly url: "https://explorer.reya.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1729;
        name: "Reya Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.reya.network"];
                readonly webSocket: readonly ["wss://ws.reya.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    80002: {
        blockExplorers: {
            readonly default: {
                readonly name: "PolygonScan";
                readonly url: "https://amoy.polygonscan.com";
                readonly apiUrl: "https://api.etherscan.io/v2/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 3127388;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 80002;
        name: "Polygon Amoy";
        nativeCurrency: {
            readonly name: "POL";
            readonly symbol: "POL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-amoy.polygon.technology"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    11297108099: {
        blockExplorers: {
            readonly default: {
                readonly name: "Chainlens";
                readonly url: "https://palm.chainlens.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 15429248;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 11297108099;
        name: "Palm Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "PALM";
            readonly symbol: "PALM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://palm-mainnet.public.blastapi.io"];
                readonly webSocket: readonly ["wss://palm-mainnet.public.blastapi.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    245022934: {
        blockExplorers: {
            readonly default: {
                readonly name: "Neonscan";
                readonly url: "https://neonscan.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 206545524;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 245022934;
        name: "Neon EVM MainNet";
        nativeCurrency: {
            readonly name: "NEON";
            readonly symbol: "NEON";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://neon-proxy-mainnet.solana.p2p.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "neonMainnet";
    };
    1281: {
        blockExplorers?: {
            [key: string]: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
            default: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
        } | undefined | undefined;
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1281;
        name: "Moonbeam Development Node";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "DEV";
            readonly symbol: "DEV";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["http://127.0.0.1:9944"];
                readonly webSocket: readonly ["wss://127.0.0.1:9944"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    919: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://sepolia.explorer.mode.network";
                readonly apiUrl: "https://sepolia.explorer.mode.network/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0x2634BD65ba27AB63811c74A63118ACb312701Bfa";
                    readonly blockCreated: 3778393;
                };
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0x320e1580effF37E008F1C92700d1eBa47c1B23fD";
                    readonly blockCreated: 3778395;
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0xbC5C679879B2965296756CD959C3C739769995E2";
                    readonly blockCreated: 3778392;
                };
            };
            readonly multicall3: {
                readonly address: "0xBAba8373113Fb7a68f195deF18732e01aF8eDfCF";
                readonly blockCreated: 3019007;
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 919;
        name: "Mode Testnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.mode.network"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    599: {
        blockExplorers: {
            readonly default: {
                readonly name: "Metis Goerli Explorer";
                readonly url: "https://goerli.explorer.metisdevops.link";
                readonly apiUrl: "https://goerli.explorer.metisdevops.link/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1006207;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 599;
        name: "Metis Goerli";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Metis Goerli";
            readonly symbol: "METIS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.gateway.metisdevops.link"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4202: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://sepolia-blockscout.lisk.com";
                readonly apiUrl: "https://sepolia-blockscout.lisk.com/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0xA0E35F56C318DE1bD5D9ca6A94Fe7e37C5663348";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0xe3d90F21490686Ec7eF37BE788E02dfC12787264";
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0x1Fb30e446eA791cd1f011675E5F3f5311b70faF5";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 4202;
        name: "Lisk Sepolia";
        nativeCurrency: {
            readonly name: "Sepolia Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.sepolia-api.lisk.com"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "lisk-sepolia";
    };
    59140: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://goerli.lineascan.build";
                readonly apiUrl: "https://api-goerli.lineascan.build/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 498623;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 59140;
        name: "Linea Goerli Testnet";
        nativeCurrency: {
            readonly name: "Linea Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.goerli.linea.build"];
                readonly webSocket: readonly ["wss://rpc.goerli.linea.build"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2221: {
        blockExplorers: {
            readonly default: {
                readonly name: "Kava EVM Testnet Explorer";
                readonly url: "https://testnet.kavascan.com/";
                readonly apiUrl: "https://testnet.kavascan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xDf1D724A7166261eEB015418fe8c7679BBEa7fd6";
                readonly blockCreated: 7242179;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2221;
        name: "Kava EVM Testnet";
        nativeCurrency: {
            readonly name: "Kava";
            readonly symbol: "KAVA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm.testnet.kava.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "kava-testnet";
    };
    11235: {
        blockExplorers: {
            readonly default: {
                readonly name: "HAQQ Explorer";
                readonly url: "https://explorer.haqq.network";
                readonly apiUrl: "https://explorer.haqq.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 11235;
        name: "HAQQ Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Islamic Coin";
            readonly symbol: "ISLM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.eth.haqq.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    545: {
        blockExplorers: {
            readonly default: {
                readonly name: "Flow Diver";
                readonly url: "https://evm-testnet.flowscan.io";
            };
        };
        blockTime: 800;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 137518;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 545;
        name: "Flow EVM Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Flow";
            readonly symbol: "FLOW";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://testnet.evm.nodes.onflow.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    747: {
        blockExplorers: {
            readonly default: {
                readonly name: "Mainnet Explorer";
                readonly url: "https://evm.flowscan.io";
            };
        };
        blockTime: 800;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 6205;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 747;
        name: "Flow EVM Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Flow";
            readonly symbol: "FLOW";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.evm.nodes.onflow.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    28882: {
        blockExplorers: {
            readonly default: {
                readonly name: "BOBAScan";
                readonly url: "https://testnet.bobascan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 28882;
        name: "Boba Sepolia";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.boba.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    11501: {
        blockExplorers: {
            readonly default: {
                readonly name: "Bevmscan";
                readonly url: "https://scan-mainnet.bevm.io";
                readonly apiUrl: "https://scan-mainnet-api.bevm.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 11501;
        name: "BEVM Mainnet";
        nativeCurrency: {
            readonly name: "Bitcoin";
            readonly symbol: "BTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-mainnet-1.bevm.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    13337: {
        blockExplorers: {
            readonly default: {
                readonly name: "Beam Explorer";
                readonly url: "https://subnets-test.avax.network/beam";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x9bf49b704ee2a095b95c1f2d4eb9010510c41c9e";
                readonly blockCreated: 3;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 13337;
        name: "Beam Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Beam";
            readonly symbol: "BEAM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://build.onbeam.com/rpc/testnet"];
                readonly webSocket: readonly ["wss://build.onbeam.com/ws/testnet"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "beam";
    };
    6038361: {
        blockExplorers: {
            readonly default: {
                readonly name: "zKyoto Explorer";
                readonly url: "https://zkyoto.explorer.startale.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 196153;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 6038361;
        name: "Astar zkEVM Testnet zKyoto";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.startale.com/zkyoto"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "zKyoto";
    };
    3993: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://exp-testnet.apexlayer.xyz";
                readonly apiUrl: "https://exp-testnet.apexlayer.xyz/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xf7642be33a6b18D16a995657adb5a68CD0438aE2";
                readonly blockCreated: 283775;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 3993;
        name: "APEX Testnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-testnet.apexlayer.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    810181: {
        blockExplorers: {
            readonly default: {
                readonly name: "zkLink Nova Block Explorer";
                readonly url: "https://sepolia.explorer.zklink.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 810181;
        name: "zkLink Nova Sepolia Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ETH";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.rpc.zklink.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    51: {
        blockExplorers: {
            readonly default: {
                readonly name: "XDCScan";
                readonly url: "https://testnet.xdcscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 59765389;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 51;
        name: "Apothem Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "TXDC";
            readonly symbol: "TXDC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://erpc.apothem.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    37714555429: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://testnet-explorer-v2.xai-chain.net";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 37714555429;
        name: "Xai Testnet";
        nativeCurrency: {
            readonly name: "sXai";
            readonly symbol: "sXAI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://testnet-v2.xai-chain.net/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    167008: {
        blockExplorers: {
            readonly default: {
                readonly name: "blockscout";
                readonly url: "https://explorer.katla.taiko.xyz";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 167008;
        name: "Taiko Katla (Alpha-6 Testnet)";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.katla.taiko.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "tko-katla";
    };
    167009: {
        blockExplorers: {
            readonly default: {
                readonly name: "Taikoscan";
                readonly url: "https://hekla.taikoscan.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 59757;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 167009;
        name: "Taiko Hekla L2";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.hekla.taiko.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1350216234: {
        blockExplorers: {
            readonly default: {
                readonly name: "SKALE Explorer";
                readonly url: "https://parallel-stormy-spica.explorer.mainnet.skalenodes.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 2076458;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1350216234;
        name: "SKALE Titan Hub";
        nativeCurrency: {
            readonly name: "sFUEL";
            readonly symbol: "sFUEL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.skalenodes.com/v1/parallel-stormy-spica"];
                readonly webSocket: readonly ["wss://mainnet.skalenodes.com/v1/ws/parallel-stormy-spica"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    278611351: {
        blockExplorers: {
            readonly default: {
                readonly name: "SKALE Explorer";
                readonly url: "https://turbulent-unique-scheat.explorer.mainnet.skalenodes.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {};
        ensTlds?: readonly string[] | undefined;
        id: 278611351;
        name: "SKALE | Razor Network";
        nativeCurrency: {
            readonly name: "sFUEL";
            readonly symbol: "sFUEL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.skalenodes.com/v1/turbulent-unique-scheat"];
                readonly webSocket: readonly ["wss://mainnet.skalenodes.com/v1/ws/turbulent-unique-scheat"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1328: {
        blockExplorers: {
            readonly default: {
                readonly name: "Seiscan";
                readonly url: "https://testnet.seiscan.io";
                readonly apiUrl: "https://api.etherscan.io/v2/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 98697651;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1328;
        name: "Sei Testnet";
        nativeCurrency: {
            readonly name: "Sei";
            readonly symbol: "SEI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm-rpc-testnet.sei-apis.com"];
                readonly webSocket: readonly ["wss://evm-ws-testnet.sei-apis.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    369: {
        blockExplorers: {
            readonly default: {
                readonly name: "PulseScan";
                readonly url: "https://ipfs.scan.pulsechain.com";
                readonly apiUrl: "https://api.scan.pulsechain.com/api";
            };
        };
        blockTime: 10000;
        contracts: {
            readonly ensRegistry: {
                readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14353601;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 369;
        name: "PulseChain";
        nativeCurrency: {
            readonly name: "Pulse";
            readonly symbol: "PLS";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.pulsechain.com"];
                readonly webSocket: readonly ["wss://ws.pulsechain.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    58008: {
        blockExplorers: {
            readonly default: {
                readonly name: "PGN Testnet Explorer";
                readonly url: "https://explorer.sepolia.publicgoods.network";
                readonly apiUrl: "https://explorer.sepolia.publicgoods.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly l2OutputOracle: {
                readonly 11155111: {
                    readonly address: "0xD5bAc3152ffC25318F848B3DD5dA6C85171BaEEe";
                };
            };
            readonly portal: {
                readonly 11155111: {
                    readonly address: "0xF04BdD5353Bb0EFF6CA60CfcC78594278eBfE179";
                };
            };
            readonly l1StandardBridge: {
                readonly 11155111: {
                    readonly address: "0xFaE6abCAF30D23e233AC7faF747F2fC3a5a6Bfa3";
                };
            };
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 3754925;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 58008;
        name: "PGN";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.publicgoods.network"];
            };
        };
        sourceId: 11155111;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "pgn-testnet";
    };
    41144114: {
        blockExplorers?: {
            [key: string]: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
            default: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
        } | undefined | undefined;
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly batchInvoker: {
                readonly address: "0x5FbDB2315678afecb367f032d93F642f64180aa3";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 41144114;
        name: "Otim Devnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ETH";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["http://devnet.otim.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    245022926: {
        blockExplorers: {
            readonly default: {
                readonly name: "Neonscan";
                readonly url: "https://devnet.neonscan.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 205206112;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 245022926;
        name: "Neon EVM DevNet";
        nativeCurrency: {
            readonly name: "NEON";
            readonly symbol: "NEON";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://devnet.neonevm.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4759: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://testnet.meversescan.io/";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 64371115;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 4759;
        name: "MEVerse Chain Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "MEVerse";
            readonly symbol: "MEV";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.meversetestnet.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    12325: {
        blockExplorers: {
            readonly default: {
                readonly name: "L3X Testnet Explorer";
                readonly url: "https://explorer-testnet.l3x.com";
                readonly apiUrl: "https://explorer-testnet.l3x.com/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 12325;
        name: "L3X Protocol Testnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-testnet.l3x.com"];
                readonly webSocket: readonly ["wss://rpc-testnet.l3x.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    88991: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://exp.testnet.jibchain.net";
                readonly apiUrl: "https://exp.testnet.jibchain.net/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xa1a858ad9041B4741e620355a3F96B3c78e70ecE";
                readonly blockCreated: 32848;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 88991;
        name: "Jibchain Testnet";
        nativeCurrency: {
            readonly name: "tJBC";
            readonly symbol: "tJBC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.testnet.jibchain.net"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1666600000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Harmony Explorer";
                readonly url: "https://explorer.harmony.one";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 24185753;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1666600000;
        name: "Harmony One";
        nativeCurrency: {
            readonly name: "Harmony";
            readonly symbol: "ONE";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://1666600000.rpc.thirdweb.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    15557: {
        blockExplorers: {
            readonly default: {
                readonly name: "EOS EVM Testnet Explorer";
                readonly url: "https://explorer.testnet.evm.eosnetwork.com";
                readonly apiUrl: "https://explorer.testnet.evm.eosnetwork.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 9067940;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 15557;
        name: "EOS EVM Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "EOS";
            readonly symbol: "EOS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.testnet.evm.eosnetwork.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4777: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://testnet-explorer.blackfort.network";
                readonly apiUrl: "https://testnet-explorer.blackfort.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 4777;
        name: "BlackFort Exchange Network Testnet";
        nativeCurrency: {
            readonly name: "BlackFort Testnet Token";
            readonly symbol: "TBXN";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://testnet.blackfort.network/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    200810: {
        blockExplorers: {
            readonly default: {
                readonly name: "Bitlayer(BTR) Scan";
                readonly url: "https://testnet.btrscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 200810;
        name: "Bitlayer Testnet";
        nativeCurrency: {
            readonly name: "Bitcoin";
            readonly symbol: "BTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://testnet-rpc.bitlayer.org"];
                readonly webSocket: readonly ["wss://testnet-ws.bitlayer.org", "wss://testnet-ws.bitlayer-rpc.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    97: {
        blockExplorers: {
            readonly default: {
                readonly name: "BscScan";
                readonly url: "https://testnet.bscscan.com";
                readonly apiUrl: "https://api-testnet.bscscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 17422483;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 97;
        name: "BNB Smart Chain Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "BNB";
            readonly symbol: "tBNB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    199: {
        blockExplorers: {
            readonly default: {
                readonly name: "Bttcscan";
                readonly url: "https://bttcscan.com";
                readonly apiUrl: "https://api.bttcscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 31078552;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 199;
        name: "BitTorrent";
        nativeCurrency: {
            readonly name: "BitTorrent";
            readonly symbol: "BTT";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.bittorrentchain.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "bittorrent-chain-mainnet";
    };
    84531: {
        blockExplorers: {
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
                readonly apiUrl: "https://goerli.basescan.org/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 5: {
                    readonly address: "0x2A35891ff30313CcFa6CE88dcf3858bb075A2298";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1376988;
            };
            readonly portal: {
                readonly 5: {
                    readonly address: "0xe93c8cD0D409341205A592f8c4Ac1A5fe5585cfA";
                };
            };
            readonly l1StandardBridge: {
                readonly 5: {
                    readonly address: "0xfA6D8Ee5BE770F84FC001D098C4bD604Fe01284a";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 84531;
        name: "Base Goerli";
        nativeCurrency: {
            readonly name: "Goerli Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        sourceId: 5;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    3776: {
        blockExplorers: {
            readonly default: {
                readonly name: "Astar zkEVM Explorer";
                readonly url: "https://astar-zkevm.explorer.startale.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 93528;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 3776;
        name: "Astar zkEVM";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-zkevm.astar.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "AstarZkEVM";
    };
    7000: {
        blockExplorers: {
            readonly default: {
                readonly name: "ZetaScan";
                readonly url: "https://zetascan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 1632781;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7000;
        name: "ZetaChain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Zeta";
            readonly symbol: "ZETA";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://zetachain-evm.blockpi.network/v1/rpc/public"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2730: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://xr-sepolia-testnet.explorer.caldera.xyz";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 2730;
        name: "XR Sepolia";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "tXR";
            readonly symbol: "tXR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://xr-sepolia-testnet.rpc.caldera.xyz/http"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1952: {
        blockExplorers: {
            readonly default: {
                readonly name: "OKLink";
                readonly url: "https://www.oklink.com/xlayer-test";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 624344;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1952;
        name: "X1 Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "OKB";
            readonly symbol: "OKB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://xlayertestrpc.okx.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://exp.thaichain.org";
                readonly apiUrl: "https://exp.thaichain.org/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x0DaD6130e832c21719C5CE3bae93454E16A84826";
                readonly blockCreated: 4806386;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7;
        name: "ThaiChain";
        nativeCurrency: {
            readonly name: "TCH";
            readonly symbol: "TCH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.thaichain.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    109: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://shibariumscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x864Bf681ADD6052395188A89101A1B37d3B4C961";
                readonly blockCreated: 265900;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 109;
        name: "Shibarium";
        nativeCurrency: {
            readonly name: "Bone";
            readonly symbol: "BONE";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.shibrpc.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "shibarium";
    };
    3109: {
        blockExplorers: {
            readonly default: {
                readonly name: "blockscout";
                readonly url: "https://svmscan.io";
                readonly apiUrl: "https://svmscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 3109;
        name: "SatoshiVM Alpha Mainnet";
        nativeCurrency: {
            readonly name: "BTC";
            readonly symbol: "BTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://alpha-rpc-node-http.svmscan.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    30: {
        blockExplorers: {
            readonly default: {
                readonly name: "RSK Explorer";
                readonly url: "https://explorer.rsk.co";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 4249540;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 30;
        name: "Rootstock Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Rootstock Bitcoin";
            readonly symbol: "RBTC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://public-node.rsk.co"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "rootstock";
    };
    1285: {
        blockExplorers: {
            readonly default: {
                readonly name: "Moonscan";
                readonly url: "https://moonriver.moonscan.io";
                readonly apiUrl: "https://api-moonriver.moonscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 1597904;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1285;
        name: "Moonriver";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Moonriver";
            readonly symbol: "MOVR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.api.moonriver.moonbeam.network"];
                readonly webSocket: readonly ["wss://wss.api.moonriver.moonbeam.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    571: {
        blockExplorers: {
            readonly default: {
                readonly name: "MetaExplorer";
                readonly url: "https://explorer.metatime.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x0000000000000000000000000000000000003001";
                readonly blockCreated: 0;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 571;
        name: "MetaChain Mainnet";
        nativeCurrency: {
            readonly name: "Metatime Coin";
            readonly symbol: "MTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.metatime.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1337: {
        blockExplorers?: {
            [key: string]: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
            default: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
        } | undefined | undefined;
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1337;
        name: "Localhost";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["http://127.0.0.1:8545"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    42793: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherlink";
                readonly url: "https://explorer.etherlink.com";
            };
        };
        blockTime: 4830;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 33899;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42793;
        name: "Etherlink";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Tez";
            readonly symbol: "XTZ";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://node.mainnet.etherlink.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2000: {
        blockExplorers: {
            readonly default: {
                readonly name: "DogeChainExplorer";
                readonly url: "https://explorer.dogechain.dog";
                readonly apiUrl: "https://explorer.dogechain.dog/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x68a8609a60a008EFA633dfdec592c03B030cC508";
                readonly blockCreated: 25384031;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2000;
        name: "Dogechain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Wrapped Dogecoin";
            readonly symbol: "WDOGE";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.dogechain.dog"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    3737: {
        blockExplorers: {
            readonly default: {
                readonly name: "CrossScan";
                readonly url: "https://scan.crossbell.io";
                readonly apiUrl: "https://scan.crossbell.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 38246031;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 3737;
        name: "Crossbell";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "CSB";
            readonly symbol: "CSB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.crossbell.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    43114: {
        blockExplorers: {
            readonly default: {
                readonly name: "SnowTrace";
                readonly url: "https://snowtrace.io";
                readonly apiUrl: "https://api.snowtrace.io";
            };
        };
        blockTime: 1700;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 11907934;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 43114;
        name: "Avalanche";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Avalanche";
            readonly symbol: "AVAX";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.avax.network/ext/bc/C/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1337803: {
        blockExplorers: {
            readonly default: {
                readonly name: "Beaconchain";
                readonly url: "https://zhejiang.beaconcha.in";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1337803;
        name: "Zhejiang";
        nativeCurrency: {
            readonly name: "Zhejiang Ether";
            readonly symbol: "ZhejETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.zhejiang.ethpandaops.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    888: {
        blockExplorers: {
            readonly default: {
                readonly name: "WanScan";
                readonly url: "https://wanscan.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcDF6A1566e78EB4594c86Fe73Fcdc82429e97fbB";
                readonly blockCreated: 25312390;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 888;
        name: "Wanchain";
        nativeCurrency: {
            readonly name: "WANCHAIN";
            readonly symbol: "WAN";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://gwan-ssl.wandevs.org:56891", "https://gwan2-ssl.wandevs.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    19: {
        blockExplorers: {
            readonly default: {
                readonly name: "Songbird Explorer";
                readonly url: "https://songbird-explorer.flare.network";
                readonly apiUrl: "https://songbird-explorer.flare.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 13382504;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 19;
        name: "Songbird Canary-Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Songbird";
            readonly symbol: "SGB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://songbird-api.flare.network/ext/C/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    23294: {
        blockExplorers: {
            readonly default: {
                readonly name: "Oasis Explorer";
                readonly url: "https://explorer.oasis.io/mainnet/sapphire";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 734531;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 23294;
        name: "Oasis Sapphire";
        nativeCurrency: {
            readonly name: "Sapphire Rose";
            readonly symbol: "ROSE";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sapphire.oasis.io"];
                readonly webSocket: readonly ["wss://sapphire.oasis.io/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "sapphire";
    };
    690: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://explorer.redstone.xyz";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0xC7bCb0e8839a28A1cFadd1CF716de9016CdA51ae";
                    readonly blockCreated: 19578329;
                };
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0xa426A052f657AEEefc298b3B5c35a470e4739d69";
                    readonly blockCreated: 19578337;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0xc473ca7E02af24c129c2eEf51F2aDf0411c1Df69";
                    readonly blockCreated: 19578331;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 690;
        name: "Redstone";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.redstonechain.com"];
                readonly webSocket: readonly ["wss://rpc.redstonechain.com"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    35443: {
        blockExplorers: {
            readonly default: {
                readonly name: "Q Testnet Explorer";
                readonly url: "https://explorer.qtestnet.org";
                readonly apiUrl: "https://explorer.qtestnet.org/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 35443;
        name: "Q Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Q";
            readonly symbol: "Q";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.qtestnet.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    35441: {
        blockExplorers: {
            readonly default: {
                readonly name: "Q Mainnet Explorer";
                readonly url: "https://explorer.q.org";
                readonly apiUrl: "https://explorer.q.org/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 35441;
        name: "Q Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Q";
            readonly symbol: "Q";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.q.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    22222: {
        blockExplorers: {
            readonly default: {
                readonly name: "NautScan";
                readonly url: "https://nautscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 22222;
        name: "Nautilus Mainnet";
        nativeCurrency: {
            readonly name: "ZBC";
            readonly symbol: "ZBC";
            readonly decimals: 9;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.nautilus.nautchain.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    314: {
        blockExplorers: {
            readonly default: {
                readonly name: "Filfox";
                readonly url: "https://filfox.info/en";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 3328594;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 314;
        name: "Filecoin Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "filecoin";
            readonly symbol: "FIL";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.node.glif.io/rpc/v1"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2021: {
        blockExplorers: {
            readonly default: {
                readonly name: "Edgscan by Bharathcoorg";
                readonly url: "https://edgscan.live";
                readonly apiUrl: "https://edgscan.live/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 18117872;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2021;
        name: "Edgeware EdgeEVM Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Edgeware";
            readonly symbol: "EDG";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://edgeware-evm.jelliedowl.net"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2026: {
        blockExplorers: {
            readonly default: {
                readonly name: "Edgeless Explorer";
                readonly url: "https://explorer.edgeless.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 2026;
        name: "Edgeless Network";
        nativeCurrency: {
            readonly name: "Edgeless Wrapped ETH";
            readonly symbol: "EwETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.edgeless.network/http"];
                readonly webSocket: readonly ["wss://rpc.edgeless.network/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    46: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://explorer.darwinia.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 69420;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 46;
        name: "Darwinia Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "RING";
            readonly symbol: "RING";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.darwinia.network"];
                readonly webSocket: readonly ["wss://rpc.darwinia.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    888888888: {
        blockExplorers: {
            readonly default: {
                readonly name: "Ancient8 explorer";
                readonly url: "https://scan.ancient8.gg";
                readonly apiUrl: "https://scan.ancient8.gg/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0xB09DC08428C8b4EFB4ff9C0827386CDF34277996";
                };
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x639F2AECE398Aa76b07e59eF6abe2cFe32bacb68";
                    readonly blockCreated: 19070571;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0xd5e3eDf5b68135D559D572E26bF863FBC1950033";
                    readonly blockCreated: 19070571;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 888888888;
        name: "Ancient8";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.ancient8.gg"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    32769: {
        blockExplorers: {
            readonly default: {
                readonly name: "Ethernal";
                readonly url: "https://evmx.zilliqa.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 32769;
        name: "Zilliqa";
        nativeCurrency: {
            readonly name: "Zilliqa";
            readonly symbol: "ZIL";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.zilliqa.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "zilliqa";
    };
    100009: {
        blockExplorers: {
            readonly default: {
                readonly name: "Vechain Explorer";
                readonly url: "https://explore.vechain.org";
            };
            readonly vechainStats: {
                readonly name: "Vechain Stats";
                readonly url: "https://vechainstats.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 100009;
        name: "Vechain";
        nativeCurrency: {
            readonly name: "VeChain";
            readonly symbol: "VET";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.vechain.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    57: {
        blockExplorers: {
            readonly default: {
                readonly name: "SyscoinExplorer";
                readonly url: "https://explorer.syscoin.org";
                readonly apiUrl: "https://explorer.syscoin.org/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 287139;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 57;
        name: "Syscoin Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Syscoin";
            readonly symbol: "SYS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.syscoin.org"];
                readonly webSocket: readonly ["wss://rpc.syscoin.org/wss"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    105105: {
        blockExplorers: {
            readonly default: {
                readonly name: "Stratis Explorer";
                readonly url: "https://explorer.stratisevm.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 105105;
        name: "Stratis Mainnet";
        nativeCurrency: {
            readonly name: "Stratis";
            readonly symbol: "STRAX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.stratisevm.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "stratis";
    };
    148: {
        blockExplorers: {
            readonly default: {
                readonly name: "Shimmer Network Explorer";
                readonly url: "https://explorer.evm.shimmer.network";
                readonly apiUrl: "https://explorer.evm.shimmer.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 148;
        name: "Shimmer";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Shimmer";
            readonly symbol: "SMR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://json-rpc.evm.shimmer.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "shimmer";
    };
    13381: {
        blockExplorers: {
            readonly default: {
                readonly name: "Phoenixplorer";
                readonly url: "https://phoenixplorer.com";
                readonly apiUrl: "https://phoenixplorer.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x498cF757a575cFF2c2Ed9f532f56Efa797f86442";
                readonly blockCreated: 5620192;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 13381;
        name: "Phoenix Blockchain";
        nativeCurrency: {
            readonly name: "Phoenix";
            readonly symbol: "PHX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.phoenixplorer.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    240: {
        blockExplorers: {
            readonly default: {
                readonly name: "NexilixScan";
                readonly url: "https://scan.nexilix.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x58381c8e2BF9d0C2C4259cA14BdA9Afe02831244";
                readonly blockCreated: 74448;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 240;
        name: "Nexilix Smart Chain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Nexilix";
            readonly symbol: "NEXILIX";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpcurl.pos.nexilix.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1750: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://explorer.metall2.com";
                readonly apiUrl: "https://explorer.metall2.com/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x3B1F7aDa0Fcc26B13515af752Dd07fB1CAc11426";
                };
            };
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 0;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x3F37aBdE2C6b5B2ed6F8045787Df1ED1E3753956";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x6d0f65D59b55B0FEC5d2d15365154DcADC140BF3";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1750;
        name: "Metal L2";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.metall2.com"];
                readonly webSocket: readonly ["wss://rpc.metall2.com"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    595: {
        blockExplorers: {
            readonly default: {
                readonly name: "Mandala Blockscout";
                readonly url: "https://blockscout.mandala.aca-staging.network";
                readonly apiUrl: "https://blockscout.mandala.aca-staging.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 595;
        name: "Mandala TC9";
        nativeCurrency: {
            readonly name: "Mandala";
            readonly symbol: "mACA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth-rpc-tc9.aca-staging.network"];
                readonly webSocket: readonly ["wss://eth-rpc-tc9.aca-staging.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "mandala";
    };
    17000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://holesky.etherscan.io";
                readonly apiUrl: "https://api-holesky.etherscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 77;
            };
            readonly ensUniversalResolver: {
                readonly address: "0xeeeeeeee14d718c2b47d9923deab1335e144eeee";
                readonly blockCreated: 4295055;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 17000;
        name: "Holesky";
        nativeCurrency: {
            readonly name: "Holesky Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://ethereum-holesky-rpc.publicnode.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    31337: {
        blockExplorers?: {
            [key: string]: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
            default: {
                name: string;
                url: string;
                apiUrl?: string | undefined;
            };
        } | undefined | undefined;
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 31337;
        name: "Hardhat";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["http://127.0.0.1:8545"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    252: {
        blockExplorers: {
            readonly default: {
                readonly name: "fraxscan";
                readonly url: "https://fraxscan.com";
                readonly apiUrl: "https://api.fraxscan.com/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x66CC916Ed5C6C2FA97014f7D1cD141528Ae171e4";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x36cb65c1967A0Fb0EEE11569C51C2f2aA1Ca6f6D";
                    readonly blockCreated: 19135323;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x34C0bD5877A5Ee7099D0f5688D65F4bB9158BDE2";
                    readonly blockCreated: 19135323;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 252;
        name: "Fraxtal";
        nativeCurrency: {
            readonly name: "Frax";
            readonly symbol: "FRAX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.frax.com"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1116: {
        blockExplorers: {
            readonly default: {
                readonly name: "CoreDao";
                readonly url: "https://scan.coredao.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 11907934;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1116;
        name: "Core Dao";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Core";
            readonly symbol: "CORE";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.coredao.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    61: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://blockscout.com/etc/mainnet";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 61;
        name: "Ethereum Classic";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ETC";
            readonly symbol: "ETC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://etc.rivet.link"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    5165: {
        blockExplorers: {
            readonly default: {
                readonly name: "Ftnscan";
                readonly url: "https://www.ftnscan.com";
                readonly apiUrl: "https://www.ftnscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 5165;
        name: "Bahamut";
        nativeCurrency: {
            readonly name: "Fasttoken";
            readonly symbol: "FTN";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc1.bahamut.io", "https://bahamut-rpc.publicnode.com", "https://rpc2.bahamut.io"];
                readonly webSocket: readonly ["wss://ws1.sahara.bahamutchain.com", "wss://bahamut-rpc.publicnode.com", "wss://ws2.sahara.bahamutchain.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "bahamut";
    };
    205205: {
        blockExplorers: {
            readonly default: {
                readonly name: "Auroria Testnet Explorer";
                readonly url: "https://auroria.explorer.stratisevm.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 205205;
        name: "Auroria Testnet";
        nativeCurrency: {
            readonly name: "Auroria Stratis";
            readonly symbol: "tSTRAX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://auroria.rpc.stratisevm.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "auroria";
    };
    324: {
        blockExplorers: {
            readonly default: {
                readonly name: "ZKsync Explorer";
                readonly url: "https://explorer.zksync.io/";
                readonly apiUrl: "https://block-explorer-api.mainnet.zksync.io/api";
            };
        };
        blockTime: 200;
        contracts: {
            readonly multicall3: {
                readonly address: "0xF9cda624FBC7e059355ce98a31693d299FACd963";
                readonly blockCreated: 3908235;
            };
            readonly erc6492Verifier: {
                readonly address: "0xfB688330379976DA81eB64Fe4BF50d7401763B9C";
                readonly blockCreated: 45659388;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 324;
        name: "ZKsync Era";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.era.zksync.io"];
                readonly webSocket: readonly ["wss://mainnet.era.zksync.io/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom: {
            readonly getEip712Domain: import("viem/zksync").EIP712DomainFn<import("viem/chains").ZkSyncTransactionSerializable, import("viem/chains").ZkSyncEIP712TransactionSignable>;
        };
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").ZkSyncRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").ZkSyncTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                    l1BatchNumber: bigint | null;
                    l1BatchTimestamp: bigint | null;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").ZkSyncRpcTransaction, action?: string | undefined) => ({
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    type: "priority";
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    type: "eip712" | "priority";
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").ZkSyncRpcTransactionReceipt, action?: string | undefined) => {
                    type: import("viem/chains").ZkSyncTransactionType;
                    contractAddress: import("viem").Address | null | undefined;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    transactionIndex: number;
                    status: "success" | "reverted";
                    transactionHash: import("viem").Hash;
                    logsBloom: import("viem").Hex;
                    blobGasUsed?: bigint | undefined;
                    gasUsed: bigint;
                    blobGasPrice?: bigint | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    root?: `0x${string}` | undefined;
                    l1BatchNumber: bigint | null;
                    l1BatchTxIndex: bigint | null;
                    logs: import("viem/chains").ZkSyncLog[];
                    l2ToL1Logs: import("viem/chains").ZkSyncL2ToL1Log[];
                } & {};
                type: "transactionReceipt";
            };
            readonly transactionRequest: {
                exclude: ("paymaster" | "gasPerPubdata" | "factoryDeps" | "paymasterInput" | "customSignature")[] | undefined;
                format: (args: import("viem/chains").ZkSyncTransactionRequest, action?: string | undefined) => ({
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x0" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    accessList?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x1" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x2" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs?: readonly `0x${string}`[] | readonly import("viem").ByteArray[] | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    kzg?: undefined;
                    authorizationList?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs: readonly import("viem").Hex[] | readonly import("viem").ByteArray[];
                    blobVersionedHashes?: readonly `0x${string}`[] | undefined;
                    kzg?: import("viem").Kzg | undefined;
                    authorizationList?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    type?: "0x4" | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    authorizationList?: import("viem").RpcAuthorizationList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    eip712Meta?: undefined | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type: "0xff" | "0x71";
                    value?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    eip712Meta: import("viem/chains").ZkSyncEip712Meta;
                }) & {
                    paymaster: never;
                    gasPerPubdata: never;
                    factoryDeps: never;
                    paymasterInput: never;
                    customSignature: never;
                };
                type: "transactionRequest";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/zksync").serializeTransaction;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "zksync-era";
    };
    42766: {
        blockExplorers: {
            readonly default: {
                readonly name: "zkFair Explorer";
                readonly url: "https://scan.zkfair.io";
                readonly apiUrl: "https://scan.zkfair.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 6090959;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42766;
        name: "ZKFair Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "USD Coin";
            readonly symbol: "USDC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.zkfair.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "zkfair-mainnet";
    };
    196: {
        blockExplorers: {
            readonly default: {
                readonly name: "OKLink";
                readonly url: "https://www.oklink.com/xlayer";
                readonly apiUrl: "https://www.oklink.com/api/v5/explorer/xlayer/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 47416;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 196;
        name: "X Layer Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "OKB";
            readonly symbol: "OKB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://xlayerrpc.okx.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    18233: {
        blockExplorers: {
            readonly default: {
                readonly name: "Unreal Explorer";
                readonly url: "https://unreal.blockscout.com";
                readonly apiUrl: "https://unreal.blockscout.com/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x8b6B0e60D8CD84898Ea8b981065A12F876eA5677";
                readonly blockCreated: 1745;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 18233;
        name: "Unreal";
        nativeCurrency: {
            readonly name: "reETH";
            readonly decimals: 18;
            readonly symbol: "reETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.unreal-orbit.gelato.digital"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    841: {
        blockExplorers: {
            readonly default: {
                readonly name: "Taraxa Explorer";
                readonly url: "https://explorer.mainnet.taraxa.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 841;
        name: "Taraxa Mainnet";
        nativeCurrency: {
            readonly name: "Tara";
            readonly symbol: "TARA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.mainnet.taraxa.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    534352: {
        blockExplorers: {
            readonly default: {
                readonly name: "Scrollscan";
                readonly url: "https://scrollscan.com";
                readonly apiUrl: "https://api.scrollscan.com/api";
            };
        };
        blockTime: 3000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 534352;
        name: "Scroll";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.scroll.io"];
                readonly webSocket: readonly ["wss://wss-rpc.scroll.io/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    570: {
        blockExplorers: {
            readonly default: {
                readonly name: "RolluxExplorer";
                readonly url: "https://explorer.rollux.com";
                readonly apiUrl: "https://explorer.rollux.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 119222;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 570;
        name: "Rollux Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Syscoin";
            readonly symbol: "SYS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.rollux.com"];
                readonly webSocket: readonly ["wss://rpc.rollux.com/wss"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    242: {
        blockExplorers: {
            readonly default: {
                readonly name: "Plgscan";
                readonly url: "https://www.plgscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x0989576160f2e7092908BB9479631b901060b6e4";
                readonly blockCreated: 204489;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 242;
        name: "Plinga";
        nativeCurrency: {
            readonly name: "Plinga";
            readonly symbol: "PLINGA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpcurl.mainnet.plgchain.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4200: {
        blockExplorers: {
            readonly default: {
                readonly name: "blockscout";
                readonly url: "https://scan.merlinchain.io";
                readonly apiUrl: "https://scan.merlinchain.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 4200;
        name: "Merlin";
        nativeCurrency: {
            readonly name: "BTC";
            readonly symbol: "BTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.merlinchain.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    5000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Mantle Explorer";
                readonly url: "https://mantlescan.xyz/";
                readonly apiUrl: "https://api.mantlescan.xyz/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 304717;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 5000;
        name: "Mantle";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "MNT";
            readonly symbol: "MNT";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.mantle.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    8217: {
        blockExplorers: {
            readonly default: {
                readonly name: "KlaytnScope";
                readonly url: "https://scope.klaytn.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 96002415;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 8217;
        name: "Klaytn";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Klaytn";
            readonly symbol: "KLAY";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://public-en-cypress.klaytn.net"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    686: {
        blockExplorers: {
            readonly default: {
                readonly name: "Karura Blockscout";
                readonly url: "https://blockscout.karura.network";
                readonly apiUrl: "https://blockscout.karura.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 686;
        name: "Karura";
        nativeCurrency: {
            readonly name: "Karura";
            readonly symbol: "KAR";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth-rpc-karura.aca-api.network"];
                readonly webSocket: readonly ["wss://eth-rpc-karura.aca-api.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "karura";
    };
    295: {
        blockExplorers: {
            readonly default: {
                readonly name: "Hashscan";
                readonly url: "https://hashscan.io/mainnet";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 295;
        name: "Hedera Mainnet";
        nativeCurrency: {
            readonly symbol: "HBAR";
            readonly name: "HBAR";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.hashio.io/api"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "hedera-mainnet";
    };
    5: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://goerli.etherscan.io";
                readonly apiUrl: "https://api-goerli.etherscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly ensRegistry: {
                readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
            };
            readonly ensUniversalResolver: {
                readonly address: "0xfc4AC75C46C914aF5892d6d3eFFcebD7917293F1";
                readonly blockCreated: 10339206;
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 6507670;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 5;
        name: "Goerli";
        nativeCurrency: {
            readonly name: "Goerli Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://5.rpc.thirdweb.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    100: {
        blockExplorers: {
            readonly default: {
                readonly name: "Gnosisscan";
                readonly url: "https://gnosisscan.io";
                readonly apiUrl: "https://api.gnosisscan.io/api";
            };
        };
        blockTime: 5000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 21022491;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 100;
        name: "Gnosis";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "xDAI";
            readonly symbol: "XDAI";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.gnosischain.com"];
                readonly webSocket: readonly ["wss://rpc.gnosischain.com/wss"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    250: {
        blockExplorers: {
            readonly default: {
                readonly name: "FTMScan";
                readonly url: "https://ftmscan.com";
                readonly apiUrl: "https://api.ftmscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 33001987;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 250;
        name: "Fantom";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Fantom";
            readonly symbol: "FTM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://250.rpc.thirdweb.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2716446429837000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Dchain Explorer";
                readonly url: "https://dchain-2716446429837000-1.sagaexplorer.io";
                readonly apiUrl: "https://api-dchain-2716446429837000-1.sagaexplorer.io/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2716446429837000;
        name: "Dchain";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://dchain-2716446429837000-1.jsonrpc.sagarpc.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    25: {
        blockExplorers: {
            readonly default: {
                readonly name: "Cronos Explorer";
                readonly url: "https://explorer.cronos.org";
                readonly apiUrl: "https://explorer-api.cronos.org/mainnet/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 1963112;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 25;
        name: "Cronos Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Cronos";
            readonly symbol: "CRO";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm.cronos.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    88888: {
        blockExplorers: {
            readonly default: {
                readonly name: "Chiliz Explorer";
                readonly url: "https://scan.chiliz.com";
                readonly apiUrl: "https://scan.chiliz.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 8080847;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 88888;
        name: "Chiliz Chain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "CHZ";
            readonly symbol: "CHZ";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.chiliz.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "chiliz-chain";
    };
    1039: {
        blockExplorers: {
            readonly default: {
                readonly name: "BronoScan";
                readonly url: "https://broscan.bronos.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1039;
        name: "Bronos";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "BRO";
            readonly symbol: "BRO";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm.bronos.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    96: {
        blockExplorers: {
            readonly default: {
                readonly name: "KUB Chain Mainnet Explorer";
                readonly url: "https://www.bkcscan.com";
                readonly apiUrl: "https://www.bkcscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 96;
        name: "KUB Mainnet";
        nativeCurrency: {
            readonly name: "KUB Coin";
            readonly symbol: "KUB";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.bitkubchain.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1313161554: {
        blockExplorers: {
            readonly default: {
                readonly name: "Aurorascan";
                readonly url: "https://aurorascan.dev";
                readonly apiUrl: "https://aurorascan.dev/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 62907816;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1313161554;
        name: "Aurora";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.aurora.dev"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1111: {
        blockExplorers: {
            readonly default: {
                readonly name: "wemixExplorer";
                readonly url: "https://explorer.wemix.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1111;
        name: "WEMIX";
        nativeCurrency: {
            readonly name: "WEMIX";
            readonly symbol: "WEMIX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.wemix.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "wemix-mainnet";
    };
    1559: {
        blockExplorers: {
            readonly default: {
                readonly name: "TenetScan Mainnet";
                readonly url: "https://tenetscan.io";
                readonly apiUrl: "https://tenetscan.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 1559;
        name: "Tenet";
        nativeCurrency: {
            readonly name: "TENET";
            readonly symbol: "TENET";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.tenet.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "tenet-mainnet";
    };
    167000: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://taikoscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 11269;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 167000;
        name: "Taiko Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.mainnet.taiko.xyz"];
                readonly webSocket: readonly ["wss://ws.mainnet.taiko.xyz"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    88882: {
        blockExplorers: {
            readonly default: {
                readonly name: "Chiliz Explorer";
                readonly url: "http://spicy-explorer.chiliz.com";
                readonly apiUrl: "http://spicy-explorer.chiliz.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 88882;
        name: "Chiliz Spicy Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "CHZ";
            readonly symbol: "CHZ";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://spicy-rpc.chiliz.com", "https://chiliz-spicy-rpc.publicnode.com"];
                readonly webSocket: readonly ["wss://spicy-rpc-ws.chiliz.com", "wss://chiliz-spicy-rpc.publicnode.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "chiliz-spicy-Testnet";
    };
    2020: {
        blockExplorers: {
            readonly default: {
                readonly name: "Ronin Explorer";
                readonly url: "https://app.roninchain.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 26023535;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2020;
        name: "Ronin";
        nativeCurrency: {
            readonly name: "RON";
            readonly symbol: "RON";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.roninchain.com/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    204: {
        blockExplorers: {
            readonly default: {
                readonly name: "opBNB (BSCScan)";
                readonly url: "https://opbnb.bscscan.com";
                readonly apiUrl: "https://api-opbnb.bscscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 512881;
            };
            readonly l2OutputOracle: {
                readonly 56: {
                    readonly address: "0x153CAB79f4767E2ff862C94aa49573294B13D169";
                };
            };
            readonly portal: {
                readonly 56: {
                    readonly address: "0x1876EA7702C0ad0C6A2ae6036DE7733edfBca519";
                };
            };
            readonly l1StandardBridge: {
                readonly 56: {
                    readonly address: "0xF05F0e4362859c3331Cb9395CBC201E3Fa6757Ea";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 204;
        name: "opBNB";
        nativeCurrency: {
            readonly name: "BNB";
            readonly symbol: "BNB";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://opbnb-mainnet-rpc.bnbchain.org"];
            };
        };
        sourceId: 56;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    248: {
        blockExplorers: {
            readonly default: {
                readonly name: "OasysScan";
                readonly url: "https://scan.oasys.games";
                readonly apiUrl: "https://scan.oasys.games/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 248;
        name: "Oasys";
        nativeCurrency: {
            readonly name: "Oasys";
            readonly symbol: "OAS";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.mainnet.oasys.games"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1088: {
        blockExplorers: {
            readonly default: {
                readonly name: "Metis Explorer";
                readonly url: "https://explorer.metis.io";
                readonly apiUrl: "https://api.routescan.io/v2/network/mainnet/evm/1088/etherscan/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 2338552;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1088;
        name: "Metis";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Metis";
            readonly symbol: "METIS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://metis.rpc.hypersync.xyz", "https://metis-pokt.nodies.app", "https://api.blockeden.xyz/metis/67nCBdZQSH9z3YqDDjdm", "https://metis-andromeda.rpc.thirdweb.com", "https://metis-andromeda.gateway.tenderly.co", "https://metis.api.onfinality.io/public", "https://andromeda.metis.io/?owner=1088", "https://metis-mainnet.public.blastapi.io"];
                readonly webSocket: readonly ["wss://metis-rpc.publicnode.com", "wss://metis.drpc.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    82: {
        blockExplorers: {
            readonly default: {
                readonly name: "MeterScan";
                readonly url: "https://scan.meter.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 82;
        name: "Meter";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "MTR";
            readonly symbol: "MTR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.meter.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    169: {
        blockExplorers: {
            readonly default: {
                readonly name: "Manta Explorer";
                readonly url: "https://pacific-explorer.manta.network";
                readonly apiUrl: "https://pacific-explorer.manta.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 332890;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 169;
        name: "Manta Pacific Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ETH";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://pacific-rpc.manta.network/http"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "manta";
    };
    721: {
        blockExplorers: {
            readonly default: {
                readonly name: "Lycan Explorer";
                readonly url: "https://explorer.lycanchain.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 721;
        name: "Lycan";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Lycan";
            readonly symbol: "LYC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.lycanchain.com", "https://us-east.lycanchain.com", "https://us-west.lycanchain.com", "https://eu-north.lycanchain.com", "https://eu-west.lycanchain.com", "https://asia-southeast.lycanchain.com"];
                readonly webSocket: readonly ["wss://rpc.lycanchain.com", "wss://us-east.lycanchain.com", "wss://us-west.lycanchain.com", "wss://eu-north.lycanchain.com", "wss://eu-west.lycanchain.com", "wss://asia-southeast.lycanchain.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    42: {
        blockExplorers: {
            readonly default: {
                readonly name: "LUKSO Mainnet Explorer";
                readonly url: "https://explorer.execution.mainnet.lukso.network";
                readonly apiUrl: "https://api.explorer.execution.mainnet.lukso.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 468183;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42;
        name: "LUKSO";
        nativeCurrency: {
            readonly name: "LUKSO";
            readonly symbol: "LYX";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.mainnet.lukso.network"];
                readonly webSocket: readonly ["wss://ws-rpc.mainnet.lukso.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "lukso";
    };
    59144: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://lineascan.build";
                readonly apiUrl: "https://api.lineascan.build/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 42;
            };
            readonly ensRegistry: {
                readonly address: "0x50130b669B28C339991d8676FA73CF122a121267";
                readonly blockCreated: 6682888;
            };
            readonly ensUniversalResolver: {
                readonly address: "0x4D41762915F83c76EcaF6776d9b08076aA32b492";
                readonly blockCreated: 22222151;
            };
        };
        ensTlds: readonly [".linea.eth"];
        id: 59144;
        name: "Linea Mainnet";
        nativeCurrency: {
            readonly name: "Linea Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.linea.build"];
                readonly webSocket: readonly ["wss://rpc.linea.build"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees: {
            readonly estimateFeesPerGas: ({ client, multiply, request, type, }: Parameters<import("viem").ChainEstimateFeesPerGasFn>[0]) => ReturnType<import("viem").ChainEstimateFeesPerGasFn>;
            readonly maxPriorityFeePerGas: ({ block, client, request }: import("viem").ChainFeesFnParameters<import("viem").ChainFormatters | undefined>) => Promise<bigint | null>;
        };
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    255: {
        blockExplorers: {
            readonly default: {
                readonly name: "Kroma Explorer";
                readonly url: "https://blockscout.kroma.network";
                readonly apiUrl: "https://blockscout.kroma.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 16054868;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 255;
        name: "Kroma";
        nativeCurrency: {
            readonly name: "ETH";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.kroma.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4689: {
        blockExplorers: {
            readonly default: {
                readonly name: "IoTeXScan";
                readonly url: "https://iotexscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 22163670;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 4689;
        name: "IoTeX";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "IoTeX";
            readonly symbol: "IOTX";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://babel-api.mainnet.iotex.io"];
                readonly webSocket: readonly ["wss://babel-api.mainnet.iotex.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    2525: {
        blockExplorers: {
            readonly default: {
                readonly name: "inEVM Explorer";
                readonly url: "https://inevm.calderaexplorer.xyz";
                readonly apiUrl: "https://inevm.calderaexplorer.xyz/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 118606;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2525;
        name: "inEVM Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Injective";
            readonly symbol: "INJ";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.rpc.inevm.com/http"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    14: {
        blockExplorers: {
            readonly default: {
                readonly name: "Flare Explorer";
                readonly url: "https://flare-explorer.flare.network";
                readonly apiUrl: "https://flare-explorer.flare.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 3002461;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 14;
        name: "Flare Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Flare";
            readonly symbol: "FLR";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://flare-api.flare.network/ext/C/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    9001: {
        blockExplorers: {
            readonly default: {
                readonly name: "Evmos Block Explorer";
                readonly url: "https://escan.live";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 9001;
        name: "Evmos";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Evmos";
            readonly symbol: "EVMOS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth.bd.evmos.org:8545"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    666666666: {
        blockExplorers: {
            readonly default: {
                readonly name: "Degen Chain Explorer";
                readonly url: "https://explorer.degen.tips";
                readonly apiUrl: "https://explorer.degen.tips/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 666666666;
        name: "Degen";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Degen";
            readonly symbol: "DEGEN";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.degen.tips"];
                readonly webSocket: readonly ["wss://rpc.degen.tips"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7560: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://cyberscan.co";
                readonly apiUrl: "https://cyberscan.co/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 0;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7560;
        name: "Cyber";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://cyber.alt.technology"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7700: {
        blockExplorers: {
            readonly default: {
                readonly name: "Tuber.Build (Blockscout)";
                readonly url: "https://tuber.build";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 2905789;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7700;
        name: "Canto";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Canto";
            readonly symbol: "CANTO";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://canto.gravitychain.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    81457: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blastscan";
                readonly url: "https://blastscan.io";
                readonly apiUrl: "https://api.blastscan.io/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 212929;
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x826D1B0D4111Ad9146Eb8941D7Ca2B6a44215c76";
                    readonly blockCreated: 19300358;
                };
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x0Ec68c5B10F21EFFb74f2A5C61DFe6b08C0Db6Cb";
                    readonly blockCreated: 19300357;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x697402166Fbf2F22E970df8a6486Ef171dbfc524";
                    readonly blockCreated: 19300360;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 81457;
        name: "Blast";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.blast.io"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    592: {
        blockExplorers: {
            readonly default: {
                readonly name: "Astar Subscan";
                readonly url: "https://astar.subscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 761794;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 592;
        name: "Astar";
        nativeCurrency: {
            readonly name: "Astar";
            readonly symbol: "ASTR";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://astar.api.onfinality.io/public"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "astar-mainnet";
    };
    787: {
        blockExplorers: {
            readonly default: {
                readonly name: "Acala Blockscout";
                readonly url: "https://blockscout.acala.network";
                readonly apiUrl: "https://blockscout.acala.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 787;
        name: "Acala";
        nativeCurrency: {
            readonly name: "Acala";
            readonly symbol: "ACA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eth-rpc-acala.aca-api.network"];
                readonly webSocket: readonly ["wss://eth-rpc-acala.aca-api.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "acala";
    };
    12553: {
        blockExplorers: {
            readonly default: {
                readonly name: "RSS3 VSL Mainnet Scan";
                readonly url: "https://scan.rss3.io";
                readonly apiUrl: "https://scan.rss3.io/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0xE6f24d2C32B3109B18ed33cF08eFb490b1e09C10";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14193;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x6A12432491bbbE8d3babf75F759766774C778Db4";
                    readonly blockCreated: 19387057;
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x4cbab69108Aa72151EDa5A3c164eA86845f18438";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 12553;
        name: "RSS3 VSL Mainnet";
        nativeCurrency: {
            readonly name: "RSS3";
            readonly symbol: "RSS3";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.rss3.io"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7668: {
        blockExplorers: {
            readonly default: {
                readonly name: "Rootscan";
                readonly url: "https://rootscan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xc9C2E2429AeC354916c476B30d729deDdC94988d";
                readonly blockCreated: 9218338;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7668;
        name: "The Root Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "XRP";
            readonly symbol: "XRP";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://root.rootnet.live/archive"];
                readonly webSocket: readonly ["wss://root.rootnet.live/archive/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    111188: {
        blockExplorers: {
            readonly default: {
                readonly name: "re.al Explorer";
                readonly url: "https://explorer.re.al";
                readonly apiUrl: "https://explorer.re.al/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 695;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 111188;
        name: "re.al";
        nativeCurrency: {
            readonly name: "reETH";
            readonly decimals: 18;
            readonly symbol: "reETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.realforreal.gelato.digital"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    11297108109: {
        blockExplorers: {
            readonly default: {
                readonly name: "Chainlens";
                readonly url: "https://palm.chainlens.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 15429248;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 11297108109;
        name: "Palm";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "PALM";
            readonly symbol: "PALM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://palm-mainnet.public.blastapi.io"];
                readonly webSocket: readonly ["wss://palm-mainnet.public.blastapi.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4242: {
        blockExplorers: {
            readonly default: {
                readonly name: "NexiScan";
                readonly url: "https://www.nexiscan.com";
                readonly apiUrl: "https://www.nexiscan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x0277A46Cc69A57eE3A6C8c158bA874832F718B8E";
                readonly blockCreated: 25770160;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 4242;
        name: "Nexi";
        nativeCurrency: {
            readonly name: "Nexi";
            readonly symbol: "NEXI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.chain.nexi.technology"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    34443: {
        blockExplorers: {
            readonly default: {
                readonly name: "Modescan";
                readonly url: "https://modescan.io";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 1: {
                    readonly address: "0x6f13EFadABD9269D6cEAd22b448d434A1f1B433E";
                };
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 2465882;
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x4317ba146D4933D889518a3e5E11Fe7a53199b04";
                };
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x8B34b14c7c7123459Cf3076b8Cb929BE097d0C07";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x735aDBbE72226BD52e818E7181953f42E3b0FF21";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 34443;
        name: "Mode Mainnet";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.mode.network"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    957: {
        blockExplorers: {
            readonly default: {
                readonly name: "Lyra Explorer";
                readonly url: "https://explorer.lyra.finance";
                readonly apiUrl: "https://explorer.lyra.finance/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 1935198;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 957;
        name: "Lyra Chain";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.lyra.finance"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1135: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://blockscout.lisk.com";
                readonly apiUrl: "https://blockscout.lisk.com/api";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly disputeGameFactory: {
                readonly 1: {
                    readonly address: "0x0CF7D3706a27CCE2017aEB11E8a9c8b5388c282C";
                };
            };
            readonly multicall3: {
                readonly address: "0xA9d71E1dd7ca26F26e656E66d6AA81ed7f745bf0";
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x113cB99283AF242Da0A0C54347667edF531Aa7d6";
                };
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x26dB93F8b8b4f7016240af62F7730979d353f9A7";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0x2658723Bf70c7667De6B25F99fcce13A16D25d08";
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1135;
        name: "Lisk";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.api.lisk.com"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "lisk";
    };
    2222: {
        blockExplorers: {
            readonly default: {
                readonly name: "Kava EVM Explorer";
                readonly url: "https://kavascan.com";
                readonly apiUrl: "https://kavascan.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 3661165;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 2222;
        name: "Kava EVM";
        nativeCurrency: {
            readonly name: "Kava";
            readonly symbol: "KAVA";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm.kava.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "kava-mainnet";
    };
    1663: {
        blockExplorers: {
            readonly default: {
                readonly name: "Gobi Explorer";
                readonly url: "https://gobi-explorer.horizen.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {};
        ensTlds?: readonly string[] | undefined;
        id: 1663;
        name: "Horizen Gobi Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Test ZEN";
            readonly symbol: "tZEN";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://gobi-testnet.horizenlabs.io/ethv1"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    122: {
        blockExplorers: {
            readonly default: {
                readonly name: "Fuse Explorer";
                readonly url: "https://explorer.fuse.io";
                readonly apiUrl: "https://explorer.fuse.io/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 16146628;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 122;
        name: "Fuse";
        nativeCurrency: {
            readonly name: "Fuse";
            readonly symbol: "FUSE";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.fuse.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    12306: {
        blockExplorers: {
            readonly default: {
                readonly name: "FiboScan";
                readonly url: "https://scan.fibochain.org";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 12306;
        name: "Fibo Chain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "fibo";
            readonly symbol: "FIBO";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://network.hzroc.art"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    44: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://crab-scan.darwinia.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 3032593;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 44;
        name: "Crab Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Crab Network Native Token";
            readonly symbol: "CRAB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://crab-rpc.darwinia.network"];
                readonly webSocket: readonly ["wss://crab-rpc.darwinia.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    42220: {
        blockExplorers: {
            readonly default: {
                readonly name: "Celo Explorer";
                readonly url: "https://celoscan.io";
                readonly apiUrl: "https://api.celoscan.io/api";
            };
        };
        blockTime: 1000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 13112599;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 42220;
        name: "Celo";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "CELO";
            readonly symbol: "CELO";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://forno.celo.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees: import("viem").ChainFees<{
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").CeloTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloRpcTransaction, action?: string | undefined) => ({
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    accessList: import("viem").AccessList;
                    chainId: number;
                    feeCurrency: import("viem").Address | null;
                    gatewayFee: bigint | null;
                    gatewayFeeRecipient: import("viem").Address | null;
                    type: "cip42";
                    blobVersionedHashes?: undefined;
                    authorizationList?: undefined;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    accessList: import("viem").AccessList;
                    chainId: number;
                    feeCurrency: import("viem").Address | null;
                    type: "cip64";
                    blobVersionedHashes?: undefined;
                    authorizationList?: undefined;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                    blobVersionedHashes?: undefined;
                    accessList?: undefined;
                    authorizationList?: undefined;
                    chainId?: undefined;
                    feeCurrency?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionRequest: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloTransactionRequest, action?: string | undefined) => ({
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x0" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    accessList?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x1" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x2" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs?: readonly `0x${string}`[] | readonly import("viem").ByteArray[] | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    kzg?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs: readonly import("viem").Hex[] | readonly import("viem").ByteArray[];
                    blobVersionedHashes?: readonly `0x${string}`[] | undefined;
                    kzg?: import("viem").Kzg | undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x4" | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    authorizationList?: import("viem").RpcAuthorizationList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x7b" | undefined;
                    value?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    feeCurrency?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                }) & {};
                type: "transactionRequest";
            };
        }>;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").CeloTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloRpcTransaction, action?: string | undefined) => ({
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    feeCurrency: import("viem").Address | null;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    accessList: import("viem").AccessList;
                    chainId: number;
                    feeCurrency: import("viem").Address | null;
                    gatewayFee: bigint | null;
                    gatewayFeeRecipient: import("viem").Address | null;
                    type: "cip42";
                    blobVersionedHashes?: undefined;
                    authorizationList?: undefined;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    accessList: import("viem").AccessList;
                    chainId: number;
                    feeCurrency: import("viem").Address | null;
                    type: "cip64";
                    blobVersionedHashes?: undefined;
                    authorizationList?: undefined;
                    mint?: undefined;
                    isSystemTx?: undefined;
                    sourceHash?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                    blobVersionedHashes?: undefined;
                    accessList?: undefined;
                    authorizationList?: undefined;
                    chainId?: undefined;
                    feeCurrency?: undefined;
                    gatewayFee?: undefined;
                    gatewayFeeRecipient?: undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionRequest: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").CeloTransactionRequest, action?: string | undefined) => ({
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x0" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    accessList?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x1" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: `0x${string}` | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x2" | undefined;
                    value?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs?: readonly `0x${string}`[] | readonly import("viem").ByteArray[] | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    kzg?: undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x3" | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    to: `0x${string}` | null;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: `0x${string}` | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    sidecars?: readonly import("viem").BlobSidecar<`0x${string}`>[] | undefined;
                    blobs: readonly import("viem").Hex[] | readonly import("viem").ByteArray[];
                    blobVersionedHashes?: readonly `0x${string}`[] | undefined;
                    kzg?: import("viem").Kzg | undefined;
                    authorizationList?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    type?: "0x4" | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    value?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    authorizationList?: import("viem").RpcAuthorizationList | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    feeCurrency?: `0x${string}` | undefined;
                } | {
                    data?: `0x${string}` | undefined;
                    from?: `0x${string}` | undefined;
                    gas?: `0x${string}` | undefined;
                    nonce?: `0x${string}` | undefined;
                    to?: `0x${string}` | null | undefined;
                    type?: "0x7b" | undefined;
                    value?: `0x${string}` | undefined;
                    accessList?: import("viem").AccessList | undefined;
                    feeCurrency?: `0x${string}` | undefined;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: `0x${string}` | undefined;
                    maxPriorityFeePerGas?: `0x${string}` | undefined;
                    blobs?: undefined;
                    blobVersionedHashes?: undefined;
                    kzg?: undefined;
                    sidecars?: undefined;
                    authorizationList?: undefined;
                }) & {};
                type: "transactionRequest";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionCelo;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    288: {
        blockExplorers: {
            readonly default: {
                readonly name: "BOBAScan";
                readonly url: "https://bobascan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 446859;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 288;
        name: "Boba Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.boba.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4337: {
        blockExplorers: {
            readonly default: {
                readonly name: "Beam Explorer";
                readonly url: "https://subnets.avax.network/beam";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x4956f15efdc3dc16645e90cc356eafa65ffc65ec";
                readonly blockCreated: 1;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 4337;
        name: "Beam";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Beam";
            readonly symbol: "BEAM";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://build.onbeam.com/rpc"];
                readonly webSocket: readonly ["wss://build.onbeam.com/ws"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "beam";
    };
    50: {
        blockExplorers: {
            readonly default: {
                readonly name: "XDCScan";
                readonly url: "https://xdcscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0x0B1795ccA8E4eC4df02346a082df54D437F8D9aF";
                readonly blockCreated: 75884020;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 50;
        name: "XDC Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "XDC";
            readonly symbol: "XDC";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.xdcrpc.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    660279: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://explorer.xai-chain.net";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 222549;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 660279;
        name: "Xai Mainnet";
        nativeCurrency: {
            readonly name: "Xai";
            readonly symbol: "XAI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://xai-chain.net/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    1329: {
        blockExplorers: {
            readonly default: {
                readonly name: "Seiscan";
                readonly url: "https://seiscan.io";
                readonly apiUrl: "https://api.etherscan.io/v2/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 1329;
        name: "Sei Network";
        nativeCurrency: {
            readonly name: "Sei";
            readonly symbol: "SEI";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://evm-rpc.sei-apis.com/"];
                readonly webSocket: readonly ["wss://evm-ws.sei-apis.com/"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    424: {
        blockExplorers: {
            readonly default: {
                readonly name: "PGN Explorer";
                readonly url: "https://explorer.publicgoods.network";
                readonly apiUrl: "https://explorer.publicgoods.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0x9E6204F750cD866b299594e2aC9eA824E2e5f95c";
                };
            };
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 3380209;
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0xb26Fd985c5959bBB382BAFdD0b879E149e48116c";
                };
            };
            readonly l1StandardBridge: {
                readonly 1: {
                    readonly address: "0xD0204B9527C1bA7bD765Fa5CCD9355d38338272b";
                };
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 424;
        name: "PGN";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.publicgoods.network"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "pgn";
    };
    66: {
        blockExplorers: {
            readonly default: {
                readonly name: "oklink";
                readonly url: "https://www.oklink.com/okc";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 10364792;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 66;
        name: "OKC";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "OKT";
            readonly symbol: "OKT";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://exchainrpc.okex.org"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7518: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://www.meversescan.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 86881340;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 7518;
        name: "MEVerse Chain Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "MEVerse";
            readonly symbol: "MEV";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.meversemainnet.io"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    12324: {
        blockExplorers: {
            readonly default: {
                readonly name: "L3X Mainnet Explorer";
                readonly url: "https://explorer.l3x.com";
                readonly apiUrl: "https://explorer.l3x.com/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 12324;
        name: "L3X Protocol";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-mainnet.l3x.com"];
                readonly webSocket: readonly ["wss://rpc-mainnet.l3x.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    701: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://koi-scan.darwinia.network";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 180001;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 701;
        name: "Koi Network";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Koi Network Native Token";
            readonly symbol: "KRING";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://koi-rpc.darwinia.network"];
                readonly webSocket: readonly ["wss://koi-rpc.darwinia.network"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    321: {
        blockExplorers: {
            readonly default: {
                readonly name: "KCC Explorer";
                readonly url: "https://explorer.kcc.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 11760430;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 321;
        name: "KCC Mainnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "KCS";
            readonly symbol: "KCS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://kcc-rpc.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "KCC Mainnet";
    };
    8899: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://exp-l1.jibchain.net";
                readonly apiUrl: "https://exp-l1.jibchain.net/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xc0C8C486D1466C57Efe13C2bf000d4c56F47CBdC";
                readonly blockCreated: 2299048;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 8899;
        name: "JB Chain";
        nativeCurrency: {
            readonly name: "JBC";
            readonly symbol: "JBC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc-l1.jibchain.net"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet: false;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
        readonly network: "jbc";
    };
    56: {
        blockExplorers: {
            readonly default: {
                readonly name: "BscScan";
                readonly url: "https://bscscan.com";
                readonly apiUrl: "https://api.bscscan.com/api";
            };
        };
        blockTime: 750;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 15921452;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 56;
        name: "BNB Smart Chain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "BNB";
            readonly symbol: "BNB";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://56.rpc.thirdweb.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    5112: {
        blockExplorers: {
            readonly default: {
                readonly name: "Ham Chain Explorer";
                readonly url: "https://explorer.ham.fun";
                readonly apiUrl: "https://explorer.ham.fun/api/v2";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 5112;
        name: "Ham";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ham";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.ham.fun"];
                readonly webSocket: readonly ["wss://rpc.ham.fun"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    17777: {
        blockExplorers: {
            readonly default: {
                readonly name: "EOS EVM Explorer";
                readonly url: "https://explorer.evm.eosnetwork.com";
                readonly apiUrl: "https://explorer.evm.eosnetwork.com/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 7943933;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 17777;
        name: "EOS EVM";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "EOS";
            readonly symbol: "EOS";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://api.evm.eosnetwork.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    7332: {
        blockExplorers: {
            readonly default: {
                readonly name: "EON Explorer";
                readonly url: "https://eon-explorer.horizenlabs.io";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {};
        ensTlds?: readonly string[] | undefined;
        id: 7332;
        name: "Horizen EON";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ZEN";
            readonly symbol: "ZEN";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://eon-rpc.horizenlabs.io/ethv1"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    53935: {
        blockExplorers: {
            readonly default: {
                readonly name: "DFKSubnetScan";
                readonly url: "https://subnets.avax.network/defi-kingdoms";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14790551;
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 53935;
        name: "DFK Chain";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Jewel";
            readonly symbol: "JEWEL";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    4999: {
        blockExplorers: {
            readonly default: {
                readonly name: "Blockscout";
                readonly url: "https://explorer.blackfort.network";
                readonly apiUrl: "https://explorer.blackfort.network/api";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 4999;
        name: "BlackFort Exchange Network";
        nativeCurrency: {
            readonly name: "BlackFort Token";
            readonly symbol: "BXN";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://mainnet.blackfort.network/rpc"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    200901: {
        blockExplorers: {
            readonly default: {
                readonly name: "Bitlayer(BTR) Scan";
                readonly url: "https://www.btrscan.com";
            };
        };
        blockTime?: number | undefined | undefined;
        contracts?: {
            [x: string]: import("viem").ChainContract | {
                [sourceId: number]: import("viem").ChainContract | undefined;
            } | undefined;
            ensRegistry?: import("viem").ChainContract | undefined;
            ensUniversalResolver?: import("viem").ChainContract | undefined;
            multicall3?: import("viem").ChainContract | undefined;
            erc6492Verifier?: import("viem").ChainContract | undefined;
        } | undefined;
        ensTlds?: readonly string[] | undefined;
        id: 200901;
        name: "Bitlayer";
        nativeCurrency: {
            readonly name: "Bitcoin";
            readonly symbol: "BTC";
            readonly decimals: 18;
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.bitlayer.org", "https://rpc.bitlayer-rpc.com"];
                readonly webSocket: readonly ["wss://ws.bitlayer.org", "wss://ws.bitlayer-rpc.com"];
            };
        };
        sourceId?: number | undefined | undefined;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters?: undefined;
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers?: import("viem").ChainSerializers<undefined, import("viem").TransactionSerializable> | undefined;
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
    60808: {
        blockExplorers: {
            readonly default: {
                readonly name: "BOB Explorer";
                readonly url: "https://explorer.gobob.xyz";
            };
        };
        blockTime: 2000;
        contracts: {
            readonly multicall3: {
                readonly address: "0xcA11bde05977b3631167028862bE2a173976CA11";
                readonly blockCreated: 23131;
            };
            readonly l2OutputOracle: {
                readonly 1: {
                    readonly address: "0xdDa53E23f8a32640b04D7256e651C1db98dB11C1";
                    readonly blockCreated: 4462615;
                };
            };
            readonly portal: {
                readonly 1: {
                    readonly address: "0x8AdeE124447435fE03e3CD24dF3f4cAE32E65a3E";
                    readonly blockCreated: 4462615;
                };
            };
            readonly gasPriceOracle: {
                readonly address: "0x420000000000000000000000000000000000000F";
            };
            readonly l1Block: {
                readonly address: "0x4200000000000000000000000000000000000015";
            };
            readonly l2CrossDomainMessenger: {
                readonly address: "0x4200000000000000000000000000000000000007";
            };
            readonly l2Erc721Bridge: {
                readonly address: "0x4200000000000000000000000000000000000014";
            };
            readonly l2StandardBridge: {
                readonly address: "0x4200000000000000000000000000000000000010";
            };
            readonly l2ToL1MessagePasser: {
                readonly address: "0x4200000000000000000000000000000000000016";
            };
        };
        ensTlds?: readonly string[] | undefined;
        id: 60808;
        name: "BOB";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "ETH";
            readonly symbol: "ETH";
        };
        experimental_preconfirmationTime?: number | undefined | undefined;
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.gobob.xyz"];
                readonly webSocket: readonly ["wss://rpc.gobob.xyz"];
            };
        };
        sourceId: 1;
        testnet?: boolean | undefined | undefined;
        custom?: Record<string, unknown> | undefined;
        extendSchema?: Record<string, unknown> | undefined;
        fees?: import("viem").ChainFees<undefined> | undefined;
        formatters: {
            readonly block: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcBlock, action?: string | undefined) => {
                    baseFeePerGas: bigint | null;
                    blobGasUsed: bigint;
                    difficulty: bigint;
                    excessBlobGas: bigint;
                    extraData: import("viem").Hex;
                    gasLimit: bigint;
                    gasUsed: bigint;
                    hash: `0x${string}` | null;
                    logsBloom: `0x${string}` | null;
                    miner: import("viem").Address;
                    mixHash: import("viem").Hash;
                    nonce: `0x${string}` | null;
                    number: bigint | null;
                    parentBeaconBlockRoot?: `0x${string}` | undefined;
                    parentHash: import("viem").Hash;
                    receiptsRoot: import("viem").Hex;
                    sealFields: import("viem").Hex[];
                    sha3Uncles: import("viem").Hash;
                    size: bigint;
                    stateRoot: import("viem").Hash;
                    timestamp: bigint;
                    totalDifficulty: bigint | null;
                    transactions: `0x${string}`[] | import("viem/chains").OpStackTransaction<boolean>[];
                    transactionsRoot: import("viem").Hash;
                    uncles: import("viem").Hash[];
                    withdrawals?: import("viem").Withdrawal[] | undefined | undefined;
                    withdrawalsRoot?: `0x${string}` | undefined;
                } & {};
                type: "block";
            };
            readonly transaction: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransaction, action?: string | undefined) => ({
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: boolean;
                    mint?: bigint | undefined | undefined;
                    sourceHash: import("viem").Hex;
                    type: "deposit";
                } | {
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    v: bigint;
                    to: import("viem").Address | null;
                    from: import("viem").Address;
                    gas: bigint;
                    nonce: number;
                    value: bigint;
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    accessList?: undefined | undefined;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId?: number | undefined;
                    yParity?: undefined | undefined;
                    type: "legacy";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip2930";
                    gasPrice: bigint;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas?: undefined | undefined;
                    maxPriorityFeePerGas?: undefined | undefined;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip1559";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList?: undefined | undefined;
                    blobVersionedHashes: readonly import("viem").Hex[];
                    chainId: number;
                    type: "eip4844";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas: bigint;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                } | {
                    blockHash: `0x${string}` | null;
                    blockNumber: bigint | null;
                    blockTimestamp?: bigint | undefined;
                    from: import("viem").Address;
                    gas: bigint;
                    hash: import("viem").Hash;
                    input: import("viem").Hex;
                    nonce: number;
                    r: import("viem").Hex;
                    s: import("viem").Hex;
                    to: import("viem").Address | null;
                    transactionIndex: number | null;
                    typeHex: import("viem").Hex | null;
                    v: bigint;
                    value: bigint;
                    yParity: number;
                    accessList: import("viem").AccessList;
                    authorizationList: import("viem").SignedAuthorizationList;
                    blobVersionedHashes?: undefined | undefined;
                    chainId: number;
                    type: "eip7702";
                    gasPrice?: undefined | undefined;
                    maxFeePerBlobGas?: undefined | undefined;
                    maxFeePerGas: bigint;
                    maxPriorityFeePerGas: bigint;
                    isSystemTx?: undefined | undefined;
                    mint?: undefined | undefined;
                    sourceHash?: undefined | undefined;
                }) & {};
                type: "transaction";
            };
            readonly transactionReceipt: {
                exclude: [] | undefined;
                format: (args: import("viem/chains").OpStackRpcTransactionReceipt, action?: string | undefined) => {
                    blobGasPrice?: bigint | undefined;
                    blobGasUsed?: bigint | undefined;
                    blockHash: import("viem").Hash;
                    blockNumber: bigint;
                    blockTimestamp?: bigint | undefined;
                    contractAddress: import("viem").Address | null | undefined;
                    cumulativeGasUsed: bigint;
                    effectiveGasPrice: bigint;
                    from: import("viem").Address;
                    gasUsed: bigint;
                    logs: import("viem").Log<bigint, number, false>[];
                    logsBloom: import("viem").Hex;
                    root?: `0x${string}` | undefined;
                    status: "success" | "reverted";
                    to: import("viem").Address | null;
                    transactionHash: import("viem").Hash;
                    transactionIndex: number;
                    type: import("viem").TransactionType;
                    l1GasPrice: bigint | null;
                    l1GasUsed: bigint | null;
                    l1Fee: bigint | null;
                    l1FeeScalar: number | null;
                } & {};
                type: "transactionReceipt";
            };
        };
        prepareTransactionRequest?: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | [fn: ((args: import("viem").PrepareTransactionRequestParameters, options: {
            phase: "beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters";
        }) => Promise<import("viem").PrepareTransactionRequestParameters>) | undefined, options: {
            runAt: readonly ("beforeFillTransaction" | "beforeFillParameters" | "afterFillParameters")[];
        }] | undefined;
        serializers: {
            readonly transaction: typeof import("viem/chains").serializeTransactionOpStack;
        };
        verifyHash?: ((client: import("viem").Client, parameters: import("viem").VerifyHashActionParameters) => Promise<import("viem").VerifyHashActionReturnType>) | undefined;
    };
};
export {};
//# sourceMappingURL=KnownChainsType.d.ts.map