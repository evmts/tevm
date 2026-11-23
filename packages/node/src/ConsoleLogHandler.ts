/**
 * Receives each decoded Hardhat `console.log` message after an execution request.
 * A thrown error is emitted as an `error` event on `ZevmEngine.events`. It never changes the
 * result of the request that produced the message, and later messages are still delivered.
 */
export type ConsoleLogHandler = (message: string, raw: { calldata: `0x${string}`; args: readonly unknown[] }) => void
