/**
 * A decoded Hardhat `console.log` call captured by the native engine.
 * Emitted as the `consoleLog` event on `ZevmEngine.events`.
 */
export type ConsoleLogEvent = {
	/** `util.format`-style rendering, as printed by Hardhat. */
	message: string
	/** Canonical Solidity signature, for example `log(string,uint256)`. */
	signature: string
	/** Raw calldata sent to the console address, including the selector. */
	calldata: `0x${string}`
	/** ABI-decoded arguments: bigint, string, boolean, checksummed address or hex bytes. */
	args: readonly unknown[]
}
