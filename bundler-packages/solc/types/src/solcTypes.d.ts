import type { Abi } from 'abitype';
import type { SourceUnit } from 'solidity-ast';
type HexNumber = `0x${string}`;
export type SolcAst = SourceUnit;
export type SolcLanguage = 'Solidity' | 'Yul' | 'SolidityAST';
export type SolcInputSource<T extends SolcLanguage = SolcLanguage> = {
    keccak256?: HexNumber;
} & ({
    ast: T extends 'SolidityAST' ? SolcAst : never;
} | {
    urls: string[];
} | {
    content: T extends 'SolidityAST' ? never : string;
});
export type SolcRemapping = Array<`${string}=${string}`>;
export type SolcYulDetails = {
    stackAllocation?: boolean;
    optimizerSteps?: string;
};
export type SolcOptimizerDetails = {
    peephole?: boolean;
    inliner?: boolean;
    jumpdestRemover?: boolean;
    orderLiterals?: boolean;
    deduplicate?: boolean;
    cse?: boolean;
    constantOptimizer?: boolean;
    yul?: boolean;
    yulDetails?: SolcYulDetails;
};
export type SolcOptimizer = {
    enabled?: boolean;
    runs?: number;
    details?: SolcOptimizerDetails;
};
declare const fileLevelOption: "";
export type SolcOutputSelection = {
    [fileName: string]: {
        [fileLevelOption]?: Array<'ast'>;
    } & {
        [contractName: Exclude<string, typeof fileLevelOption>]: Array<'abi' | 'ast' | 'devdoc' | 'evm.assembly' | 'evm.bytecode' | 'evm.bytecode.functionDebugData' | 'evm.bytecode.generatedSources' | 'evm.bytecode.linkReferences' | 'evm.bytecode.object' | 'evm.bytecode.opcodes' | 'evm.bytecode.sourceMap' | 'evm.deployedBytecode' | 'evm.deployedBytecode.immutableReferences' | 'evm.deployedBytecode.sourceMap' | 'evm.deployedBytecode.opcodes' | 'evm.deployedBytecode.object' | 'evm.gasEstimates' | 'evm.methodIdentifiers' | 'evm.legacyAssembly' | 'evm.methodIdentifiers' | 'evm.storageLayout' | 'ewasm.wasm' | 'ewasm.wast' | 'ir' | 'irOptimized' | 'metadata' | 'storageLayout' | 'userdoc' | '*'>;
    };
};
export type SolcModelCheckerContracts = {
    [fileName: `${string}.sol`]: string[];
};
export type SolcModelChecker = {
    contracts?: SolcModelCheckerContracts;
    divModNoSlacks?: boolean;
    engine?: 'all' | 'bmc' | 'chc' | 'none';
    extCalls?: 'trusted' | 'untrusted';
    invariants?: Array<'contract' | 'reentrancy'>;
    showProved?: boolean;
    showUnproved?: boolean;
    showUnsupported?: boolean;
    solvers?: Array<'cvc4' | 'smtlib2' | 'z3'>;
    targets?: Array<'underflow' | 'overflow' | 'assert'>;
    timeout?: boolean;
};
export type SolcDebugSettings = {
    revertStrings?: 'default' | 'strip' | 'debug' | 'verboseDebug';
    debugInfo?: Array<'location' | 'snippet' | '*'>;
};
export type SolcMetadataSettings = {
    appendCBOR?: boolean;
    useLiteralContent?: boolean;
    bytecodeHash?: 'ipfs' | 'bzzr1' | 'none';
};
export type SolcEvmVersion = 'homestead' | 'tangerineWhistle' | 'spuriousDragon' | 'byzantium' | 'constantinople' | 'petersburg' | 'istanbul' | 'berlin' | 'london' | 'paris' | 'shanghai' | 'cancun' | 'prague' | 'osaka';
export type SolcSettings = {
    experimental?: boolean;
    stopAfter?: 'parsing';
    remappings?: SolcRemapping;
    optimizer?: SolcOptimizer;
    evmVersion?: SolcEvmVersion;
    viaIR?: boolean;
    debug?: SolcDebugSettings;
    metadata?: SolcMetadataSettings;
    libraries?: Record<string, Record<string, string>>;
    outputSelection: SolcOutputSelection;
    modelChecker?: SolcModelChecker;
};
export type SolcInputSourcesDestructibleSettings = {
    keccak256?: HexNumber;
    content: string;
};
export type SolcInputSources<T extends SolcLanguage = SolcLanguage> = {
    [globalName: string]: SolcInputSource<T> & {
        destructible?: SolcInputSourcesDestructibleSettings;
    };
};
export type SolcInputDescription<T extends SolcLanguage = SolcLanguage> = {
    language: T;
    sources: SolcInputSources<T>;
    settings?: SolcSettings;
};
export type SolcOutput = {
    errors?: SolcErrorEntry[];
    sources: {
        [sourceFile: string]: SolcSourceEntry;
    };
    contracts?: {
        [sourceFile: string]: {
            [contractName: string]: SolcContractOutput;
        };
    };
};
export type SolcErrorEntry = {
    sourceLocation?: SolcSourceLocation;
    secondarySourceLocations?: SolcSecondarySourceLocation[];
    type: string;
    component: string;
    severity: 'error' | 'warning' | 'info';
    errorCode?: string;
    message: string;
    formattedMessage?: string;
};
export type SolcSourceLocation = {
    file: string;
    start: number;
    end: number;
};
export type SolcSecondarySourceLocation = SolcSourceLocation & {
    message: string;
};
export type SolcSourceEntry = {
    id: number;
    ast: SolcAst;
};
export type SolcContractOutput = {
    abi: Abi;
    metadata: string;
    userdoc: {
        methods?: Record<string, {
            notice: string;
        }>;
        kind: 'user';
        notice?: string;
        version: number;
    };
    devdoc: any;
    ir: string;
    storageLayout: SolcStorageLayout;
    evm: SolcEvmOutput;
    ewasm: SolcEwasmOutput;
};
/**
 * The storage layout for a contract.
 */
export type SolcStorageLayout<T extends SolcStorageLayoutTypes = SolcStorageLayoutTypes> = {
    /**
     * The list of stored variables with relevant slot information, type and metadata.
     * @see {@link SolcStorageLayoutItem}
     */
    storage: Array<SolcStorageLayoutItem<T>>;
    /**
     * A record of all types relevant to the stored variables with additional encoding information.
     * @see {@link SolcStorageLayoutTypes}
     */
    types: T;
};
/**
 * An item present in the contract's storage
 * @see [Solidity documentation](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html#json-output)
 */
export type SolcStorageLayoutItem<T extends SolcStorageLayoutTypes = SolcStorageLayoutTypes> = {
    /**
     * The id of the AST node of the state variable's declaration
     */
    astId: number;
    /**
     * The name of the contract including its path as prefix
     */
    contract: string;
    /**
     * The name of the state variable
     */
    label: string;
    /**
     * The offset in bytes within the storage slot according to the encoding
     */
    offset: number;
    /**
     * The storage slot where the state variable resides or starts
     */
    slot: string;
    /**
     * The identifier used as a key to the variable's type information in the {@link SolcStorageLayoutTypes} record
     */
    type: keyof T;
};
/**
 * A record of all types relevant to the stored variables mapped to their encoding information.
 */
export type SolcStorageLayoutTypes = Record<`t_${string}`, SolcStorageLayoutInplaceType | SolcStorageLayoutBytesType | SolcStorageLayoutMappingType | SolcStorageLayoutDynamicArrayType | SolcStorageLayoutStructType>;
/**
 * The base type for all storage layout types.
 */
export interface SolcStorageLayoutTypeBase {
    /**
     * How the data is encoded in storage
     *
     * - inplace: data is laid out contiguously in storage
     * - mapping: keccak-256 hash-based method
     * - dynamic_array: keccak-256 hash-based method
     * - bytes: single slot or keccak-256 hash-based depending on the data size
     */
    encoding: 'inplace' | 'mapping' | 'dynamic_array' | 'bytes';
    /**
     * The canonical type name
     */
    label: string;
    /**
     * The number of used bytes (as a decimal string)
     *
     * Note: if numberOfBytes > 32 this means that more than one slot is used
     */
    numberOfBytes: string;
}
/**
 * A storage layout type that is laid out contiguously in storage.
 */
export interface SolcStorageLayoutInplaceType extends SolcStorageLayoutTypeBase {
    encoding: 'inplace';
}
/**
 * A storage layout type that is laid out in a single slot or keccak-256 hash-based depending on the data size.
 */
export interface SolcStorageLayoutBytesType extends SolcStorageLayoutTypeBase {
    encoding: 'bytes';
}
/**
 * A storage layout type that is laid out in a keccak-256 hash-based method.
 */
export interface SolcStorageLayoutMappingType extends SolcStorageLayoutTypeBase {
    encoding: 'mapping';
    /**
     * The associated type for the mapping key
     */
    key: `t_${string}`;
    /**
     * The associated type for the mapping value
     */
    value: `t_${string}`;
}
/**
 * A storage layout type that is laid out in a keccak-256 hash-based method.
 */
export interface SolcStorageLayoutDynamicArrayType extends SolcStorageLayoutTypeBase {
    encoding: 'dynamic_array';
    /**
     * The base type of the dynamic array
     */
    base: `t_${string}`;
}
/**
 * A storage layout type that is a struct.
 */
export interface SolcStorageLayoutStructType extends SolcStorageLayoutInplaceType {
    /**
     * The members of the struct in the same format as a {@link SolcStorageLayoutItem}
     */
    members: Array<SolcStorageLayoutItem>;
}
export type SolcEvmOutput = {
    assembly: string;
    legacyAssembly: any;
    bytecode: SolcBytecodeOutput;
    deployedBytecode: SolcBytecodeOutput;
    methodIdentifiers: {
        [functionSignature: string]: string;
    };
    gasEstimates: SolcGasEstimates;
};
export type SolcBytecodeOutput = {
    functionDebugData: {
        [functionName: string]: SolcFunctionDebugData;
    };
    object: string;
    opcodes: string;
    sourceMap: string;
    generatedSources: SolcGeneratedSource[];
    linkReferences: {
        [fileName: string]: {
            [libraryName: string]: Array<{
                start: number;
                length: number;
            }>;
        };
    };
} & Omit<SolcDeployedBytecodeOutput, 'immutableReferences'>;
export type SolcDeployedBytecodeOutput = {
    immutableReferences: {
        [astID: string]: Array<{
            start: number;
            length: number;
        }>;
    };
};
export type SolcFunctionDebugData = {
    entryPoint?: number;
    id?: number | null;
    parameterSlots?: number;
    returnSlots?: number;
};
export type SolcGeneratedSource = {
    ast: SolcAst;
    contents: string;
    id: number;
    language: string;
    name: string;
};
export type SolcGasEstimates = {
    creation: {
        codeDepositCost: string;
        executionCost: string;
        totalCost: string;
    };
    external: {
        [functionSignature: string]: string;
    };
    internal: {
        [functionSignature: string]: string;
    };
};
export type SolcEwasmOutput = {
    wast: string;
    wasm: string;
};
export type SolcVersions = '0.8.30' | '0.8.29' | '0.8.28' | '0.8.27' | '0.8.26' | '0.8.25' | '0.8.24' | '0.8.23' | '0.8.22' | '0.8.21' | '0.8.20' | '0.8.19' | '0.8.18' | '0.8.17' | '0.8.16' | '0.8.15' | '0.8.14' | '0.8.13' | '0.8.12' | '0.8.11' | '0.8.10' | '0.8.9' | '0.8.8' | '0.8.7' | '0.8.6' | '0.8.5' | '0.8.4' | '0.8.3' | '0.8.2' | '0.8.1' | '0.8.0' | '0.7.6' | '0.7.5' | '0.7.4' | '0.7.3' | '0.7.2' | '0.7.1' | '0.7.0' | '0.6.12' | '0.6.11' | '0.6.10' | '0.6.9' | '0.6.8' | '0.6.7' | '0.6.6' | '0.6.5' | '0.6.4' | '0.6.3' | '0.6.2' | '0.6.1' | '0.6.0' | '0.5.17' | '0.5.16' | '0.5.15' | '0.5.14' | '0.5.13' | '0.5.12' | '0.5.11' | '0.5.10' | '0.5.9' | '0.5.8' | '0.5.7' | '0.5.6' | '0.5.5' | '0.5.4' | '0.5.3' | '0.5.2' | '0.5.1' | '0.5.0' | '0.4.26' | '0.4.25' | '0.4.24' | '0.4.23' | '0.4.22' | '0.4.21' | '0.4.20' | '0.4.19' | '0.4.18' | '0.4.17' | '0.4.16' | '0.4.15' | '0.4.14' | '0.4.13' | '0.4.12' | '0.4.11' | '0.4.10' | '0.4.9' | '0.4.8' | '0.4.7' | '0.4.6' | '0.4.5' | '0.4.4' | '0.4.3' | '0.4.2' | '0.4.1' | '0.4.0' | '0.3.6' | '0.3.5' | '0.3.4' | '0.3.3' | '0.3.2' | '0.3.1' | '0.3.0' | '0.2.2' | '0.2.1' | '0.2.0' | '0.1.7' | '0.1.6' | '0.1.5' | '0.1.4' | '0.1.3' | '0.1.2' | '0.1.1';
export type Releases = {
    '0.8.30': 'v0.8.30+commit.73712a01.js';
    '0.8.29': 'v0.8.29+commit.ab55807c.js';
    '0.8.28': 'v0.8.28+commit.c33e5a8c.js';
    '0.8.27': 'v0.8.27+commit.4a35a09.js';
    '0.8.26': 'v0.8.26+commit.8a97fa7a.js';
    '0.8.25': 'v0.8.25+commit.b61c2a91.js';
    '0.8.24': 'v0.8.24+commit.e11b9ed9.js';
    '0.8.23': 'v0.8.23+commit.f704f362';
    '0.8.22': 'v0.8.22+commit.4fc1097e';
    '0.8.21': 'v0.8.21+commit.d9974bed';
    '0.8.20': 'v0.8.20+commit.a1b79de6';
    '0.8.19': 'v0.8.19+commit.7dd6d404';
    '0.8.18': 'v0.8.18+commit.87f61d96';
    '0.8.17': 'v0.8.17+commit.8df45f5f';
    '0.8.16': 'v0.8.16+commit.07a7930e';
    '0.8.15': 'v0.8.15+commit.e14f2714';
    '0.8.14': 'v0.8.14+commit.80d49f37';
    '0.8.13': 'v0.8.13+commit.abaa5c0e';
    '0.8.12': 'v0.8.12+commit.f00d7308';
    '0.8.11': 'v0.8.11+commit.d7f03943';
    '0.8.10': 'v0.8.10+commit.fc410830';
    '0.8.9': 'v0.8.9+commit.e5eed63a';
    '0.8.8': 'v0.8.8+commit.dddeac2f';
    '0.8.7': 'v0.8.7+commit.e28d00a7';
    '0.8.6': 'v0.8.6+commit.11564f7e';
    '0.8.5': 'v0.8.5+commit.a4f2e591';
    '0.8.4': 'v0.8.4+commit.c7e474f2';
    '0.8.3': 'v0.8.3+commit.8d00100c';
    '0.8.2': 'v0.8.2+commit.661d1103';
    '0.8.1': 'v0.8.1+commit.df193b15';
    '0.8.0': 'v0.8.0+commit.c7dfd78e';
    '0.7.6': 'v0.7.6+commit.7338295f';
    '0.7.5': 'v0.7.5+commit.eb77ed08';
    '0.7.4': 'v0.7.4+commit.3f05b770';
    '0.7.3': 'v0.7.3+commit.9bfce1f6';
    '0.7.2': 'v0.7.2+commit.51b20bc0';
    '0.7.1': 'v0.7.1+commit.f4a555be';
    '0.7.0': 'v0.7.0+commit.9e61f92b';
    '0.6.12': 'v0.6.12+commit.27d51765';
    '0.6.11': 'v0.6.11+commit.5ef660b1';
    '0.6.10': 'v0.6.10+commit.00c0fcaf';
    '0.6.9': 'v0.6.9+commit.3e3065ac';
    '0.6.8': 'v0.6.8+commit.0bbfe453';
    '0.6.7': 'v0.6.7+commit.b8d736ae';
    '0.6.6': 'v0.6.6+commit.6c089d02';
    '0.6.5': 'v0.6.5+commit.f956cc89';
    '0.6.4': 'v0.6.4+commit.1dca32f3';
    '0.6.3': 'v0.6.3+commit.8dda9521';
    '0.6.2': 'v0.6.2+commit.bacdbe57';
    '0.6.1': 'v0.6.1+commit.e6f7d5a4';
    '0.6.0': 'v0.6.0+commit.26b70077';
    '0.5.17': 'v0.5.17+commit.d19bba13';
    '0.5.16': 'v0.5.16+commit.9c3226ce';
    '0.5.15': 'v0.5.15+commit.6a57276f';
    '0.5.14': 'v0.5.14+commit.01f1aaa4';
    '0.5.13': 'v0.5.13+commit.5b0b510c';
    '0.5.12': 'v0.5.12+commit.7709ece9';
    '0.5.11': 'v0.5.11+commit.c082d0b4';
    '0.5.10': 'v0.5.10+commit.5a6ea5b1';
    '0.5.9': 'v0.5.9+commit.e560f70d';
    '0.5.8': 'v0.5.8+commit.23d335f2';
    '0.5.7': 'v0.5.7+commit.6da8b019';
    '0.5.6': 'v0.5.6+commit.b259423e';
    '0.5.5': 'v0.5.5+commit.47a71e8f';
    '0.5.4': 'v0.5.4+commit.9549d8ff';
    '0.5.3': 'v0.5.3+commit.10d17f24';
    '0.5.2': 'v0.5.2+commit.1df8f40c';
    '0.5.1': 'v0.5.1+commit.c8a2cb62';
    '0.5.0': 'v0.5.0+commit.1d4f565a';
    '0.4.26': 'v0.4.26+commit.4563c3fc';
    '0.4.25': 'v0.4.25+commit.59dbf8f1';
    '0.4.24': 'v0.4.24+commit.e67f0147';
    '0.4.23': 'v0.4.23+commit.124ca40d';
    '0.4.22': 'v0.4.22+commit.4cb486ee';
    '0.4.21': 'v0.4.21+commit.dfe3193c';
    '0.4.20': 'v0.4.20+commit.3155dd80';
    '0.4.19': 'v0.4.19+commit.c4cbbb05';
    '0.4.18': 'v0.4.18+commit.9cf6e910';
    '0.4.17': 'v0.4.17+commit.bdeb9e52';
    '0.4.16': 'v0.4.16+commit.d7661dd9';
    '0.4.15': 'v0.4.15+commit.bbb8e64f';
    '0.4.14': 'v0.4.14+commit.c2215d46';
    '0.4.13': 'v0.4.13+commit.0fb4cb1a';
    '0.4.12': 'v0.4.12+commit.194ff033';
    '0.4.11': 'v0.4.11+commit.68ef5810';
    '0.4.10': 'v0.4.10+commit.f0d539ae';
    '0.4.9': 'v0.4.9+commit.364da425';
    '0.4.8': 'v0.4.8+commit.60cc1668';
    '0.4.7': 'v0.4.7+commit.822622cf';
    '0.4.6': 'v0.4.6+commit.2dabbdf0';
    '0.4.5': 'v0.4.5+commit.b318366e';
    '0.4.4': 'v0.4.4+commit.4633f3de';
    '0.4.3': 'v0.4.3+commit.2353da71';
    '0.4.2': 'v0.4.2+commit.af6afb04';
    '0.4.1': 'v0.4.1+commit.4fc6fc2c';
    '0.4.0': 'v0.4.0+commit.acd334c9';
    '0.3.6': 'v0.3.6+commit.3fc68da5';
    '0.3.5': 'v0.3.5+commit.5f97274a';
    '0.3.4': 'v0.3.4+commit.7dab8902';
    '0.3.3': 'v0.3.3+commit.4dc1cb14';
    '0.3.2': 'v0.3.2+commit.81ae2a78';
    '0.3.1': 'v0.3.1+commit.c492d9be';
    '0.3.0': 'v0.3.0+commit.11d67369';
    '0.2.2': 'v0.2.2+commit.ef92f566';
    '0.2.1': 'v0.2.1+commit.91a6b35f';
    '0.2.0': 'v0.2.0+commit.4dc2445e';
    '0.1.7': 'v0.1.7+commit.b4e666cc';
    '0.1.6': 'v0.1.6+commit.d41f8b7c';
    '0.1.5': 'v0.1.5+commit.23865e39';
    '0.1.4': 'v0.1.4+commit.5f6c3cdf';
    '0.1.3': 'v0.1.3+commit.028f561d';
    '0.1.2': 'v0.1.2+commit.d0d36e3';
    '0.1.1': 'v0.1.1+commit.6ff4cd6';
};
export interface Solc {
    version: string;
    semver: string;
    license: string;
    lowlevel: LowLevelConfig;
    features: FeaturesConfig;
    compile: <T extends SolcLanguage = SolcLanguage>(input: SolcInputDescription<T>) => SolcOutput;
    loadRemoteVersion: (versionString: string, callback: (err: Error | null, solc?: Solc) => void) => void;
    setupMethods: (soljson: any) => void;
}
interface LowLevelConfig {
    compileSingle: any;
    compileMulti: any;
    compileCallback: any;
}
interface FeaturesConfig {
    legacySingleInput: boolean;
    multipleInputs: boolean;
    importCallback: boolean;
    nativeStandardJSON: boolean;
}
export {};
//# sourceMappingURL=solcTypes.d.ts.map