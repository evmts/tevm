# TEVM CLI

Native ZEVM commands, persistent local sessions, and a JSON-RPC server. Build the native addon with the [repository setup](../README.md), then build the CLI with `pnpm --dir cli run build:app`.

```sh
node cli/dist/cli.js session demo --local --json
node cli/dist/cli.js set-code --address 0x0000000000000000000000000000000000000123 --code 0x602a60005260206000f3 --session demo --json
node cli/dist/cli.js call --to 0x0000000000000000000000000000000000000123 --session demo --json
node cli/dist/cli.js call --to 0x0000000000000000000000000000000000000123 --trace --session demo --json
node cli/dist/cli.js serve --host 127.0.0.1 --port 8545 --json
```

`--json` runs commands directly and prints a stable result envelope. Interactive commands open an editable script linked to the current CLI installation; they do not install another execution engine.

`contract` accepts `--abi`, `--function-name`, and JSON `--args`. `call` and `contract` simulate by default; `--submit` mines a transaction and `--queue` defers mining. `deploy` accepts creation bytecode and mines unless queued. `mine --block-count 2` advances a session. Signed raw transactions use `send-raw-transaction`.

`dump-state` writes a JSON-encoded native hex blob, which `load-state` restores. Sessions retain that blob and local height. Fork sessions retain their upstream URL and pinned block, but local block numbering starts at zero; upstream history is not imported.

Tracing returns native opcode steps, gas, output and failure status. JavaScript step callbacks, custom JavaScript precompiles, and direct state-manager mutation are retired. Unlocked native transaction submission currently uses legacy fees; typed transactions can be signed externally and submitted raw.

Project creation, Solidity compilation, ABI generation, viem read commands, and the interactive server remain available. See the [migration guide](../docs/native-engine-migration.md) for the new public API.
