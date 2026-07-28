# TODO

## Releasing: we publish through this repo's changesets, not by hand

Do not `npm publish` a package directly. This is a 60-package group with linked
versions; publishing one package by hand desynchronises the rest.

The repo is currently in **changesets prerelease mode on tag `rc`** with 479
queued changesets. `.changeset/pre.json` is the marker. That means:

- `pnpm release:version` while in pre mode produces the next **rc** across the
  whole group (`1.0.0-rc.152`), and leaves the npm `latest` tag alone.
- Getting to a stable `1.0.0` requires `pnpm changeset pre exit` **first**.
  Without that step you never get stable versions, no matter how many times you
  re-tag; you just get another rc.
- `pnpm release:publish` rebuilds all 60 packages (including a Rust release
  build in `bundler-packages/resolutions-rs`) and then runs `changeset publish`.
  It is long and it publishes everything.

Publishing needs a valid npm session. As of 2026-07-28 `npm whoami` returns
`E401 Unauthorized`, so `npm login` has to happen before any release command.

The full ordered promote-to-1.0.0 procedure, with per-package version
assertions and rollback notes, lives in `~/Tevm-Ops/Areas/EF Grant.md` under
`## Release checklist`. Follow that rather than improvising.

## Before 1.0.0 goes out

- [ ] `npm login` (blocks everything below)
- [x] Get `pnpm test:coverage` green. The 13 stale genesis expectations were
      aligned with the intentional 10,000 ETH prefund and Multicall3 predeploy.
      The RequireJS export test now imports its module once during collection,
      removing the five-second dynamic-import timeout under parallel load. See
      `~/Tevm-Ops/Areas/EF Grant.md` under `## Readiness gate` for the exact
      committed-tree gate and totals.
- [ ] Publish `1.0.0-rc.152` so the fork-fidelity fixes reach the registry.
      They are the difference between viem's suite scoring 1,612/3,280 and
      2,805/3,382 against tevm.
- [ ] Then cut stable `1.0.0` via the checklist above.

## Known limitations to state in the release notes

- Arbitrum transaction types `0x6a`-`0x6f` are unsupported. They now raise
  `UnsupportedForkTransactionError` rather than being silently dropped, but the
  limitation is real.
- ZKsync transaction type `0x71` is unsupported (surfaced by the viem suite
  conversion, 103 occurrences).
- Amsterdam / devnet-7 consensus is not modeled. `packages/common/src/Hardfork.ts`
  stops at `osaka` and `zevm`'s `hardfork_schedule.zig` stops at `OSAKA`, while
  upstream revm has moved on. EIP-8037 state gas and block access lists are
  absent from both EVMs.

## Open defects found by running other people's tests

viem's suite was converted to run on `tevm test` in-process (branch
`tevm-in-process-test-harness` on `evmts/viem`). Against a local build it scores
2,805 passed / 497 failed with viem's own assertions untouched. The failures
classify into: watcher and subscription polling that never fires (53), fork
filter and log range handling including `-32602 Invalid block tag` on valid
post-fork blocks (43), ZKsync `0x71` (42), HTTP and WebSocket transports which
are a topology gap rather than a defect (23), and receipt and nonce lifecycle
(13). Details and the full table are in `~/Tevm-Ops/Areas/Anvil API.md`.

---

# Zig Idiomatic Refactoring Checklist

Unrelated to the release above and stale as of 2026-07-27. Kept because it has
not been triaged, not because it is current.

Based on expert advice and Zig language standards, here's the systematic checklist for refactoring all Zig files in `src/evm/**/*.zig`.

## Key Refactoring Patterns to Apply

### 1. Remove unnecessary `const Self = @This();` aliases
### 2. Use `.{}` over `&[_]u8{}` for empty slice literals
### 3. Use standard library modules extensively (`std.mem`, `std.math`)  
### 4. Use `unreachable` instead of `@panic` (does not work with web modules)
### 5. Use `@branchHint(.likely)` and `@branchHint(.unlikely/.cold)` for performance (CONSERVATIVE: only when obvious, use .unlikely for uncommon paths, .cold only for very rare paths)

## File-by-File Checklist

### Access List (3 files)
- [x] `src/evm/access_list/access_list.zig` ✅ Applied idiomatic patterns, added branch hints
- [x] `src/evm/access_list/access_list_storage_key.zig` ✅ Made type public
- [x] `src/evm/access_list/access_list_storage_key_context.zig` ✅ Made type public, fixed import

### Constants (3 files)
- [x] `src/evm/constants/constants.zig` ✅ Already idiomatic, no changes needed
- [x] `src/evm/constants/gas_constants.zig` ✅ Already idiomatic, no changes needed
- [x] `src/evm/constants/memory_limits.zig` ✅ Already idiomatic, no changes needed

### Contract Management (5 files)
- [x] `src/evm/contract/bitvec.zig` ✅ Removed Self alias, simplified error types
- [x] `src/evm/contract/code_analysis.zig` ✅ Removed Self alias, simplified deinit
- [x] `src/evm/contract/contract.zig` ✅ Already idiomatic, const Self needed for module compatibility
- [x] `src/evm/contract/eip_7702_bytecode.zig` ✅ Removed Self alias, used explicit type names
- [x] `src/evm/contract/storage_pool.zig` ✅ Removed Self alias, used explicit type names

### Execution - Opcode Implementations (15 files)
- [x] `src/evm/execution/arithmetic.zig` ✅ Added conservative branch hints
- [x] `src/evm/execution/bitwise.zig` ✅ Added conservative branch hints
- [x] `src/evm/execution/block.zig` ✅ Added branch hints, fixed formatting
- [x] `src/evm/execution/comparison.zig` ✅ Added conservative branch hints
- [ ] `src/evm/execution/control.zig`
- [ ] `src/evm/execution/crypto.zig`
- [ ] `src/evm/execution/environment.zig`
- [x] `src/evm/execution/execution_error.zig` ✅ Removed Self alias
- [x] `src/evm/execution/execution_result.zig` ✅ Removed Self alias
- [ ] `src/evm/execution/log.zig`
- [ ] `src/evm/execution/memory.zig`
- [ ] `src/evm/execution/package.zig`
- [ ] `src/evm/execution/stack.zig`
- [ ] `src/evm/execution/storage.zig`
- [ ] `src/evm/execution/system.zig`

### Hardforks (2 files)
- [ ] `src/evm/hardforks/chain_rules.zig`
- [ ] `src/evm/hardforks/hardfork.zig`

### Jump Table (2 files)
- [ ] `src/evm/jump_table/jump_table.zig`
- [ ] `src/evm/jump_table/operation_config.zig`

### Opcodes (2 files)
- [x] `src/evm/opcodes/opcode.zig` ✅ Removed Self alias
- [x] `src/evm/opcodes/operation.zig` ✅ Removed Self alias, updated NULL constant

### Precompiles (5 files)
- [ ] `src/evm/precompiles/identity.zig`
- [ ] `src/evm/precompiles/precompile_addresses.zig`
- [ ] `src/evm/precompiles/precompile_gas.zig`
- [ ] `src/evm/precompiles/precompile_result.zig`
- [ ] `src/evm/precompiles/precompiles.zig`

### Stack (3 files)
- [ ] `src/evm/stack/stack.zig`
- [ ] `src/evm/stack/stack_validation.zig`
- [ ] `src/evm/stack/validation_patterns.zig`

### State Management (3 files)
- [x] `src/evm/state/evm_log.zig` ✅ Removed Self alias
- [x] `src/evm/state/state.zig` ✅ Removed Self alias
- [x] `src/evm/state/storage_key.zig` ✅ Removed Self alias

### Core Files (12 files)
- [ ] `src/evm/call_result.zig`
- [ ] `src/evm/context.zig`
- [ ] `src/evm/create_result.zig`
- [ ] `src/evm/evm.zig`
- [ ] `src/evm/fee_market.zig`
- [x] `src/evm/frame.zig` ✅ Removed Self alias
- [ ] `src/evm/log.zig`
- [ ] `src/evm/memory.zig`
- [ ] `src/evm/memory_size.zig`
- [ ] `src/evm/run_result.zig`
- [x] `src/evm/vm.zig` ✅ Removed Self alias
- [ ] `src/evm/wasm_stubs.zig`

## Total: 53 files to audit

## Progress Summary
- **Completed**: 22 files ✅
- **Remaining**: 31 files

## Process for Each File
1. **Read file** and understand current structure
2. **Apply approved refactoring patterns**:
   - Remove unnecessary `const Self = @This();` aliases
   - Use `.{}` over `&[_]u8{}` for empty slice literals
   - Use standard library modules extensively (`std.mem`, `std.math`)
   - Use `unreachable` instead of `@panic` (does not work with web modules)
   - Use `@branchHint(.likely)` and `@branchHint(.unlikely/.cold)` for performance (CONSERVATIVE: only when obvious)
3. **Test with** `zig build test-all` to ensure no regressions
4. **Commit changes** with descriptive message
5. **Check off** in this list

## Original Prompt
As requested, including the original prompt that led to these changes:

<prompt><intro>You are going to do a large scale refactor as a zig bot. Your goal is to only focus on idiomatic language usage as well as optimal performance. I will share the entire language spec so you can play role as language expert. I will also share std lib context</intro><context><language-spec>[Pasted text #1 +11852 lines]</language-spec><std><link>https://ziglang.org/documentation/master/std/</link>visit the docs here and casually explore the std docs to become familiar</std></context><steps><step>read src/evm/README.md to become familiar with project. Note we are only interested in src/evm/**/*.zig<step><step>make a markdown todo list of every file in the evm package</step><while condition="list is not done"><step>grab next item on list</step><step>Audit that file and fix any idiomatic zig things regarding more idiomatic use of language, better use of standard library, or more performant code</step><step>make sure no regressions via running all tests `zig build test-all`</step></while><steps><IMPORTANT>You should use git submodules. make a branch. Then check it out in g/<branch name> wwork on isolation. Commit as you work. Once your job is complete and you deleted the todo file please squash all your commits together into a single commit with message aggregating the stylestic changes you made as well as including this original prompt. You may want to include original prompt in your todo file so you don't forget it.<success-criteria>every file in src/evm/**/*.zig is audited for idiomatic performant zig code making great use of standard library</success-criteria><links><>standard lib https://ziglang.org/documentation/master/std/</><>language https://ziglang.org/documentation/master/</></links></prompt>
