---
name: zevm
description: >-
  Build, embed, and extend the Zevm Zig execution implementation. Use for the
  trusted JSON-RPC development node, proof-verified light client, lazy fork
  runtime, Zig block execution library, C or Swift FFI integration, and native
  Node addon work in the evmts Zevm repository.
---

# Zevm

Use the Zevm source checkout and its pinned dependencies. Zevm requires Zig 0.15.2.

## Choose the right surface

Zevm is a Zig Ethereum execution implementation with three product surfaces:

| Need | Surface |
| --- | --- |
| Local or forked development RPC | `zevm --mode trusted`, with Ethereum, Anvil, EVM, and txpool namespaces |
| Proof-verified reads | `zevm --mode light` or the light-client C ABI |
| Embed execution | Import the `zevm` Zig module, or link `libzevm` through `zevm.h` |

Use Zevm when native code, a standalone JSON-RPC node, proof-backed light reads, block processing, or a C-compatible library is required. Use Tevm when the caller is JavaScript or TypeScript and needs typed Solidity imports and an in-process viem-compatible client.

## Build from source

Run from the Zevm repository root:

```sh
zig build --fetch
zig build -Doptimize=ReleaseSafe
zig build c-ffi -Doptimize=ReleaseSafe
zig build c-smoke -Doptimize=ReleaseSafe
```

| Command | Output |
| --- | --- |
| `zig build` | `zig-out/bin/zevm` |
| `zig build run -- --mode trusted --host 127.0.0.1 --port 8545` | trusted development JSON-RPC node |
| `zig build test` | default unit and integration test graph |
| `zig build c-ffi` | `zig-out/lib/libzevm.a`, platform shared library, and `zig-out/include/zevm.h` |
| `zig build npm-native` | local N-API addon at `zig-out/npm/native/zevm.node` |
| `zig build verify-fast` | local release-oriented checks |

Do not replace `build.zig.zon` dependency URLs with sibling paths. The package pins Voltaire and Guillotine Mini by URL and hash.

## Embed the C ABI

The ABI is handle-based and currently exposes the proof-verified light client. Link the shared library in rc builds unless the host build system also supplies the static library's transitive crypto objects.

```c
#include <stdio.h>
#include "zevm.h"

int main(void) {
    if (zevm_abi_version() != ZEVM_ABI_VERSION) return 1;

    ZevmHandle *handle = zevm_light_init(
        ZEVM_NETWORK_MAINNET,
        "http://127.0.0.1:0/beacon",
        "http://127.0.0.1:0/execution");
    if (handle == NULL) return 2;

    printf("zevm %s, network=%s, status=%d\n",
           zevm_version(),
           zevm_light_network_name(ZEVM_NETWORK_MAINNET),
           zevm_light_status(handle));

    zevm_light_shutdown(handle);
    return 0;
}
```

After `zig build c-ffi`, compile against `zig-out/include` and `zig-out/lib`. Add a runtime search path for the shared library or install it in the host's normal library path.

| C function | Contract |
| --- | --- |
| `zevm_abi_version()` | Return the numeric ABI version. Check it before using a dynamically loaded library. |
| `zevm_version()` | Return a static package version string. |
| `zevm_error_message(code)` | Return a static message for a `ZEVM_*` return code. |
| `zevm_light_init(network, beacon_url, execution_url)` | Allocate a `ZevmHandle`; return `NULL` on invalid network or allocation failure. |
| `zevm_light_shutdown(handle)` | Free the handle; `NULL` is allowed. |
| `zevm_light_sync_step(handle)` | Perform blocking beacon HTTP work. Run it away from a UI or async event-loop thread. |
| `zevm_light_status(handle)` | Return `ZEVM_STATUS_NOT_SYNCED`, `SYNCING`, or `SYNCED`. |
| `zevm_light_get_balance` | Return a verified balance as lowercase quantity hex. |
| `zevm_light_get_transaction_count` | Return a verified nonce through `uint64_t *out_count`. |
| `zevm_light_get_code` | Copy verified raw code bytes to a caller-owned buffer. |
| `zevm_light_get_storage` | Return a verified 32-byte storage value as padded hex. |
| `zevm_light_last_error(handle)` | Return handle-owned text valid only until the next call on that handle. |

For output buffers, pass capacity in `*out_len`. On `ZEVM_ERR_BUFFER_TOO_SMALL`, allocate the required length reported through the same pointer and retry. Serialize calls on one handle. Separate handles may be used concurrently.

## Embed the Zig execution library

Add Zevm as a Zig package dependency, import its module as `@import("zevm")`, and select the narrow module needed:

| Root export | Use |
| --- | --- |
| `database` | `Database`, `Accounts`, and `Contracts` state storage |
| `tx_processor` | `ExecutionTx`, intrinsic gas, `processTransaction`, and `processTransactionWithOptions` |
| `block_builder` | build blocks, validate headers and blocks, compute roots, apply withdrawals and rewards |
| `consensus_verifier` | verify and apply light-client bootstrap and updates |
| `chain_import` | decode and import concatenated RLP block streams |
| `mpt_proof` | Merkle Patricia proof construction and verification |
| `mining` | automatic, manual, and interval mining configuration |
| `host_adapter` | bridge state and block context into Guillotine Mini execution |
| `rpc` | dispatcher, handlers, server, and development runtime |
| `config` | JSON and CLI configuration loading and diagnostics |

Prefer the public exports in `src/root.zig`. Do not import private files by relative path. The public module already wires Voltaire primitives, state manager, blockchain, crypto, precompiles, Guillotine Mini, and JSON-RPC dependencies.

## Know the runtime modes

| Mode | Behavior |
| --- | --- |
| Trusted | Mutable development chain, optional genesis, lazy execution fork, txpool, mining, snapshots, and development RPC controls |
| Light | Checkpointed consensus sync plus verified execution proofs and a separate Engine API endpoint |

Trusted lazy forking uses `--fork-url` and optional `--fork-block-number`. It reads remote state and proofs on demand. Mining supports `--mining auto`, `manual`, or `interval` plus `--block-time`.

The HTTP server accepts single requests, batches, and notifications. Method availability depends on runtime mode. Treat JSON-RPC error `-32010` as a mode mismatch, not a missing method.

## Relate Zevm to Tevm precisely

| Tevm | Zevm |
| --- | --- |
| TypeScript package and in-process viem client | Zig execution implementation and standalone/native surfaces |
| Solidity import compiler and TypeScript language tooling | No Solidity-to-TypeScript bundler |
| Direct `tevmCall`, account mutation, and memory-client actions | Ethereum-compatible JSON-RPC, trusted development controls, and public Zig modules |
| Best default for JS/TS simulation and Vitest | Best fit for native embedding, proof-verified light reads, or a standalone node |

Both live in the evmts ecosystem and share Ethereum execution goals. They are not API aliases. Do not replace `createMemoryClient` with Zevm or assume `@evmts/zevm` provides Tevm's typed contract surface.

## Current cautions

- The source-first package version is currently `0.0.0`; do not infer maturity from the number or invent a Tevm-style rc version.
- `zevm_light_sync_step` is synchronous and performs network I/O.
- C output memory belongs to the caller; error text belongs to the handle.
- Directly linking `libzevm.a` with a plain C compiler can leave BLST symbols unresolved. `zig build c-smoke` succeeds because the Zevm build graph supplies required objects. Prefer the shared library or integrate through Zig until the static artifact is self-contained.
- Zevm's npm package is a native-addon wrapper and compatibility package set. It is not the Tevm memory client.
