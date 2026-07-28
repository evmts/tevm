---
name: tevm
description: >-
  Build, simulate, test, fork, and debug EVM transactions in TypeScript with
  tevm 1.0.0-rc.151. Use for in-process EVM scripts, typed Solidity imports,
  lazy mainnet or OP-stack forks, direct account and storage setup, viem-compatible
  contract actions, Vitest EVM tests, traces, and transaction simulation.
---

# Tevm

Use `tevm@1.0.0-rc.151`. Do not copy `1.0.0-next.x` examples or rely on npm's `latest` tag. Install a compatible viem peer explicitly. The rc.151 repository uses `viem@2.49.3`.

## Mental model

Tevm is an EVM that runs inside the JavaScript or TypeScript process and exposes both Tevm-native and viem-compatible actions. Its three defining capabilities are: run a real EVM without a subprocess or JSON-RPC server, import Solidity files as typechecked contract modules, and fork mainnet or another EVM chain with remote state fetched lazily only when execution touches it. Use Tevm to make state setup, execution, mining, tracing, and assertions one program.

## Start with a complete script

This script creates a synchronous memory client, funds a caller, deploys a packaged contract, mines it, sends a state-changing call, mines again, and reads the result.

```ts
import {
  createMemoryClient,
  encodeFunctionData,
  parseEther,
} from "tevm";
import { SimpleContract } from "tevm/contract";

const caller = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const client = createMemoryClient({
  miningConfig: { type: "manual" },
});

await client.tevmSetAccount({
  address: caller,
  balance: parseEther("10"),
  nonce: 0n,
});

const deployment = await client.tevmDeploy({
  ...SimpleContract.deploy(42n),
  from: caller,
});
if (!deployment.createdAddress) throw new Error("deployment failed");

await client.tevmMine({ blockCount: 1 });
const counter = SimpleContract.withAddress(deployment.createdAddress);

await client.tevmCall({
  from: caller,
  to: counter.address,
  data: encodeFunctionData(counter.write.set(7n)),
  addToMempool: true,
});
await client.tevmMine({ blockCount: 1 });

const read = await client.tevmContract(counter.read.get());
const value = read.data;
const account = await client.tevmGetAccount({ address: caller });
const chainId = await client.request({ method: "eth_chainId" });

console.log({
  contract: counter.address,
  value,
  funded: account.balance > 0n,
  chainId,
});

if (value !== 7n) throw new Error(`expected 7, received ${value}`);
if (account.balance <= 0n) throw new Error("caller unexpectedly depleted");
```

## Reach for these APIs

`createMemoryClient(options?: MemoryClientOptions): MemoryClient` is synchronous in rc.151. Its result already includes Tevm actions plus viem public, wallet, and Anvil-mode test actions.

| Method | Signature and use |
| --- | --- |
| `client.tevmReady` | `(): Promise<true>` waits for asynchronous node and fork initialization. |
| `client.tevmCall` | `(params: CallParams): Promise<CallResult>` runs a raw EVM call. Use `addToMempool: true` plus mining for a transaction, or `addToBlockchain: true` to mine that transaction immediately. |
| `client.tevmMine` | `(params?: { blockCount?: number; interval?: number; tx?: Hex }): Promise<MineResult>` mines Tevm transactions. |
| `client.tevmSetAccount` | `(params: { address; balance?; nonce?; deployedBytecode?; storageRoot?; state?; stateDiff? }): Promise<SetAccountResult>` mutates state directly. |
| `client.tevmGetAccount` | `(params: { address; returnStorage?; blockTag? }): Promise<GetAccountResult>` returns balance, nonce, bytecode, roots, flags, and optionally cached storage. |
| `client.tevmDeploy` | `(params: DeployParams): Promise<DeployResult>` ABI-encodes constructor args and submits deployment. Read `createdAddress` and `txHash`, then mine in manual mode. |
| `client.tevmContract` | `(params: ContractParams): Promise<ContractResult>` uses ABI-aware Tevm contract helpers and decodes `data`. |

Import tree-shakeable forms from `tevm/actions`. Their signatures put the client first: `tevmCall(client, params)`, `tevmMine(client, params?)`, `tevmSetAccount(client, params)`, `tevmGetAccount(client, params)`, and `tevmDeploy(client, params)`.

| Viem-compatible group | Common methods |
| --- | --- |
| Public | `getBalance`, `getBlock`, `getBlockNumber`, `getBytecode`, `call`, `estimateGas`, `readContract`, `simulateContract`, `getTransactionReceipt`, `waitForTransactionReceipt` |
| Wallet | `sendTransaction`, `sendRawTransaction`, `writeContract`, `deployContract`, `signMessage`, `signTypedData` |
| Test | `setBalance`, `setCode`, `setNonce`, `setStorageAt`, `mine`, `snapshot`, `revert`, `impersonateAccount`, `setAutomine` |

Keep parameter dialects separate. Tevm mining uses `{ blockCount: 1 }`; viem test mining uses `{ blocks: 1 }`. Tevm account setup uses `{ balance }`; viem `setBalance` uses `{ value }`. Viem `call` models `eth_call`; `tevmCall` adds tracing, access lists, state overrides, transaction creation, and direct EVM controls.

The EIP-1193 shape is `client.request({ method, params })`. Pass `params` as a positional array only for methods that take arguments; omit the key entirely for no-argument methods such as `eth_chainId` and `eth_blockNumber`. In rc.151 those method types declare `params?: undefined`, so `params: []` runs but fails typechecking. For raw Tevm JSON-RPC, `client.transport.tevm.request` also accepts a full `{ jsonrpc: "2.0", id, method: "tevm_call", params: [callParams] }` request and returns JSON-serialized quantities.

## Fork lazily and pin the state

Pass a transport factory, not a URL string. Set `common` for OP-stack rules and fee behavior. Use a bigint `blockTag` or a `blockHash` for reproducibility.

```ts
import { createMemoryClient, http } from "tevm";
import { mainnet, optimism } from "tevm/common";

const forks = [
  {
    name: "mainnet",
    common: mainnet,
    url: "https://ethereum-rpc.publicnode.com",
    blockTag: 19_000_000n,
  },
  {
    name: "optimism",
    common: optimism,
    url: "https://optimism-rpc.publicnode.com",
    blockTag: 120_000_000n,
  },
] as const;

for (const fork of forks) {
  const client = createMemoryClient({
    common: fork.common,
    fork: {
      transport: http(fork.url),
      blockTag: fork.blockTag,
    },
  });
  await client.tevmReady();
  const block = await client.getBlock({ blockTag: "latest" });
  console.log(fork.name, block.number);
  if (block.number !== fork.blockTag) {
    throw new Error(`${fork.name}: expected ${fork.blockTag}, got ${block.number}`);
  }
}
```

At initialization Tevm resolves the chain ID and fork anchor. It does not download chain state. Account records, code, storage slots, proofs, and blocks are requested from the fork transport when an action first touches them, then cached locally. Local writes overlay the fork.

If `blockTag` is omitted or set to `latest`, `tevmReady()` resolves it to a concrete anchor. Pin a bigint in tests. Use `fork.chainId` only to override the exposed chain ID. It does not change the remote chain.

rc.151 limitations matter:

- Mainnet fork block reconstruction can fail on blocks containing EIP-4844 transactions if `common.customCrypto.kzg` is not initialized. The verified example uses a pre-4844 block.
- OP-stack deposit transaction types are filtered during block reconstruction. State-backed execution works, but a reconstructed block hash can differ from the remote block.

## Import Solidity as typed modules

Install the plugin matching the runtime:

| Tool | Package | Export |
| --- | --- | --- |
| Vite and Vitest | `@tevm/vite-plugin@1.0.0-rc.151` | `vitePluginTevm()` |
| Rollup | `@tevm/rollup-plugin@1.0.0-rc.151` | `rollupPluginTevm()` |
| Webpack | `@tevm/webpack-plugin@1.0.0-rc.151` | `new WebpackPluginTevm()` |
| esbuild | `@tevm/esbuild-plugin@1.0.0-rc.151` | `esbuildPluginTevm()` |
| Rspack | `@tevm/rspack-plugin@1.0.0-rc.151` | `rspackPluginTevm()` |
| Bun | `@tevm/bun-plugin@1.0.0-rc.151` | register `bunPluginTevm({})` from a Bun preload |
| RequireJS | `@tevm/requirejs-plugin@1.0.0-rc.151` | `requirejsPluginTevm()` |

The plugin resolves Solidity imports, compiles the dependency graph, and emits Tevm Contract exports with literal ABI types and helpers such as `.read`, `.write`, `.deploy`, and `.withAddress`.

Use `.sol` for ABI and type helpers. Name a deployable module `.s.sol`; rc.151 emits creation and deployed bytecode only for `.s.sol`.

Install `@tevm/ts-plugin@1.0.0-rc.151` and add `{ "name": "@tevm/ts-plugin" }` to `compilerOptions.plugins`. It gives the TypeScript language service editor types, completion, diagnostics, and navigation for Solidity imports. It does not transform runtime imports; the bundler plugin does that. Configure the editor to use the workspace TypeScript version.

`tsc` on the command line does not load language-service plugins, so a plain `tsc --noEmit` reports `TS2307: Cannot find module './Counter.s.sol'`. Typecheck Solidity-importing files in the editor, or exclude them from the `tsc` project and rely on the bundler plugin plus tests. In rc.151 the bundled `tevm-gen` declaration generator fails with `solc.compile is not a function`, so it is not a working substitute.

## Test inside Vitest

Use a deployable Solidity source:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public number;

    constructor(uint256 initialNumber) {
        number = initialNumber;
    }

    function setNumber(uint256 nextNumber) external {
        number = nextNumber;
    }
}
```

Save it as `Counter.s.sol`, then configure Vitest:

```ts
import { defineConfig } from "vitest/config";
import { vitePluginTevm } from "@tevm/vite-plugin";

export default defineConfig({
  plugins: [vitePluginTevm()],
  test: { environment: "node" },
});
```

Run the EVM in the test process:

```ts
import { describe, expect, it } from "vitest";
import { createMemoryClient } from "tevm";
import { Counter } from "./Counter.s.sol";

describe("Counter", () => {
  it("deploys and reads in process", async () => {
    const client = createMemoryClient();
    const deployed = await client.tevmDeploy(Counter.deploy(3n));
    if (!deployed.createdAddress) throw new Error("deployment failed");

    await client.tevmMine();
    const counter = Counter.withAddress(deployed.createdAddress);

    await expect(client.readContract(counter.read.number())).resolves.toBe(3n);
  });
});
```

Compared with Anvil, Tevm needs no process lifecycle or RPC port, keeps ABI types from Solidity import through the assertion, permits direct account and storage mutation without RPC serialization, and exposes EVM traces, access lists, state dumps, snapshots, and custom precompiles inside the test process.

## Avoid these first-run failures

| Mistake | Correction |
| --- | --- |
| `const client = await createMemoryClient()` | Remove `await`. The factory is synchronous. Await `client.tevmReady()` when fork initialization must finish. |
| Read canonical state immediately after a deployment or transaction | The default is manual mining. Call `tevmMine()`, use `miningConfig: { type: "auto" }`, or use `addToBlockchain: true`. |
| Call `client.call` expecting Tevm trace controls | Use `client.tevmCall`. Viem `call` models `eth_call`. |
| Call `client.mine({ blockCount: 1 })` | Use `client.tevmMine({ blockCount: 1 })` or viem `client.mine({ blocks: 1 })`. |
| Use `fork: { url }` or `fork: { transport: url }` | Use `fork: { transport: http(url) }`. Both Tevm's `http` and a viem transport factory satisfy the fork API. |
| Deploy an imported `Contract.sol` | Rename the deployable entry to `Contract.s.sol`; plain `.sol` is ABI-only in rc.151. |
| Assume `returnStorage: true` downloads all fork storage | It returns storage already cached locally. Touch required slots explicitly. |
| Pass `params: []` to `client.request` for a no-argument method | Omit `params` entirely. rc.151 types those methods as `params?: undefined`, so `params: []` is a type error. |
| Run `tsc --noEmit` over a file importing `.sol` and expect it to resolve | The ts-plugin is editor-only. Command-line `tsc` cannot see Solidity modules. |
| Pass a typed Tevm contract helper to viem `readContract` and hit an `authorizationList` type error | Use `client.tevmContract` for that read, or pass an explicit viem parameter object. This is an rc.151 type compatibility gap. |

## Do not use Tevm when

- A production service needs a durable full or archive node, peer-to-peer sync, consensus participation, or an externally reachable RPC service.
- A simple remote read needs only viem and no local execution, fork overlay, trace, or state mutation.
- Exact remote block reconstruction is required for post-4844 mainnet blocks or OP-stack blocks containing deposit transactions under rc.151.
- Independent validation is security critical. Compare against another execution client or a real node.
- The EVM must survive process restarts without explicitly dumping and restoring state.
