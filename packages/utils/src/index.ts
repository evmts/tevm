export type {
	Abi,
	AbiConstructor,
	AbiEvent,
	AbiFunction,
	AbiItemType,
	AbiParametersToPrimitiveTypes,
	Account,
	Address,
	BlockNumber,
	BlockTag,
	ContractConstructorArgs,
	ContractFunctionName,
	CreateEventFilterParameters,
	DecodeFunctionResultReturnType,
	EncodeDeployDataParameters,
	EncodeFunctionDataParameters,
	ExtractAbiEvent,
	ExtractAbiEventNames,
	ExtractAbiEvents,
	ExtractAbiFunction,
	ExtractAbiFunctionNames,
	Filter,
	FormatAbi,
	GetEventArgs,
	HDAccount,
	Hex,
	ParseAbi,
} from './abitype.js'
export * from './prefundedAccounts.js'
export {
	boolToBytes,
	boolToHex,
	bytesToBigInt,
	bytesToBigint,
	bytesToBool,
	bytesToHex,
	bytesToNumber,
	decodeAbiParameters,
	decodeErrorResult,
	decodeEventLog,
	decodeFunctionData,
	decodeFunctionResult,
	encodeAbiParameters,
	encodeDeployData,
	encodeErrorResult,
	encodeEventTopics,
	encodeFunctionData,
	encodeFunctionResult,
	encodePacked,
	formatAbi,
	formatEther,
	formatGwei,
	formatLog,
	fromBytes,
	fromHex,
	fromRlp,
	getAddress,
	hexToBigInt,
	hexToBool,
	hexToBytes,
	hexToNumber,
	hexToString,
	isAddress,
	isBytes,
	isHex,
	keccak256,
	mnemonicToAccount,
	numberToHex,
	parseAbi,
	parseEther,
	parseGwei,
	serializeTransaction,
	stringToHex,
	toBytes,
	toHex,
	toRlp,
} from './viem.js'
// GenesisState moved to the common package, but we need the account-based GenesisState
// which seems to have been removed. Let's define it here for backward compatibility.
export type GenesisState = Record<string, string | Record<string, any>>

// AsyncEventEmitter is kept here for backward compatibility with older callers.
// Define a compatible type for backward compatibility
export type AsyncEventEmitter<T extends Record<string, any> = {}> = {
	on<K extends keyof T>(event: K, listener: T[K]): void
	once<K extends keyof T>(event: K, listener: T[K]): void
	off<K extends keyof T>(event: K, listener: T[K]): void
	emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean
	removeAllListeners<K extends keyof T>(event?: K): void
}

export { hashMessage, recoverAddress, recoverMessageAddress, recoverPublicKey, verifyMessage } from 'viem'
export { signMessage } from 'viem/accounts'
export type { EncodeEventTopicsParameters } from 'viem/utils'
export * from './invariant.js'
export type {
	BigIntToHex,
	JsonSerializable,
	JsonSerializableArray,
	JsonSerializableObject,
	JsonSerializableSet,
	SerializeToJson,
	SetToHex,
} from './SerializeToJson.js'
