/**
 * Receives each decoded Hardhat `console.log` message after an execution request.
 * A thrown error propagates to the request that produced the message.
 */
export type ConsoleLogHandler = (message: string, raw: { calldata: `0x${string}`; args: readonly unknown[] }) => void
