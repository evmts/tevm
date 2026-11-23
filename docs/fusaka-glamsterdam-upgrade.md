# Fusaka and Glamsterdam stack upgrade

Status: implementation in progress. This document tracks the complete upgrade
across TEVM, Voltaire, Guillotine, Guillotine Mini, and ZEVM. A fork name in an
enum or a generated test target is not evidence of protocol conformance.

The requested deliverable covers Fusaka and all Glamsterdam implementation,
spec tests, validation and documentation across these five repositories. This
ledger records that shared scope and remaining work; individual implementation
entries are incremental results within it, not separate upgrade proposals or
claims that the whole deliverable is complete.

## Specification baseline

Checked on 2026-09-05. These upstream revisions pin the implementation target;
Glamsterdam has no confirmed mainnet activation timestamp. Implement its rules
behind explicit configuration until activation is specified.

| Upstream | Revision |
| --- | --- |
| ethereum/EIPs | `9207c6011f526bd40abd79649484a1a342585bd4` |
| ethereum/execution-specs | `903b48f152c932f6e47a615f0f7f009c56f1d92b` |
| ethereum/execution-apis | `2ab543851a206ec2836cb387b3aa9cb33c646938` |
| ethereum/consensus-specs | `6805f6a66e831f909f468fa595782e5cc8e5bd9f` |
| ethereum/execution-spec-tests | `10eaa63d5da2f50b63d4359968f36542212f9f50` |
| ethereum/devp2p | `2c19a28b25c29487773ad6b07243e290fa8d65ec` |

Normative scope: [Fusaka meta EIP](https://eips.ethereum.org/EIPS/eip-7607)
and [Glamsterdam meta EIP](https://eips.ethereum.org/EIPS/eip-7773).
Reconcile individual EIPs, executable specifications, Engine APIs, and fixture
revisions before marking an item verified. Record disagreements explicitly.

## Required protocol coverage

Every item below remains open until implementation and relevant validation are
recorded. Consensus changes require an ownership audit: implement every affected
primitive, payload, API, and client integration in this stack; document which
validator duties belong to an external consensus client and validate interoperability.

| Fork | EIPs and work |
| --- | --- |
| Fusaka execution | 7823 ModExp bounds; 7825 transaction gas cap; 7883 ModExp pricing; 7918 blob fee floor; 7934 block size limit; 7939 CLZ; 7951 secp256r1 |
| Fusaka integration | 7594 PeerDAS; 7917 proposer lookahead; 7892 BPO schedules; 7642 eth/69; 7910 eth_config; 7935 default block gas limit |
| Glamsterdam execution | 2780 intrinsic gas; 7708 ETH transfer logs; 7778 block gas accounting; 7843 SLOTNUM; 7928 block access lists; 7954 code size; 7976 calldata floor; 7981 access list pricing; 7997 factory predeploy; 8024 stack instructions; 8037 state creation accounting; 8038 state access pricing; 8246 SELFDESTRUCT burn removal |
| Glamsterdam integration | 7688 consensus structures; 7732 ePBS; 8045 proposer exclusions; 8061 churn; 8282 builder execution requests |
| Glamsterdam networking | 7975 eth/70 receipts; 8070 eth/72 blobpool; 8136 data column deltas; 8159 eth/71 BAL exchange; 8189 snap/2 |
| Informational specifications | 7904 gas analysis; 8261 gas limit schedule |

## Acceptance evidence

- Voltaire: all affected Zig, TypeScript, Rust, C and WASM surfaces, opcode/fork
  metadata, gas constants, crypto, precompiles, block/transaction types, encoding,
  schemas, and public exports agree with the pinned specifications.
- Guillotine and Guillotine Mini: execution, tracing, dispatch, bytecode analysis,
  historical fork guards, transaction execution and client modules implement the
  applicable rules; upstream fixtures and differential tests prove behavior.
- ZEVM: schedules, transaction pool admission, mining, block import/validation,
  receipts, state, fork backend, networking, JSON-RPC and Engine API agree.
- TEVM: public configuration/types, native bindings, defaults, facade exports,
  JSON-RPC behavior, examples and documentation expose the working upgrades.
- Validation: obtain pinned upstream corpora, count executed vectors, reject empty
  success, run historical and transition cases, rebuild native artifacts and run
  cross-stack integration tests. Update spec runners rather than filtering away
  unsupported fixture formats or failing vectors.
- Documentation and release metadata: synchronize references, generated surfaces,
  examples, changesets and dependency provenance in each repository.
- Final gates: nearest coverage, typechecks and lints; TEVM source integrity,
  repository metadata checks and agent lints; all remaining failures resolved.

## Initial evidence

- TEVM's native siblings match its recorded revisions. Local changes already
  exist in Voltaire, Guillotine, Guillotine Mini and ZEVM; preserve them.
- ZEVM's default development schedule enables Cancun and disables Prague/Osaka.
  Mainnet's schedule recognizes Osaka, but its block builder still ends at Prague.
- Guillotine Mini rejects `0x1e`; its unit test aggregator omits the existing
  bitwise handler tests. Its execution-specs submodule predates the current baseline.
- Baseline `zig build unit` in Guillotine Mini passed with Zig 0.15.2.
- TEVM `pnpm factory:preflight` ran with Node 24.12.0 and pnpm 10.33.4;
  it failed the Codex CLI version check (`0.145.0`). All other reported checks
  passed. No network integration credentials were used.

## Implementation and validation log

No protocol item is yet verified across the entire stack.

### EIP-7939

- Guillotine Mini: implemented CLZ in both dispatchers and trace naming. Added
  tests for all 257 leading-bit counts, lower-bit patterns, fork rejection,
  exact five-gas charging, underflow, full-stack replacement and static execution.
  Enabled the previously omitted bitwise suite, corrected its reversed BYTE/shift
  operands without changing expected outputs, and removed duplicate cleanup.
  `zig build unit --summary all`: 1069 passed, 1 existing skip.
- Voltaire: Zig and TypeScript opcode metadata, classification, gas/stack
  contract and docs updated; Zig EIP registry includes 7939 in Osaka. Opcode
  Vitest suite: 205 passing tests. Runtime JavaScript coverage: 99.01% lines,
  91.41% branches. Those initial Zig passes omitted the affected inline tests;
  the root now explicitly includes opcode, hardfork, and header modules. Their
  transitive tests exposed additional primitive and fixture defects being fixed.
  TypeScript `tsc --noEmit` and the branded CLZ type test pass.
- TEVM: added a native JSON-RPC test for pending block contexts immediately
  before and at timestamp 1764798551. It failed against the old addon as expected.
  Rebuilt the addon from current sibling source. `//packages/node:testCoverage`
  passes (100% lines, 92.68% branches), as do typecheck and lint. The test asserts
  genesis timestamp zero so activation is independent of wall time. The complete
  node coverage target needed loopback permission for its existing local fork RPC
  fixture; that permission and fixture inputs are now declared. `//:agentLints`
  passes after recording that dependency. Source integrity passes; repository
  metadata passes from cache. No remote RPC credentials were used.
- Guillotine: baseline build initially failed due to a mutable clap master URL.
  Pinned its direct and vendored dependency to compatible commit
  `5289e0753cd274d65344bef1c114284c633536ea`, with the hash verified by Zig.
  A fresh cache also exposed the mutable zBench URL: pinned the existing 0.11.2
  content to `2bdf0c62c5bf761d282e889e34fb33bc41484e6f`, preserving its verified
  hash. Full build now passes. CLZ metadata, dispatch, optimized execution,
  reference tracing and explicit frame fork propagation are implemented. Tests
  compare all 257 leading-bit positions, Prague rejection and exact gas against
  MinimalEvm with fusion on/off. The initial fixture incorrectly omitted intrinsic
  gas; corrected it before assessing opcode behavior. Boundary, full-stack and
  static-call cases pass. The complete opcode suite passes (627 tests), and the
  final `zig build` passes.

### Additional verified gap

ZEVM mining from empty mainnet-configured genesis at the Osaka timestamp fails
with `MissingSystemContractCode` in the Prague system-call path. Install and test
the actual required system contracts as part of genesis/activation support; do
not suppress the validation or substitute empty bytecode.

### Validation infrastructure and supporting fixes

- Guillotine CLZ result-return tests exposed missing runtime memory-expansion gas
  in fused MLOAD/MSTORE/MSTORE8 handlers. Added dynamic charging before access;
  unfused and fused CLZ results now agree at 26 execution gas. Added focused
  expansion and already-expanded-memory checks. Expected invalid-opcode, stack
  and gas exhaustion outcomes now use debug logging; unexpected client failures
  retain error logging. The complete 627-test opcode gate passes. First-block
  accounting now reads original instructions so fusion cannot hide stack inputs
  or change static gas charges. The full gate builds one aggregate executable;
  all 138 opcode test files remain imported, and individual targets remain usable.
- Guillotine's reference interpreter uses `initPtr` in the new tests: its by-value
  constructor leaves allocator pointers referring to a moved arena. The broader
  constructor API issue remains open and must be repaired, not hidden by tests.
- The global Zig cache disappeared during validation. Subsequent Zig runs use
  `--global-cache-dir /tmp/tevm-fusaka-zig-global`. Run Guillotine build and opcode
  gates sequentially: its vendored BLST shell build writes shared object files.
- Current upstream fixtures are published by execution-specs, not the older
  execution-spec-tests release stream. Downloaded `tests@v20.0.2` (2026-08-27),
  verified SHA-256 `1280540950a4c3470a421416b6f35458a9b635827265c29e5aef1ae839ae1788`
  against GitHub's release digest. Mini passes all 14 Osaka blockchain fixture
  files (598 cases), and all 14 Osaka state fixture files (598 cases). These
  exercise the runner's post-state checks; state roots, receipt commitments, every
  transaction index, expected exceptions, and Engine validation still need audit.
  The separate Prague-to-Osaka transition case fails a storage assertion and
  exposes a trace-diff allocation leak. Do not claim full fork conformance.
- Guillotine Mini now has `zig build spec-fixture -Dfixture=/absolute/file.json`
  to run each case through its existing spec runner without modifying generated
  wrappers or the spec submodule. Empty files, skipped cases and errors fail the
  gate. An empty JSON object was explicitly tested and fails. The assembler now
  emits immediate PUSH operands correctly and does not append an extra STOP to
  curly-brace code (which changed CODESIZE). Its two tests pass.

### Header prerequisites and primitive validation

- Voltaire preserves EIP-7685 `requestsHash` through TypeScript construction, RPC
  conversion and hashing, and Zig header RLP encoding/decoding. The TypeScript
  test verifies an exact Osaka block hash from the pinned CLZ fixture. Mini's
  fixture header parser now preserves roots, bloom, beneficiary, blob fields,
  parent beacon root and requests hash needed to hash the parent correctly.
- Combined TypeScript Opcode/BlockHeader validation: 228 tests pass, 99.04% line
  and 92.3% branch coverage. Typecheck and focused Biome checks pass.
- The expanded Zig gate revealed stale type assumptions, mismatched CREATE
  fixture senders, CREATE2 salt endianness errors in tests, and incorrect RLP
  nesting fixtures. Expected addresses are preserved; inputs were reconciled
  against viem 2.49.3 and EIP-1014. Mainnet block 1 fields now match the
  execution-specs reference asset, and TypeScript asserts its exact hash.
- Fixed a Merkle-root use-after-free by compacting tree levels in one owned
  buffer. Fixed allocation-free hash parsing with and without the documented
  hex prefix and case-insensitive fork-transition parsing.
- A focused regression proved Zig header decoding discarded `extra_data`.
  Decoding now preserves it with explicit caller ownership. The expanded Zig
  gate passes all 540 tests, and `zig build` passes. ZEVM's ommer import path
  now transfers ownership of this allocation to its imported body, with a focused
  preservation/cleanup regression; `zig build test` passes all 549 ZEVM tests.
  TEVM `//:agentLints` passes again (some verdicts served from cache).
- `Hash.keccak256Hex` still uses a test-only allocator and needs a
  production-safe implementation.

### Cache validity

The native addon rebuilt successfully after the header changes. The subsequent
`//packages/node:testCoverage` result was a cache hit: its declared inputs omit
sibling native source/artifact changes. A direct `vitest run --coverage` passed
against the rebuilt addon (100% lines, 92.68% branches). The final factory coverage run also executed and passed all 10 tests.
`scripts/factory/build-native.mjs` now writes the addon's SHA-256 to the
gitignored `factory/native-addon.sha256`. The `test` and `testCoverage` targets
of `packages/node`, `packages/memory-client` and `packages/server` declare that
stamp, so a rebuilt addon re-keys them. After building `../zevm` by another
route, run `node scripts/factory/native-addon-stamp.mjs` or use `--no-cache`.
`S.NodeModule` references key only the installed version and would not repair
this gap.

### EIP-7825 (in progress)

ZEVM's public transaction error/options contract and normative docs now specify
the Osaka 2^24 gas cap, historical behavior, and non-validating simulation bypass.
The regression first failed because oversized Osaka transactions executed.
The shared validation now runs during processing, RPC admission/signing, and
validating simulation. All 555 ZEVM tests pass, covering oversized envelopes, exact-boundary and
historical execution, admission timestamps, simulation bypass versus block gas
limits, exact RPC errors with unchanged pool/state, and supplied-block rejection
even when packing would skip the oversized transaction. The TEVM wire regression
failed against the old addon as expected. Rebuilding succeeded and direct native
coverage passes all 10 tests (100% lines, 92.68% branches); typecheck, lint and
agent lints pass. The node README and a changeset describe the cap.
The pinned upstream corpus contains 37 Osaka blockchain and 35 Osaka state
EIP-7825 cases, extracted for the next validation pass. Other stack consumers,
upstream validation, and remaining documentation/release surfaces are open.

### Identified validation repair

Mini's original blockchain runner stopped on `expectException` even when its
validator raised no error, and its state runner skipped post-state checks for
expected transaction exceptions. Those paths could not establish rejection
proofs. The repair below removes those shortcuts; per-block transition execution
is still open. Mini's client helpers enforce the cap; interpreter-only calls
retain their EVM gas semantics.

### Shared cap and Mini client validation

- Voltaire exports `GasConstants.TxGasLimitOsaka` in TypeScript and Zig; ZEVM and
  Mini share that value. GasConstants validation passes 173 TypeScript tests,
  including literal type and public barrel coverage (91.97% lines, 89.24%
  branches). Typecheck and focused Biome checks pass.
- Mini client validation and pool helpers initially failed their new cap
  regressions, then passed after enforcing the Osaka rule. A null/higher pool
  policy cannot bypass it; lower limits still apply. `TxPoolConfig.hardfork`
  exposes the pending fork explicitly and must be updated at transitions.
- Testing all five envelope types exposed stale assertions that EIP-2930 was
  absent from Voltaire. Restored its static validation, Berlin gating, access-list
  charging, gas-price handling and pool helper support. Replaced the placeholder
  size test with a signed envelope boundary independently checked with viem
  2.49.3. Mini `zig build unit` passes 1072 tests with 1 existing skip.
  Voltaire's shared-constant Zig test/build gates pass (540 tests), and ZEVM's
  consumer gate passes all 555 tests.
- Mini's client README documents cap ownership/configuration and the remaining
  fixture-runner limitations. Full client wiring, invalid-fixture rejection
  proofs and cross-stack protocol verification remain open.

### Final checks for the current implementation slice

- Rebuilt the native addon after centralizing the cap. The factory node coverage
  target passes with `--no-cache` (10 tests, 100% lines, 92.68% branches).
  Source integrity and repository metadata checks pass.
- An external fixture containing only `{"empty": {}}` incorrectly passed the
  original wrapper. Added required pre-state, expected-state, environment and
  execution-shape checks plus focused regressions. It now fails with
  `MissingFixturePreState`; the positive upstream fixture and three wrapper/
  assembler tests pass. Re-ran all 598 Osaka CLZ blockchain cases and all 598
  Osaka CLZ state cases successfully with the corrected wrapper.
- These checks do not resolve the independently observed transition failure,
  missing system-contract genesis setup, native
  cache-key gap, remaining Fusaka EIPs, or Glamsterdam implementation. The overall
  upgrade remains in progress.

### Mini expected-error proof repair

- Regression tests first proved that both state and decoded-block fixtures
  accepted a wrong expected exception. The runner now requires an actual
  rejection with a complete matching identifier (including explicit alternatives),
  rejects unobserved exceptions, and validates the post-state after rejection.
  Controls cover missing/wrong expectations, misleading identifier suffixes,
  legal cap boundaries, incorrect rejected-state nonces, and distinct intrinsic
  versus calldata-floor errors.
- Block admission reads `rlp_decoded.transactions`, checks the shared Osaka cap,
  individual transaction/block gas limits and shared intrinsic/floor accounting
  before effects. Rejected blocks do not receive system calls or withdrawals.
  Unknown block rejection paths fail explicitly. The runner no longer silently
  accepts multiple post variants or nonzero transaction indexes; independent
  execution for those formats remains to be implemented.
- Using execution-specs `tests@v20.0.2`, the corrected runner passes 35/35 Osaka
  EIP-7825 state cases and 36/37 blockchain cases. The remaining block case has
  eight cap-sized transactions and requires tracking gas available after prior
  transactions. Summing declared limits would be incorrect; this needs the
  per-block execution repair. All 598 CLZ state and 598 CLZ blockchain cases
  still pass. These counts do not prove RLP, state-root, receipt or Engine API
  commitments, which remain open.
- Added the upstream negative block case with release/archive provenance to
  Mini's runner regression fixtures. The fixture target also runs seven wrapper,
  runner and assembler tests. Fixed ownership of the allocated trace-diff field
  on failure paths; the failing transition now reports its storage mismatch
  without an allocator leak. The broader fork transition remains unresolved.
- Mini `zig build unit --summary all` passes 1072 tests with one existing skip.
  Zig formatting and focused diff checks pass. TEVM `//:agentLints` passes;
  several verdicts are cached, and its scope does not review sibling-repository
  runtime diffs. No native rebuild was needed for this test-runner-only change.

### Mini per-block execution repair

- The original runner flattened all blocks into one context. It now initializes
  pre-state once and executes each candidate with its own fork, timestamp, number,
  fees, system calls and withdrawals. Transition names resolve through Voltaire's
  `ForkTransition`; parent history advances only after an accepted block.
- Admission checks each transaction against remaining block gas, then accounts
  for actual gas used after refunds. A rejected block restores an independently
  owned state snapshot, including earlier transaction and system-call effects,
  before the next candidate runs. Snapshot and code-replacement ownership have
  allocator-backed regression coverage.
- Both previously failing upstream fixtures now pass: the three-block
  Prague-to-Osaka CLZ transition and cumulative gas rejection. Controls also
  prove that rejection does not stop a subsequent valid block and that eight
  legal cap-sized STOP calls fit when their actual usage fits, despite their
  declared limits summing above the block limit. Mutated controls explicitly
  exercise decoded execution, not their retained RLP or commitments.
- Execution-specs `tests@v20.0.2`: all 37 Osaka EIP-7825 blockchain cases, 35
  state cases, 598 Osaka CLZ blockchain cases, 598 state cases, and the separate
  transition case pass. The fixture executable runs 11 wrapper, runner, snapshot
  and assembler tests. The two upstream regression files and their provenance
  are retained in Mini's local fixture directory.
- Mini's unit gate passes 1072 tests with one existing skip. Zig formatting,
  focused diff checks and TEVM `//:agentLints` pass; the latter includes cached
  verdicts and does not substitute for review of sibling changes.
- Remaining validation work includes all post variants/indexes, RLP and block
  commitments, other rejection reasons, broader historical/transition coverage,
  and Engine API execution. These runner repairs do not establish full-stack
  Fusaka conformance or implement the remaining Glamsterdam requirements.

### EIP-7823 and EIP-7883

- Canonical Voltaire Zig now enforces each 1,024-byte operand bound before
  empty-output shortcuts and selects the EIP-198, EIP-2565 or EIP-7883 gas
  schedule. Osaka charges long-exponent gas even with an empty modulus. Offset
  arithmetic is checked. The explicitly included crypto/precompile suites pass
  650 tests; the full Zig build passes. Enabling those tests also required
  replacing removed atomic-fence APIs with Zig's volatile secure-zero helper and
  correcting mathematically invalid legacy fixture expectations.
- Voltaire TypeScript uses one exact bigint pricing implementation for both
  public gas helpers, with an optional branded hardfork (Berlin by default).
  The precompile dispatcher forwards the fork; execution right-pads partial
  input, returns modulus-sized zero output, consumes forwarded gas on exceptional
  failure, and applies Osaka bounds. Focused runtime/type coverage passes 247
  tests; whole-package typecheck passes. The gas wrapper has 100% coverage;
  coverage of the broader GasConstants precompile helper file is lower because
  it also contains unrelated helpers. This is not whole-EVM coverage.
- Mini passes all 2,220 ModExp cases extracted from the verified
  `tests@v20.0.2` archive: blockchain and state cases for Berlin, London, Paris,
  Shanghai, Cancun, Prague and Osaka, plus two Prague-to-Osaka block transitions.
  Historical blockchain cases exposed missing mining rewards in the fixture
  runner. Rewards now follow Frontier/Byzantium/Constantinople and disappear at
  Merge, including ommer and inclusion rewards inside the rollback snapshot.
  An unmodified Berlin fixture is retained locally with provenance. Mini's unit
  gate passes 1,072 tests with one existing skip. Existing commitment/index/Engine
  validation limitations still apply to these corpus results.
- TEVM's exact JSON-RPC regression failed against the previous native addon,
  then passed after rebuilding from sibling source. It exercises 499/500-gas
  calls and 1,024/1,025-byte operands immediately before/at mainnet Osaka.
  Node coverage ran with cache disabled: 100% lines and 92.68% branches. Node
  lint passes; its typecheck passes from cache. ZEVM's full `zig build test`
  also passes against the updated canonical dependencies.
- Guillotine's vendored ModExp is synchronized, including historical padding,
  arithmetic overflow and modulus-one fixes. Its exact-fork precompile lookup
  omitted successor forks including Osaka; it now preserves active precompiles.
  Differential STATICCALL tests exposed an extra 40-gas reference charge and a
  frame-owner cast that executed nested calls through default Cancun rules.
  Frames now recover their concrete configured parent, and the reference
  STATICCALL charges the fork's access price exactly. The 36-case Prague/Osaka,
  fusion-on/off matrix asserts success words and total gas. The new `test-modexp`
  gate explicitly executes 47 arithmetic and 24 precompile inline tests; it is
  included in `test-opcodes`. The complete gate passes 700 tests, and the full
  build passes. These results establish the tested ModExp paths, not complete
  hardfork or Engine API conformance.

- Additional prerequisite discovered during the precompile audit: both Voltaire
  Zig dispatcher copies still expose an older nine-operation BLS address layout
  through `0x13`. Reconcile them and the TypeScript dispatcher with [EIP-2537's final seven-operation layout](https://eips.ethereum.org/EIPS/eip-2537)
  (`0x0b` through `0x11`) before claiming Prague/Osaka precompile coverage.
  The ModExp work does not establish BLS conformance.

- Final TEVM review found missing pre-Osaka transaction submission assertions.
  Added isolated-pool checks for managed and raw submission, exact wire hashes,
  JSON serialization and the retained oversized gas quantity. Node coverage and
  lint pass; regression proof review now passes. Source integrity passes and
  repository metadata passes from cache. `//:agentLints` remains red solely
  because scope coherence classifies this requested cross-repository upgrade
  ledger as independent from the incremental native implementation. The ledger
  is retained to fulfill the requested whole-stack scope; the check is unchanged.
  Barrel, RPC-contract and docs-parity reviews were vacuous for this diff.
- The downloaded ModExp corpus run is currently a manual validation result;
  persisting/reproducing the complete upstream corpus in automated gates remains
  part of the broader validation work.
