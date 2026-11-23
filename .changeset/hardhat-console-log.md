---
"@tevm/utils": minor
"@tevm/node": minor
"@tevm/memory-client": minor
"tevm": minor
---

Add Hardhat `console.log` support. `@tevm/utils` exports `HARDHAT_CONSOLE_ADDRESS` and `decodeHardhatConsoleLog`, which decodes every `console.sol`/`console2.sol` selector and applies `%s`/`%d`/`%i`/`%o` formatting. `createZevmEngine` and `createMemoryClient` accept `consoleLog: true | (message, raw) => void`; after `eth_call`, `eth_estimateGas`, `eth_sendTransaction` and `eth_sendRawTransaction` the engine drains native `tevm_drainConsoleLogs`, emits `consoleLog` events and prints or forwards each message. Native builds without `tevm_drainConsoleLogs` produce no messages.
