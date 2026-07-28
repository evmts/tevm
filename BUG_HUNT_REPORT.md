# Bug Hunt Report — tevm + zevm

Raw findings: 48 | Confirmed: 42 | Refuted: 6

Severity: 2 critical, 10 high, 15 medium, 15 low


---

## [1] CRITICAL — EIP-7623 calldata floor applied before refund and inflates refund cap (consensus gas mismatch)

- **Group:** zevm:evm-core  **Category:** consensus
- **Location:** `/Users/williamcory/zevm/src/tx_processor.zig:539-547 (processTransactionWithOptions)`

**What's wrong:** The EIP-7623 calldata floor and the gas-refund are combined in the wrong order, producing a final billed gas amount that (a) can fall below the mandated floor and (b) uses an inflated refund cap. Per EIP-7623 the algorithm is: gas_used_without_floor = intrinsic + execution_gas_consumed; refund is capped at gas_used_without_floor / 5 (London+) and subtracted from gas_used_without_floor; THEN the result is raised to the floor: total = max(gas_used_without_floor - refund, floor). The floor is a hard lower bound applied AFTER refunds and the refund cap must be derived from the non-floored gas. This code instead applies the floor first (total_gas_used = max(intrinsic+gas_consumed, floor)), derives the refund cap from that floored value (total_gas_used/5), and subtracts the refund from the floored value (effective_gas_used = total_gas_used - refund). When the floor dominates, this both raises the refund cap above the legal limit and drops the final gas used below the floor, undercharging the sender, reducing the burned base fee and the coinbase tip, and corrupting cumulative_gas_used in the block. This is a Prague (and later) consensus divergence.

**Evidence:**
Lines 539-547:
  const gas_consumed = if (result.gas_left > execution_gas) 0 else execution_gas - result.gas_left;
  const total_gas_used = @max(intrinsic + gas_consumed, gas_floor);
  const max_refund = if (hardfork.isAtLeast(.LONDON)) total_gas_used / 5 else total_gas_used / 2;
  const refund_counter = std.math.add(u64, result.refund_counter, authorization_refund) catch maxInt;
  const refund = @min(refund_counter, max_refund);
  const effective_gas_used = total_gas_used - refund;

Triggering scenario (Prague tx, large zero-byte calldata so floor dominates, with an SSTORE-clear refund):
  intrinsic + gas_consumed = 100_000
  gas_floor = 200_000  (e.g. many calldata tokens at PRAGUE_CALLDATA_FLOOR_GAS_PER_TOKEN)
  result.refund_counter = 50_000
Correct (EIP-7623):
  refund_cap = 100_000/5 = 20_000; after_refund = 80_000; total = max(80_000, 200_000) = 200_000
This code:
  total_gas_used = max(100_000,200_000) = 200_000
  max_refund = 200_000/5 = 40_000; refund = min(50_000,40_000) = 40_000
  effective_gas_used = 200_000 - 40_000 = 160_000  (40_000 gas undercharged, below the 200_000 floor)
The wrong effective_gas_used (160_000) then flows into charged_gas_wei (line 550), the caller refund (line 556), the burned base fee / coinbase priority payment (lines 562-566) and the receipt gas_used/cumulative_gas_used (lines 587-592).

**Suggested fix:** Compute the floor after refunds and cap the refund on the non-floored value, e.g.:
  const gas_used_without_floor = intrinsic + gas_consumed;
  const max_refund = if (hardfork.isAtLeast(.LONDON)) gas_used_without_floor / 5 else gas_used_without_floor / 2;
  const refund = @min(refund_counter, max_refund);
  const effective_gas_used = @max(gas_used_without_floor - refund, gas_floor);

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/zevm/src/tx_processor.zig lines 539-547. The code computes:
  total_gas_used = @max(intrinsic + gas_consumed, gas_floor)   // floor applied FIRST
  max_refund = total_gas_used / 5 (LONDON+)                    // refund cap derived from FLOORED value
  refund = @min(refund_counter, max_refund)
  effective_gas_used = total_gas_used - refund                 // subtract refund AFTER flooring

gas_floor is the EIP-7623 calldata floor: transactionGasFloorForFork (lines 156-164) returns INTRINSIC_GAS + calldataTokenCount(data) * PRAGUE_CALLDATA_FLOOR_GAS_PER_TOKEN (10) for PRAGUE+. intrinsic (line 346) plus gas_consumed (line 539) is the gas-used-before-refund, and execution_gas = gas_limit - intrinsic (line 437), so the operands are correct.

EIP-7623 (and execution-specs process_transaction) semantics: gas_used_without_floor = intrinsic + execution_gas_consumed; refund cap = gas_used_without_floor // 5 (London+); subtract refund; THEN total = max(gas_used_without_floor - refund, floor). The floor is a hard lower bound applied AFTER the refund, and the refund cap is computed on the NON-floored gas. This code inverts both: it floors first, caps the refund on the floored value, and subtracts after flooring — so the result can drop below the floor.

Trigger (Prague, large zero-byte calldata so floor dominates): intrinsic+gas_consumed=100_000, gas_floor=200_000, refund_counter=50_000.
  This code: total=200_000; max_refund=200_000/5=40_000; refund=min(50_000,40_000)=40_000; effective=200_000-40_000=160_000 (below the 200_000 floor).
  Correct: max_refund=100_000/5=20_000; after_refund=80_000; total=max(80_000,200_000)=200_000.
The code undercharges by 40_000 gas and bills below the mandated floor.

The wrong effective_gas_used propagates to charged_gas_wei (line 550), the caller refund (line 556), the burned base fee / coinbase priority tip (lines 562-566), and the receipt gas_used / cumulative_gas_used (lines 587-592). This is a Prague+ consensus divergence (wrong sender charge, wrong base-fee burn, wrong coinbase tip, wrong cumulative_gas_used). The two distinct errors — inflated refund cap and floor-before-refund — both manifest exactly when the floor dominates. Severity critical (consensus). The suggested fix is correct: compute max_refund and after-refund on gas_used_without_floor, then apply the floor as the final @max.


---

## [2] CRITICAL — Light-client update/finality/next-committee proofs always fail: GenericUpdate built with zero-padded full-length branch arrays instead of the real-length slices

- **Group:** zevm:consensus-sync  **Category:** consensus
- **Location:** `/Users/williamcory/zevm/src/consensus_sync.zig:genericFromLightClientUpdate (493-507) and genericFromFinalityUpdate (509-523)`

**What's wrong:** When converting parsed light-client objects into a GenericUpdate, the code passes the raw fixed-size branch arrays via `[0..]` instead of the correctly-truncated accessor slices. The primitives structs store branches in over-sized fixed arrays (LightClientUpdate.finality_branch and LightClientFinalityUpdate.finality_branch are [MAX_LIGHT_CLIENT_BRANCH_DEPTH=7][32]u8, next_sync_committee_branch is [MAX_SYNC_COMMITTEE_BRANCH_DEPTH=6][32]u8) but only fill 6 (finality) / 5 (next committee) real elements; the remainder is zero padding, and the true length is held separately in finality_branch_len / next_sync_committee_branch_len. By slicing `[0..]` the generic update gets a 7-element finality branch and a 6-element next-committee branch. consensus_verifier.verifyUpdate then feeds these slices into isFinalityProofValid / isNextCommitteeProofValid, which call primitives.consensus.isValidMerkleBranch. That function does `if (branch.len != @as(usize, depth)) return false;`. For a pre-Electra (deneb/capella) finalized header the required depth is generalizedIndexDepth(FINALIZED_ROOT_GINDEX=105)=6, but the supplied slice has length 7, so the comparison fails and the proof is rejected as InvalidFinalityProof. Likewise next-committee depth for gindex 55 is 5 but the slice length is 6 -> InvalidNextSyncCommitteeProof. The result is that EVERY finality update, optimistic-then-finality update, and any update carrying a next sync committee is rejected, so consensus sync can never advance past the bootstrap on current mainnet forks. (Bootstrap itself works because verifyBootstrap uses bootstrap.currentSyncCommitteeBranch(), the correct-length accessor.)

**Evidence:**
consensus_sync.zig genericFromLightClientUpdate passes `update.next_sync_committee_branch[0..]` (len 6) and `update.finality_branch[0..]` (len 7); genericFromFinalityUpdate passes `update.finality_branch[0..]` (len 7). primitives isValidMerkleBranch: `if (branch.len != @as(usize, depth)) return false;`. generalizedIndexDepth(105)=6, generalizedIndexDepth(55)=5. Triggering scenario: sync against any beacon node on deneb/capella mainnet; bootstrap succeeds, then the first finality_update reaches verifyUpdate -> isFinalityProofValid(... branch len 7, depth 6 ...) -> false -> ConsensusVerifierError.InvalidFinalityProof, aborting sync. The struct exposes the correct accessors finalityBranch()/nextSyncCommitteeBranch() that return slices of length finality_branch_len/next_sync_committee_branch_len, which are not used here.

**Suggested fix:** In genericFromLightClientUpdate use update.nextSyncCommitteeBranch() and update.finalityBranch() (and the matching maybe* accessors / has_* flags) instead of `update.next_sync_committee_branch[0..]` and `update.finality_branch[0..]`. In genericFromFinalityUpdate use update.finalityBranch(). This passes correctly-sized slices so isValidMerkleBranch's length check matches the expected depth.

**Verifier (high confidence):** Confirmed genuine by reading the actual code and its dependency (primitives package in ~/.cache/zig).

Data flow verified end to end:

1. Struct layout (primitives/LightClientUpdate/LightClientUpdate.zig): `next_sync_committee_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH=6][32]u8` with separate `next_sync_committee_branch_len` (lines 79-80); `finality_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH=7][32]u8` with `finality_branch_len` (lines 83-84). LightClientFinalityUpdate.finality_branch is also [7][32]u8 (line 277). Accessors `nextSyncCommitteeBranch()` (line 222) and `finalityBranch()` (line 226/363) return `[0..len]` truncated slices.

2. Parser (beacon_api.zig) fills real lengths: `parseBranch(5, next_sync_committee_branch)` (line 557) and `parseBranch(6, finality_branch)` (lines 559, 575), passed to `.from()` which takes `[5][32]u8`/`[6][32]u8` and stores them zero-padded into the [6]/[7] arrays, setting len=5/6.

3. The bug: consensus_sync.zig genericFromLightClientUpdate passes `update.next_sync_committee_branch[0..]` (full array, len 6) and `update.finality_branch[0..]` (full array, len 7) — lines 503, 505. genericFromFinalityUpdate passes `update.finality_branch[0..]` (len 7) — line 521. These slice the oversized arrays, not the real-length accessors.

4. These generic updates feed directly into verifyUpdate (consensus_sync lines 114/122/168/183 -> verifyUpdateWithTelemetry -> consensus_verifier.verifyUpdate). The branch slice reaches isFinalityProofValid/isNextCommitteeProofValid (consensus_verifier lines 177-184, 217-225) -> isGeneralizedIndexProofValid -> primitives.consensus.isValidMerkleBranch, which has the strict guard `if (branch.len != @as(usize, depth)) return false;` (consensus.zig line 12).

5. Depths (verified by hand against generalizedIndexDepth loop, consensus_verifier line 668): pre-Electra FINALIZED_ROOT_GINDEX=105 -> depth 6 (105->52->26->13->6->3->1 = 6 shifts); NEXT_SYNC_COMMITTEE_GINDEX=55 -> depth 5 (55->27->13->6->3->1 = 5 shifts). Supplied slice lengths are 7 (finality) and 6 (next-committee). 7!=6 and 6!=5, so isValidMerkleBranch returns false -> InvalidFinalityProof / InvalidNextSyncCommitteeProof on every deneb/capella update.

6. Asymmetry confirms intent: bootstrap path correctly uses `bootstrap.currentSyncCommitteeBranch()` (consensus_verifier line 109), an accessor, so bootstrap succeeds while updates fail.

Result: every finality update and any update carrying a next sync committee is rejected on current pre-Electra mainnet forks, so consensus sync cannot advance past bootstrap. The suggested fix (use finalityBranch()/nextSyncCommitteeBranch() accessors) is correct. Critical severity is justified — it completely breaks consensus sync advancement.


---

## [3] HIGH — Excess blob gas never updated from actually-mined blob transactions (blob base fee market broken)

- **Group:** zevm:block-mining  **Category:** consensus
- **Location:** `/Users/williamcory/zevm/src/mining_coordinator.zig:341 (advanceFeeState call) and 390-421 (advanceFeeState)`

**What's wrong:** After building a block, the coordinator advances the blob-fee state using `options.blob_gas_used` (a caller-supplied MiningBlockOptions field that defaults to 0 and is never populated on the production path) instead of the block's actual blob gas (`result.blob_gas_used`, which block_builder correctly computes and returns). As a result `current_excess_blob_gas` is computed from a parent_blob_gas_used of 0 every block, so excess blob gas (and therefore the EIP-4844/EIP-7691 blob base fee) never escalates even when blocks contain blob transactions. The header persisted in runtime.persistMinedBlock writes the correct `result.blob_gas_used` to `blob_gas_used`, but the *next* block's `excess_blob_gas` is computed from the wrong (zero) value, producing an excess_blob_gas chain that disagrees with what a real client / block_builder.validateBlobGas would compute via calculateExcessBlobGasForFork(parent_excess, parent_blob_gas_used).

**Evidence:**
mineBlockWithOptions line 341: `self.advanceFeeState(active_hardfork, block_base_fee, result.total_gas_used, options.blob_gas_used, block_ctx.block_gas_limit);` — it passes `options.blob_gas_used` (default 0, never set in src/node/runtime.zig mineBlocks where block_options is built lines 1203-1216) rather than `result.blob_gas_used`. advanceFeeState line 414 then uses this as parent_blob_gas_used: `const parent_blob_gas_used = if (active_hardfork.isAtLeast(.CANCUN)) blob_gas_used else 0;` feeding calculateNextExcessBlobGas. Triggering scenario: in a Cancun/Prague dev chain, submit several full blob transactions (each up to 786_432 blob gas). block_builder packs them and returns result.blob_gas_used > target (393_216), but current_excess_blob_gas stays 0 forever, so eth_getBlockByNumber/excessBlobGas and blob base fee remain at the minimum instead of rising.

**Suggested fix:** Pass `result.blob_gas_used` into advanceFeeState instead of `options.blob_gas_used` (and remove the now-unused MiningBlockOptions.blob_gas_used or wire it through correctly).

**Verifier (high confidence):** Confirmed genuine by reading the actual code.

1. mining_coordinator.zig:341 calls `self.advanceFeeState(active_hardfork, block_base_fee, result.total_gas_used, options.blob_gas_used, block_ctx.block_gas_limit)` — it passes `options.blob_gas_used`, NOT `result.blob_gas_used`.

2. `MiningBlockOptions.blob_gas_used` (mining_coordinator.zig:44) defaults to 0. On the production mining path in node/runtime.zig the `block_options` is built at lines 1203-1216 and `blob_gas_used` is never assigned, so it stays 0. A repo-wide grep shows the field is only ever set in test header builders (makeHeader), never on a MiningBlockOptions value used by production code.

3. advanceFeeState (mining_coordinator.zig:414) uses that argument directly as parent_blob_gas_used: `const parent_blob_gas_used = if (active_hardfork.isAtLeast(.CANCUN)) blob_gas_used else 0;` then feeds it to calculateNextExcessBlobGas (lines 415-419). So `current_excess_blob_gas` is always computed as if the parent block contained zero blob gas.

4. block_builder correctly computes the real blob gas: total_blob_gas_used is accumulated (block_builder.zig:251) and returned as `result.blob_gas_used` (line 325, BlockResult field at line 114).

5. The divergence is concrete: persistMinedBlock (node/runtime.zig:2555-2556) writes the header's `blob_gas_used = result.blob_gas_used` (correct, nonzero when blobs present) but `excess_blob_gas = block_excess_blob_gas`, which was captured at runtime.zig:1217 from `coordinator.current_excess_blob_gas` — a value the previous block's advanceFeeState computed using parent_blob_gas_used = 0.

6. This contradicts the project's own consensus rule in block_builder.zig:1117: `expected_excess = calculateExcessBlobGasForFork(fork, parent.excess_blob_gas, parent.blob_gas_used)`, which uses the parent's ACTUAL blob_gas_used. This matches canonical EIP-4844/EIP-7691 semantics. Therefore the excess_blob_gas chain the coordinator produces will not escalate when blocks contain blob transactions, keeping blob base fee pinned at the minimum, and diverging from what validateBlobGas / a real client would compute.

The suggested fix (pass result.blob_gas_used) is correct. Scope is limited to Cancun+ chains that actually include blob transactions via the mining coordinator, but within that scope it is a real consensus/fee-market divergence, so high severity is appropriate.


---

## [4] HIGH — getReady returns pending transactions in insertion order, not per-sender nonce order

- **Group:** zevm:tx-encoding-index  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/txpool.zig:127-137 (getReady), used at src/node/runtime.zig:1196 and src/block_builder.zig:223-244`

**What's wrong:** getReady() iterates self.transactions.items in raw insertion order and appends every entry that isPending(). It never sorts the returned transactions by nonce within a sender. The block builder consumes this slice in order and, when skip_invalid_transactions is true, simply `continue`s past any transaction that fails with TxError.NonceMismatch (block_builder.zig:232-242). Because the EVM requires each sender's transactions to execute in strictly ascending nonce order, an out-of-order ready slice causes valid transactions to be wrongly dropped from the block.

**Evidence:**
Scenario: account A submits the nonce=1 transaction first (it sits queued), then submits nonce=0. isPending becomes true for both once nonce=0 exists. transactions.items is [A:nonce1, A:nonce0] in insertion order. getReady returns [A:nonce1, A:nonce0]. The builder processes A:nonce1 first -> processTransactionWithOptions returns NonceMismatch (expected 0) -> with skip_invalid_transactions it is silently dropped; then A:nonce0 executes. Result: A:nonce1 is never mined even though it is perfectly valid after nonce0. Conversely a strict builder (skip_invalid=false) returns error.InvalidIncludedTransaction and fails the whole block. Geth/anvil always order the ready set by (sender, ascending nonce); this pool does not.

**Suggested fix:** In getReady (or before feeding the builder) sort the pending set so that, for each sender, transactions appear in ascending nonce order (a stable sort keyed by nonce within sender, with senders grouped). At minimum, build the ready list by walking each sender from baseNonce upward (findTransactionIndex(sender, baseNonce), baseNonce+1, ...) so contiguous nonces are emitted in order.

**Verifier (high confidence):** Verified genuine by reading the actual code. getReady (txpool.zig:127-137) iterates self.transactions.items in raw insertion order and appends every entry passing isPending(), with zero nonce sorting. add() (line 104) always appends, so storage order = submission order, which can be out of nonce order. isPending() (lines 175-183) walks from baseNonce up to nonce requiring every intermediate nonce to exist, so once a nonce-gap is filled, BOTH the earlier-submitted higher-nonce tx and the later-submitted lower-nonce tx become pending. Thus the scenario "submit A:nonce1, then A:nonce0" produces transactions.items = [A:nonce1, A:nonce0] and getReady returns them in that wrong order.

No sorting happens downstream: runtime.zig:1196-1201 appends ready directly into coordinator.pending_txs, mining_coordinator.zig:327 passes pending_txs.items straight to buildBlock, and block_builder.zig:191 processes `for (transactions, 0..) |item, tx_index|` strictly in slice order. The dispatch_wiring consumers (1567, 3263) likewise feed the slice in order. So getReady's order is the execution order.

Ethereum semantics confirmed: tx_processor.zig:344 raises TxError.NonceMismatch when current_nonce != tx.nonce. With skip_invalid_transactions=true (set in runtime.zig:1206), block_builder.zig:240 silently `continue`s, dropping the valid A:nonce1 forever even though it would be valid after A:nonce0; with skip_invalid=false, block_builder.zig:241 returns error.InvalidIncludedTransaction, failing the whole block.

This matches the report exactly. Geth/anvil order the ready set by (sender, ascending nonce); this pool does not. Severity high: it is a correctness defect causing valid transactions to be dropped or whole blocks to fail, in a normal mempool scenario (out-of-order nonce submission / gap fill). Not critical because it is data-order-dependent — in the common in-order submission case ordering is naturally correct — but the broken case is realistic and the consequence (lost valid txs / failed blocks) is serious.


---

## [5] HIGH — Electra (and Electra bootstrap) light-client responses cannot be parsed: branch lengths hard-coded to pre-Electra sizes

- **Group:** zevm:consensus-sync  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/beacon_api.zig:parseUpdate (557,559), parseFinalityUpdate (575), parseBootstrap (542)`

**What's wrong:** The verifier explicitly supports Electra generalized indices (CURRENT_SYNC_COMMITTEE_GINDEX_ELECTRA=86, NEXT_SYNC_COMMITTEE_GINDEX_ELECTRA=87, FINALIZED_ROOT_GINDEX_ELECTRA=169, with proof depths 6, 6 and 7 respectively), so the system is intended to operate across the Electra fork boundary. However the JSON parser hard-codes branch element counts to the pre-Electra Deneb sizes: parseBranch(5, ...) for next_sync_committee_branch / current_sync_committee_branch and parseBranch(6, ...) for finality_branch. parseBranch returns error.InvalidArrayLength when branch_items.len != N. Under Electra the beacon API returns 7 finalized-root elements and 6 next/current-sync-committee elements, so parseUpdate/parseFinalityUpdate/parseBootstrap all fail with InvalidArrayLength. Consequently the node cannot sync once the chain is on Electra, even though the verifier was coded to handle it.

**Evidence:**
beacon_api.zig: `try parseBranch(5, ... next_sync_committee_branch ...)`, `try parseBranch(6, ... finality_branch ...)`, `try parseBranch(5, ... current_sync_committee_branch ...)`. parseBranch: `if (branch_items.len != N) return error.InvalidArrayLength;`. Electra proof depths from consensus_verifier.zig generalizedIndexDepth: depth(169)=7 for finality, depth(87)=6 for next committee, depth(86)=6 for current committee — all larger than the hard-coded 6/5. Triggering scenario: point the engine at a mainnet beacon node after the Electra activation epoch; getFinalityUpdate -> parseFinalityUpdate -> parseBranch(6, <7-element electra branch>) -> error.InvalidArrayLength, sync fails.

**Suggested fix:** Parse branches with their natural (variable) length up to the Electra maxima (finality up to 7, sync-committee up to 6) using the *Branches/*OptionalBranches constructors that accept slices, choosing the expected length based on the response's consensus fork version, rather than fixed parseBranch(6)/parseBranch(5).

**Verifier (high confidence):** Confirmed by reading the actual code.

In /Users/williamcory/zevm/src/beacon_api.zig, parseBranch (line 684) enforces an EXACT element count: `if (branch_items.len != N) return error.InvalidArrayLength;`. The light-client parsers call it with hard-coded pre-Electra (Deneb) sizes:
- parseBootstrap (line 542): parseBranch(5, current_sync_committee_branch)
- parseUpdate (lines 557, 559): parseBranch(5, next_sync_committee_branch), parseBranch(6, finality_branch)
- parseFinalityUpdate (line 575): parseBranch(6, finality_branch)

These results are passed into the primitive `.from` constructors which themselves take fixed `[5]`/`[6]` arrays (verified in the active dependency: ~/.cache/zig/p/primitives-0.1.0-9n3NfRx69wDX6DShMDlRZKhmDEJM_dPL6a7ilsBJDXg2/.../LightClientUpdate/LightClientUpdate.zig, e.g. LightClientUpdate.from takes next_sync_committee_branch: [5][32]u8 and finality_branch: [6][32]u8). That same file defines MAX_SYNC_COMMITTEE_BRANCH_DEPTH=6 and MAX_LIGHT_CLIENT_BRANCH_DEPTH=7, plus variable-length constructors fromBranches/fromOptionalBranches that accept slices up to those maxima — i.e., the primitive layer is explicitly built for Electra-sized branches, but beacon_api.zig only uses the fixed pre-Electra `from`.

The verifier /Users/williamcory/zevm/src/consensus_verifier.zig is clearly intended to operate across the Electra boundary: it defines CURRENT_SYNC_COMMITTEE_GINDEX_ELECTRA=86, NEXT_SYNC_COMMITTEE_GINDEX_ELECTRA=87, FINALIZED_ROOT_GINDEX_ELECTRA=169 (lines 25-27) and selects them via isElectraOrLater(slot, fork_config) (lines 614, 628, 642). generalizedIndexDepth = floor(log2(gindex)), so the expected branch lengths are: depth(86)=6 and depth(87)=6 for the sync-committee branches (vs 5 pre-Electra), and depth(169)=7 for finality (vs 6 pre-Electra). These match the Ethereum consensus-specs Electra light-client gindexes/depths.

Therefore, once the chain is on Electra, a real beacon node returns 6-element sync-committee branches and 7-element finalized-root branches. parseFinalityUpdate -> parseBranch(6, <7-element electra branch>) -> error.InvalidArrayLength; same for parseUpdate and parseBootstrap. The fork version is already plumbed through to the parsers (getFinalityUpdate/getUpdates/getBootstrap pass response.fork into the *WithFork parsers, which forward defaultFork(response.fork)), so the parsers have the information needed to select the right size but ignore it. Net effect: light-client sync breaks at/after the Electra activation epoch, even though the verifier was coded to handle it.

This is a genuine, triggerable logic bug. High severity is appropriate: it is a hard sync-blocking failure once mainnet is past Electra (which is the live state), though it is confined to the consensus light-client sync path and is a straightforward fix (use fromBranches/fromOptionalBranches with fork-dependent expected lengths, as the suggested fix notes).


---

## [6] HIGH — Integer overflow in ABI revert-reason decoder on attacker-controlled output

- **Group:** zevm:rpc-handlers  **Category:** overflow
- **Location:** `/Users/williamcory/zevm/src/rpc/handlers/simulation.zig:1952-1965 (decodeRevertReason / readAbiWord)`

**What's wrong:** decodeRevertReason parses the standard Error(string) revert payload from EVM call output. The ABI offset and length words are 256-bit values fully controlled by the called contract (any contract can craft arbitrary revert data). The guard `if (offset > std.math.maxInt(usize)) return null;` does NOT prevent overflow: on a 64-bit target an offset of exactly maxInt(u64) passes the check, and the subsequent unchecked additions `len_pos = 4 + @as(usize, @intCast(offset))`, `reason_start = len_pos + 32`, and `reason_start + reason_len > output.len` overflow usize. In a safe build (Debug/ReleaseSafe) this panics (DoS via eth_call/eth_simulateV1); in ReleaseFast it wraps and produces a wrong slice range / out-of-bounds read.

**Evidence:**
Trigger: deploy/override a contract that reverts with data = selector(08c379a0) followed by an offset word set to 0xffffffffffffffff (maxInt(u64)). Call it via eth_call or eth_simulateV1. Path: handleEthCall -> executeOnce -> executeCall sees !owned.success -> recordExecutionErrorData; later the revert string is decoded for the error message in simulateCallValueFromReceipt -> revertErrorMessage -> decodeRevertReason. Line 1957 `if (offset > std.math.maxInt(usize)) return null;` is a no-op for offset==u64max on 64-bit; line 1958 `const len_pos = 4 + @as(usize, @intCast(offset));` then computes 4 + 0xffffffffffffffff which overflows usize. Same for `reason_start = len_pos + 32` (1962) and `reason_start + reason_len` (1963) with attacker-chosen reason_len up to u64max.

**Suggested fix:** Use saturating/checked arithmetic and verify each computed index against output.len before use, e.g. `const len_pos = std.math.add(usize, 4, std.math.cast(usize, offset) orelse return null) catch return null;` and likewise for reason_start and reason_start+reason_len; reject when any sum exceeds output.len.

**Verifier (high confidence):** Confirmed genuine by reading /Users/williamcory/zevm/src/rpc/handlers/simulation.zig lines 1952-1970.

decodeRevertReason parses the Error(string) revert payload (output), which is fully attacker-controlled: line 1936 calls revertErrorMessage(allocator, output) where output is the EVM call output on a failed call (!success), reachable from eth_call / eth_simulateV1.

The guard is a no-op for the boundary value. `offset` is a u256 (readAbiWord returns ?u256). Line 1957 `if (offset > std.math.maxInt(usize)) return null;` rejects only values strictly greater than maxInt(usize). An offset of exactly 0xffffffffffffffff (u64max on a 64-bit target) PASSES the check.

Line 1958 then computes `const len_pos = 4 + @as(usize, @intCast(offset));`. The @intCast succeeds (offset fits usize). `4` is a comptime_int coerced to usize, so this is usize addition: 4 + maxInt(usize), which overflows usize. In Zig, runtime `+` is overflow-checked illegal behavior: it panics in Debug/ReleaseSafe and is UB (wraps in practice) in ReleaseFast. This overflow occurs at line 1958 BEFORE readAbiWord's own bounds guard at line 1968 can run, so that guard does not save it. Same overflow pattern exists at line 1962 (reason_start = len_pos + 32) and line 1963 (reason_start + reason_len) with reason_len controllable up to maxInt(usize).

Severity confirmed high (not downgraded): build.zig lines 284-294 build the distributed CLI and npm Node-API addon with .ReleaseSafe, where the overflow panics — a remote DoS: any caller can deploy/override a contract that reverts with selector 08c379a0 followed by offset word = 0xffffffffffffffff and crash the RPC process via eth_call/eth_simulateV1. The suggested fix using std.math.cast/std.math.add with checked arithmetic and per-index bounds validation against output.len is correct.


---

## [7] HIGH — clearStorage / deleteAccount is not captured in the checkpoint diff and cannot be reverted (lost storage on revert / SELFDESTRUCT rollback)

- **Group:** tevm:state  **Category:** consensus
- **Location:** `/Users/williamcory/tevm-monorepo/packages/state/src/actions/clearContractStorage.js:clearContractStorage (line 8); also deleteAccount.js line 10`

**What's wrong:** clearContractStorage calls baseState.caches.storage.clearStorage(address). In the underlying StorageCache (@evmts/zevm), clearStorage() overwrites the address's storage map with a fresh empty Map WITHOUT calling _saveCachePreState, so the cleared entries are never recorded in _diffCache. Therefore StorageCache.revert() cannot restore them. tevm's revert.js only restores the storageCleared tombstone Set, not the actual storage values. The result: any storage cleared inside a checkpoint (e.g. SELFDESTRUCT, or deleteAccount, which calls clearContractStorage) is permanently lost from the local cache even when the enclosing call frame / transaction reverts. This is a state-transition / consensus correctness bug: a reverted SELFDESTRUCT must leave the contract's storage intact.

**Evidence:**
StorageCache.clearStorage in node_modules/@evmts/zevm/dist/statemanager.js (lines ~283-292) does: `this._lruCache.set(addressHex, new Map())` with NO _saveCachePreState call, unlike put()/del()/get-modifiers which all call _saveCachePreState. revert() (same file) only replays _diffCache, so cleared slots are not restored. Triggering scenario (non-fork): put slot 0x01=0xabc in main cache; checkpoint(); deleteAccount(addr) -> clearStorage wipes the map + storageCleared.add(addr); revert() -> storage.revert() leaves map empty (no diff entry), tombstones restored (storageCleared no longer has addr); getContractStorage(addr, 0x01) now misses main cache, sees no storageCleared tombstone, and (non-fork) returns empty Uint8Array instead of 0xabc. The clearContractStorage.spec.ts has no revert test, so this is uncaught.

**Suggested fix:** Do not rely on StorageCache.clearStorage for checkpointable clearing. Either (a) iterate the address's existing storage keys and call storage.del(addr, key) for each (del records pre-state and is revertible), or (b) implement clearing via the storageCleared tombstone only and make getContractStorage honor it without physically wiping the cache, or (c) snapshot/restore the cleared storage map inside tevm's own checkpoint/revert tombstone machinery.

**Verifier (high confidence):** Confirmed by reading the actual code AND reproducing the bug with a live test against the real state manager.

Root cause verified in the dependency: /Users/williamcory/zevm/npm/zevm/dist/statemanager.js lines 283-291, StorageCache.clearStorage(address) does `this._lruCache.set(addressHex, new Map())` (or the orderedMap equivalent) and NEVER calls _saveCachePreState. Contrast put() (line 243) and del() (line 270) which both call this._saveCachePreState before mutating. Because nothing is written to _diffCache, StorageCache.revert() (lines 307-334), which only replays _diffCache entries, cannot restore the wiped slots.

tevm wiring confirmed: clearContractStorage.js line 8 calls baseState.caches.storage.clearStorage(address) and line 9 adds a storageCleared tombstone. deleteAccount.js line 10 calls clearContractStorage. revert.js (lines 7-14) calls caches.storage.revert() and only restores the tombstone Sets (accounts/storageCleared) from the checkpoint snapshot — it does nothing to recover physically-wiped storage values. getContractStorage.js: after revert the storageCleared tombstone is gone (restored to pre-checkpoint state), the main cache map is empty, and in non-fork mode line 68-70 returns new Uint8Array().

Live reproduction (non-fork): I wrote a spec using createBaseState + putAccount(contract) + putContractStorage(slot1=0x0a0b0c), then checkpoint() -> clearContractStorage(addr) -> revert(). getContractStorage after revert returned Uint8Array [] instead of [10,11,12]. Test failed exactly as predicted, proving the data is permanently lost on revert. The existing clearContractStorage.spec.ts contains no checkpoint/revert test, so this is genuinely uncaught.

Consensus correctness: Per Ethereum semantics a reverted call frame (or reverted SELFDESTRUCT/account deletion) must leave the contract's storage fully intact. This implementation silently discards it. The behavior is a real state-transition correctness defect.

Severity adjustment to high rather than critical: the proven, directly-triggerable path is via deleteAccount/clearStorage (public StateManager APIs and account-deletion flows). The most catastrophic framing (a reverted SELFDESTRUCT silently corrupting consensus state during normal tx execution) depends on the EVM actually routing SELFDESTRUCT through this clearStorage path within a nested checkpoint and on the revert being a real EVM revert; I confirmed the cache-level defect and the deleteAccount path but did not separately trace every EVM opcode call site. Regardless of exact trigger, storage that should be revertible is irrecoverably lost, which is a serious correctness bug. The suggested fix (iterate keys and use storage.del per slot, which records pre-state, or snapshot the cleared map in tevm's own tombstone machinery) is sound.


---

## [8] HIGH — dumpStorageRange parses unprefixed hex storage keys with hexToBigInt, crashing on hex letters and mis-sorting

- **Group:** tevm:state  **Category:** logic
- **Location:** `/Users/williamcory/tevm-monorepo/packages/state/src/actions/dumpStorageRange.js:21-26 (sortedStorage comparator and startKey filter)`

**What's wrong:** StorageCache.dump() returns a Map keyed by UNPREFIXED hex strings (bytesToUnprefixedHex, e.g. '00..0a'). dumpStorageRange feeds these keys directly into viem's hexToBigInt() for sorting (lines 21-22) and for the _startKey comparison (line 26). viem's hexToBigInt requires a 0x prefix and otherwise does BigInt(str): an unprefixed key containing a hex letter (a-f) throws 'Cannot convert ... to a BigInt', and an unprefixed key of only digits is parsed as DECIMAL, producing wrong ordering and wrong start-key filtering.

**Evidence:**
Verified with viem: hexToBigInt('00..0a') (slot 0x0a) throws 'Cannot convert 0..0a to a BigInt'; hexToBigInt('00..010') returns 10n instead of 16n (slot 0x10). dump() key format confirmed in node_modules/@evmts/zevm/dist/statemanager.js dump() -> bytesToUnprefixedHex(address.bytes) and put() -> bytesToUnprefixedHex(key). The existing spec only uses slots 0-6 (all digits < 10 and single-char), so the bug is masked. Any real contract with a storage slot >= 0x0a (which is essentially all of them, e.g. mapping slots) will crash debug_storageRangeAt or return wrong pagination.

**Suggested fix:** Prefix the key before parsing: hexToBigInt(`0x${storageKey}`) in both the comparator (lines 21-22) and the startKey filter (line 26). Add a test using slots >= 0x0a and a full 64-char key.

**Verifier (high confidence):** Confirmed genuine by reading the actual code and reproducing both failure modes.

KEY FORMAT: StorageCache.dump() returns a Map keyed by UNPREFIXED hex. Verified in node_modules/.pnpm/@ethereumjs+statemanager@10.1.1/node_modules/@ethereumjs/statemanager/dist/esm/cache/storage.js: put() (line 65) sets keys via bytesToUnprefixedHex(key), and dump() (line 322) returns that same storageMap unmodified. (The report cited @evmts/zevm; the actual dependency in this tree is @ethereumjs/statemanager, but the unprefixed-key fact is identical and correct.) The existing spec also literally shows unprefixed keys like "0000...0000".

BUG SITE: In /Users/williamcory/tevm-monorepo/packages/state/src/actions/dumpStorageRange.js the unprefixed keys are fed directly to viem's hexToBigInt at lines 21-22 (sort comparator) and line 26 (startKey filter), with only a type cast to Hex — no 0x prefixing.

REPRODUCED with viem: hexToBigInt('00..0a') throws "Cannot convert 000...0a to a BigInt"; this throw happens inside the .sort() comparator, crashing the entire dumpStorageRange call (i.e. debug_storageRangeAt). hexToBigInt('00..010') returns 10n instead of 16n, so the all-digit case silently mis-sorts and mis-filters pagination. hexToBigInt('0x00..010') correctly returns 16n, confirming the suggested 0x-prefix fix.

MASKING: dumpStorageRange.spec.ts (lines 40-46) only uses slots 0-6 — all single hex digits < 0x0a, which parse the same whether treated as hex or decimal — so neither the throw nor the decimal-misparse ever triggers in tests.

IMPACT: Any storage slot >= 0x0a (which includes essentially all keccak-derived mapping/array slots, since they almost always contain a-f) crashes the call; all-digit slots >= 0x10 give wrong ordering/pagination. High severity is justified: a guaranteed crash on a real RPC debug method for realistic contract storage.


---

## [9] HIGH — Canonical chain reorg leaves blocksByNumber stale: getBlock(byNumber) returns a non-canonical block after the head is moved to a sibling at the same height

- **Group:** tevm:blockchain  **Category:** consensus
- **Location:** `/Users/williamcory/tevm-monorepo/packages/blockchain/src/actions/putBlock.js:43-45`

**What's wrong:** blocksByNumber is only ever populated by putBlock, and only when the slot is empty: `if (!baseChain.blocksByNumber.has(block.header.number)) blocksByNumber.set(...)`. It is otherwise never updated on a reorg. There is no code path (neither putBlock, nor setIteratorHead) that re-points blocksByNumber to the new canonical block when the head changes to a different block at an already-occupied height. Since getBlock-by-number reads exclusively from blocksByNumber (getBlock.js:16 and the bytesToBigInt fallback at getBlock.js:20), a number lookup will return the FIRST block ever stored at that height — which may no longer be on the canonical chain after a reorg. This is a canonical-chain consistency bug: getCanonicalHeadBlock()/iterator head (via blocksByTag) and getBlock(number) can disagree about which block is at a given height.

**Evidence:**
Reorg scenario: two siblings 5a and 5b at height 5n with different hashes. putBlock(5a) sets blocksByNumber[5]=5a. putBlock(5b): blocksByNumber.has(5) is true, so blocksByNumber[5] stays 5a (only blocks[hash5b]=5b is added). Now switch the canonical head to 5b via setIteratorHead('vm', hash5b) (setIteratorHead.js sets blocksByTag but never touches blocksByNumber). State is now inconsistent: getIteratorHead('vm')/canonical head = 5b, but await getBlock(5n) returns 5a (the stale, non-canonical sibling). Any consumer resolving block-by-number (e.g. eth_getBlockByNumber, EVM BLOCKHASH lookups) gets the wrong block after the reorg.

**Suggested fix:** On a head change/reorg, update blocksByNumber to point at the canonical block. Either (a) have setIteratorHead walk the new head's ancestry and overwrite blocksByNumber entries, or (b) in putBlock, when the block becomes the new canonical head (the latest-setting branch), always overwrite blocksByNumber.set(block.header.number, block) for that block rather than skipping when the slot is occupied.

**Verifier (high confidence):** Confirmed by reading the actual code. putBlock.js:43-45 only populates blocksByNumber when the slot is empty (`if (!baseChain.blocksByNumber.has(block.header.number)) baseChain.blocksByNumber.set(...)`); it never overwrites an existing entry, even in the branch (lines 46-53) where the block legitimately becomes the new canonical latest via `blocksByTag.set('latest', block)`. setIteratorHead.js:8-15 only mutates blocksByTag and never touches blocksByNumber. getBlock.js:16 and the fallback at getBlock.js:20 resolve by-number lookups exclusively from blocksByNumber. Therefore, given two siblings 5a and 5b at the same height: putBlock(5a) sets blocksByNumber[5]=5a; putBlock(5b) leaves it as 5a (only blocks[hash5b]=5b is added); then setIteratorHead('vm', hash5b) or putBlock making 5b the latest tag does not repoint blocksByNumber[5]. After this, getCanonicalHeadBlock()/iterator head returns 5b while getBlock(5n) returns the stale non-canonical 5a. This is a genuine canonical-chain consistency bug matching Ethereum semantics (block-by-number must return the canonical block). The only other writer, delBlock.js:73-74, removes a blocksByNumber entry only when it equals the deleted block, and is not invoked by a plain setIteratorHead reorg, so it does not mitigate the scenario. The reorg-to-sibling-at-same-height path is the narrow but real trigger; typical fork+mine flows use monotonic heights, which is why I keep severity at high rather than critical.


---

## [10] HIGH — debug_traceTransaction/traceCall structLog gasCost double-counts base fee for every opcode

- **Group:** tevm:actions-anvil-debug  **Category:** trace-fidelity
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/internal/runCallWithTrace.js:36 (onStep, gasCost computation)`

**What's wrong:** The default struct-log tracer computes gasCost as `BigInt(step.opcode.fee) + (step.opcode.dynamicFee ?? 0n)`. In the underlying zevm/ethereumjs interpreter, `step.opcode.dynamicFee` is the FULL computed gas cost for the opcode (it equals `opInfo.feeBigInt` plus, for dynamic-gas opcodes, the delta added by the gas handler — the handler is passed the base fee and returns the total). `step.opcode.fee` is the static base fee. Adding them therefore counts the base fee twice for EVERY opcode (including simple ones like PUSH1, whose dynamicFee is just the base 3). The reported gasCost does not match the gas actually consumed, breaking debug_traceTransaction / debug_traceCall fidelity vs geth.

**Evidence:**
Interpreter (node_modules/@evmts/zevm/.../@ethereumjs/evm/dist/esm/interpreter.js): `let gas = opInfo.feeBigInt; ... if (opInfo.dynamicGas) { gas = await opEntry.gasHandler(this._runState, gas, this.common); } ... await this._runStepHook(gas, this.getGasLeft(), ...)` and `_runStepHook(dynamicFee, ...)` sets `opcode: { fee: opcodeInfo.fee, dynamicFee }`. So dynamicFee == total cost (base included). The committed snapshot proves the bug: /Users/williamcory/tevm-monorepo/packages/actions/src/internal/__snapshots__/runCallWithTrace.spec.ts.snap shows PUSH1 with `gasCost: 6n` while the actual `gas` field decrements by 3 between consecutive PUSH1 steps (16784800 -> 16784797). PUSH1 costs 3, but the trace reports 6 = fee(3) + dynamicFee(3). EXP/SSTORE/CALL etc. are similarly inflated by their base fee.

**Suggested fix:** Use the precomputed total when available: `gasCost: step.opcode.dynamicFee ?? BigInt(step.opcode.fee)`. Then regenerate the runCallWithTrace snapshot (the doubled values there are the regression, not the baseline).

**Verifier (high confidence):** Confirmed genuine by reading the actual code and the underlying interpreter.

runCallWithTrace.js:36 computes `gasCost: BigInt(step.opcode.fee) + (step.opcode.dynamicFee ?? 0n)`.

In the interpreter (node_modules/.pnpm/@ethereumjs+evm@10.1.1/.../interpreter.js):
- Line 199: `let gas = opInfo.feeBigInt;` and codes.js:13/396 show `feeBigInt = BigInt(fee) = BigInt(baseFee)`, so `gas` begins as the base fee.
- Lines 203-207: only for dynamic-gas opcodes, `gas = await opEntry.gasHandler(this._runState, gas, this.common)` — the handler receives the base fee and returns the TOTAL (base + dynamic delta). For static opcodes `gas` stays equal to the base fee.
- Line 211: `_runStepHook(gas, ...)` passes this total `gas` as the `dynamicFee` argument.
- Lines 274-280: `opcode: { fee: opcodeInfo.fee, dynamicFee }` — so `fee` is the static base and `dynamicFee` is the FULL cost (base already included).
- Decisive: ethereumjs's own struct-log/debug trace at line 305 uses `gasCost: bigIntToHex(dynamicFee)` (dynamicFee alone), never fee+dynamicFee.

Therefore line 36 double-counts the base fee for every opcode. For static opcodes dynamicFee == fee, so reported gasCost = 2x actual.

The committed snapshot proves it (packages/actions/src/internal/__snapshots__/runCallWithTrace.spec.ts.snap): PUSH1 reports gasCost 6n, but the gasLeft field drops by exactly 3 between consecutive steps (16784800 -> 16784797 -> 16784794), confirming PUSH1 truly costs 3. CALLVALUE reports gasCost 4n while gasLeft drops by 2 (16784782 -> 16784780); DUP1 reports 6n for an actual cost of 3. Every static opcode is inflated to 2x.

Triggerability: traceCallHandler.js routes the default (geth struct-log) tracer through runCallWithTrace at line 87, the path used by debug_traceTransaction/debug_traceCall when no callTracer/prestateTracer/etc. is specified. So every default trace emits wrong per-opcode gasCost, breaking geth fidelity for debuggers and gas profilers.

The suggested fix (`gasCost: step.opcode.dynamicFee ?? BigInt(step.opcode.fee)`) exactly mirrors ethereumjs's own line 305 and is correct; the doubled snapshot values are the regression to regenerate.

Severity high is appropriate: it is a correctness defect affecting every opcode of a public JSON-RPC method's primary output field, though it is trace-accuracy rather than a crash or consensus/state-corruption issue.


---

## [11] HIGH — muxTracer default struct-log gasCost ignores all dynamic gas (reports only static base fee)

- **Group:** tevm:actions-anvil-debug  **Category:** trace-fidelity
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/internal/runCallWithMuxTrace.js:345 (structLogs.push gasCost), 346 (depth)`

**What's wrong:** Inside the muxTracer, the default struct-log producer sets `gasCost: BigInt(step.opcode.fee)`, using only the static base fee and discarding `step.opcode.dynamicFee`. This is the opposite error from runCallWithTrace.js: any opcode with dynamic cost (SSTORE, SLOAD/cold via EIP-2929, CALL family, KECCAK256, EXP, LOG*, memory expansion, etc.) is reported with far too low a gasCost (e.g. a cold SLOAD reports its base of ~0 instead of 2100; SSTORE reports its base instead of up to 20000+). The default trace emitted via the mux tracer is therefore inconsistent with the standalone default tracer and with geth. Additionally, depth here is `step.depth + 1` while runCallWithTrace.js uses `step.depth`, so the two paths disagree on the depth field too.

**Evidence:**
Line 345: `gasCost: BigInt(step.opcode.fee),` — dynamicFee is never read. Compare with runCallWithTrace.js line 36 which (incorrectly the other way) adds dynamicFee. As shown in the interpreter, dynamicFee already holds the full cost, so the correct value is simply `step.opcode.dynamicFee ?? BigInt(step.opcode.fee)`. Triggering scenario: debug_traceCall with `tracer: 'muxTracer'` and a default/struct-log sub-tracer running a contract that does SSTORE/SLOAD; the structLogs gasCost for those opcodes will be the base fee only, dramatically understating real cost.

**Suggested fix:** Match the corrected default tracer: `gasCost: step.opcode.dynamicFee ?? BigInt(step.opcode.fee)` and reconcile the depth convention with runCallWithTrace.js so both paths emit identical depth values.

**Verifier (high confidence):** Confirmed by reading the cited file and the ethereumjs interpreter source.

runCallWithMuxTrace.js line 345 sets `gasCost: BigInt(step.opcode.fee)`, using ONLY the static base fee and never reading step.opcode.dynamicFee.

Ground truth from /Users/williamcory/tevm-monorepo/node_modules/.pnpm/@ethereumjs+evm@10.1.1/node_modules/@ethereumjs/evm/dist/esm/interpreter.js:
- runStep (lines 199-207): `let gas = opInfo.feeBigInt;` then if dynamicGas, `gas = await opEntry.gasHandler(runState, gas, common)` which updates gas IN-PLACE to the full total (base + dynamic combined).
- _runStepHook is called with this total `gas` (line 211); inside the hook the parameter is literally named `dynamicFee`, and the event sets `opcode.fee = opcodeInfo.fee` (base only, line 276) and `opcode.dynamicFee = dynamicFee` = the full total (line 277).
- ethereumjs's own debug trace uses `gasCost: bigIntToHex(dynamicFee)` (line 305) — confirming dynamicFee ALONE is the correct full gasCost. For non-dynamic opcodes gas stays at feeBigInt, so dynamicFee == fee.

Therefore muxTracer's `BigInt(step.opcode.fee)` understates gasCost for every dynamic-gas opcode (SSTORE, cold SLOAD/EIP-2929, CALL family, KECCAK256, EXP, LOG*, memory expansion). E.g. cold SLOAD reports its base instead of 2100; SSTORE reports base instead of up to 20000+. This is wrong vs geth struct-log semantics and triggerable via debug_traceCall with tracer muxTracer wrapping a default/struct-log sub-tracer on a contract doing SSTORE/SLOAD.

Inconsistency vs standalone tracer also confirmed: runCallWithTrace.js line 36 uses `BigInt(step.opcode.fee) + (step.opcode.dynamicFee ?? 0n)`, which double-counts the base for dynamic opcodes (since dynamicFee already includes base). So both paths are wrong in opposite directions and emit different gasCost. The correct fix for both is `step.opcode.dynamicFee ?? BigInt(step.opcode.fee)`.

Depth divergence also confirmed: muxTracer line 346 emits `step.depth + 1` while runCallWithTrace.js line 38 emits `step.depth`. The interpreter sets `depth: this._env.depth` (line 282), so raw step.depth is the true depth; the two paths disagree.

Severity high is appropriate: this is a correctness/trace-fidelity defect in a public JSON-RPC tracer output that silently produces wrong, dramatically-understated gas costs (not a crash, hence not critical).


---

## [12] HIGH — multicall3 predeploy is silently dropped from GENESIS_STATE

- **Group:** tevm:node-client  **Category:** logic
- **Location:** `/Users/williamcory/tevm-monorepo/packages/node/src/GENESIS_STATE.js:36-47 (GENESIS_STATE Object.fromEntries)`

**What's wrong:** GENESIS_STATE is built with Object.fromEntries over a map whose callback returns a THREE-element array [address, accountObject, multicall3Contract]. Object.fromEntries only consumes index 0 (key) and index 1 (value) of each entry and ignores any further elements. As a result the multicall3 contract (the intended predeploy, like anvil/hardhat ship) is never inserted into genesis state. On a fresh (non-forked) node the canonical multicall3 contract at 0xcA11bde05977b3631167028862bE2a173976CA11 does not exist, breaking viem multicall / aggregate3 and any tool that assumes multicall3 is predeployed. The multicall3Contract object is also malformed for insertion (it has no address key, uses storageRoot:'0x', and provides deployedBytecode but no codeHash), confirming it was never wired up correctly.

**Evidence:**
Lines 36-47:
  export const GENESIS_STATE = Object.fromEntries(
    INITIAL_ACCOUNTS.map((address) => [
      address,
      { nonce: 0n, balance: INITIAL_BALANCE, storageRoot: '0x', codeHash: '0x' },
      multicall3Contract,   // <-- third array element, ignored by Object.fromEntries
    ]),
  )
Verified empirically: Object.fromEntries([[a,{},X]]) produces { a: {} } and drops X. The repo's own test packages/memory-client/src/test/viem/multicall.spec.ts asserts every aggregate3 call returns status:'failure' with an error containing 'aggregate3' -- i.e. the test was written around the broken (missing) predeploy. Triggering scenario: createMemoryClient() (no fork) then client.multicall({contracts:[...]}) -> all calls fail because multicall3 bytecode is absent.

**Suggested fix:** Add multicall3 as its own genesis entry keyed by its canonical address, e.g. include `['0xcA11bde05977b3631167028862bE2a173976CA11', { nonce: 0n, balance: 0n, storageRoot: bytesToHex(KECCAK256_RLP), codeHash: keccak256(multicall3Contract.deployedBytecode), deployedBytecode: multicall3Contract.deployedBytecode }]` in the entries array (and ensure the state manager actually stores the deployed code), rather than appending it as an ignored third tuple element. Then update multicall.spec.ts to expect success.

**Verifier (high confidence):** Confirmed genuine by reading the cited file and tracing usage.

1. The cited code in /Users/williamcory/tevm-monorepo/packages/node/src/GENESIS_STATE.js lines 36-47 is exactly as reported: GENESIS_STATE = Object.fromEntries(INITIAL_ACCOUNTS.map((address) => [address, {nonce,balance,storageRoot,codeHash}, multicall3Contract])). Each map callback returns a 3-element array.

2. Object.fromEntries semantics verified empirically: `node -e "Object.fromEntries([['a',{x:1},{y:2}]])"` produced `{"a":{"x":1}}` — index 2 is silently dropped. So multicall3Contract is never inserted.

3. multicall3 bytecode exists nowhere else in the codebase: a grep across packages/node, packages/state, packages/vm and a repo-wide grep for the bytecode/`deployedBytecode`/`multicall3Contract` found the contract object only in GENESIS_STATE.js (lines 25, 45). There is no alternate deployment path. createTevmNode.js (lines 489-504) builds genesisState as `{...GENESIS_STATE, ...customPredeploys}` — multicall3 is not added.

4. The chain config actively promises multicall3 exists: packages/common/src/presets/tevmDefault.js:20 declares `multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockCreated: 0 }`. This causes viem's `multicall` to route through aggregate3 at that address, which then reverts/fails because no bytecode is deployed there. This makes the bug actually triggerable from the documented API (createMemoryClient() + client.multicall).

5. The repo's own test packages/memory-client/src/test/viem/multicall.spec.ts:34-41 asserts all three multicall results are `{result: undefined, status: 'failure'}` and that `item.error?.message` contains 'aggregate3' — i.e. the test was written around the broken/missing predeploy rather than expecting success.

6. The multicall3Contract object is malformed for genesis insertion anyway: it has no address key, uses `storageRoot: '0x'`, and supplies `deployedBytecode` but no `codeHash`. The correct predeploy shape is demonstrated in the same createTevmNode.js block (storageRoot: bytesToHex(KECCAK256_RLP), codeHash: keccak256(deployedBytecode), keyed by address), confirming it was never wired up.

Severity: high is appropriate. multicall is a very common viem operation, every fresh non-forked node is affected, and the chain config promises the predeploy exists so callers will reliably hit the failure. Not critical (no fund loss / consensus corruption; localized to a missing predeploy and clearly tied to a test that encodes the broken behavior).


---

## [13] MEDIUM — BlockResult is double-owned: returned to caller and also stored (shallow copy) in mined_blocks, enabling double-free

- **Group:** zevm:block-mining  **Category:** memory-safety
- **Location:** `/Users/williamcory/zevm/src/mining_coordinator.zig:345-348 (mineBlockWithOptions)`

**What's wrong:** mineBlockWithOptions appends a shallow copy of `result` into `self.mined_blocks` and also returns `result` to the caller. BlockResult.deinit frees the heap slices `receipts` and `included_tx_indexes`, and the stored copy aliases the exact same pointers as the returned value. Coordinator.deinit frees every mined_blocks entry. Any caller that follows the normal Zig ownership convention and does `defer result.deinit(allocator)` will double-free those slices (and double-deinit each receipt's logs). Today no live caller deinits the returned value (submitTx discards it, mineBlocksWithOptions discards it, runtime relies on the coordinator to free it), so it is latent — but the public API returns an owned-looking value whose memory is silently owned by the coordinator, which is a footgun that will produce a heap corruption / double-free the moment a caller treats the return value as owned.

**Evidence:**
Lines 345-348: `const result_copy = result; try self.mined_blocks.append(allocator, result_copy); return result;`. result_copy.receipts == result.receipts (same pointer). deinit (block_builder.zig:117-123) does `allocator.free(self.receipts); allocator.free(self.included_tx_indexes);`. Coordinator.deinit (lines 237-243) iterates mined_blocks and calls b.deinit(allocator). If a caller writes `var r = try mc.mineBlock(...); defer r.deinit(alloc);` then on coordinator deinit the same receipts/included_tx_indexes are freed twice.

**Suggested fix:** Either deep-clone the BlockResult before storing in mined_blocks, or do not return an owned BlockResult — return a const view / index into mined_blocks, and document that the coordinator owns the memory. At minimum, return a value with zeroed/empty slices so the caller cannot accidentally free coordinator-owned memory.

**Verifier (high confidence):** Confirmed by reading the actual code. In mineBlockWithOptions (src/mining_coordinator.zig:345-348), the code does `const result_copy = result; try self.mined_blocks.append(allocator, result_copy); return result;`. Since BlockResult (src/block_builder.zig:104-124) contains heap slices `receipts: []Receipt` and `included_tx_indexes: []usize`, the shallow copy copies only the slice headers (ptr+len), so result_copy.receipts and the returned result.receipts alias the exact same heap allocation. BlockResult.deinit (block_builder.zig:117-123) frees both slices (and each receipt's logs via receipt.deinit). MiningCoordinator.deinit (mining_coordinator.zig:237-243) iterates mined_blocks and calls b.deinit(allocator) on every stored entry. Thus any caller that follows the normal Zig ownership convention for a returned heap-owning value and writes `defer result.deinit(allocator)` would double-free the same receipts/included_tx_indexes pointers and double-deinit each receipt's logs.\n\nI verified the bug is currently latent: the only non-test live caller is src/node/runtime.zig:1219-1227, which captures `var result` and uses it for persistMinedBlock/minedHashesFromResult but never calls result.deinit() — it relies on the coordinator owning the memory. The internal callers mineBlock/mineBlockWithPrevrandao just forward the value, mineBlocksWithOptions (line 376-377) discards it, and submitTx (line 284) discards it. So no double-free fires today.\n\nThe report's technical claims are all accurate. It correctly self-identifies as a latent footgun rather than an active crash. Severity medium is appropriate: it is not currently triggered (so not high/critical), but the public API returns an owned-looking BlockResult whose heap memory is silently owned by the coordinator, which is a genuine memory-safety trap that produces heap corruption the moment any caller treats the return value as owned. The suggested fix (deep-clone before storing, or return a const view/index, or zero out the returned slices) is sound.


---

## [14] MEDIUM — syncAccountToTrie drops storage_root, producing wrong account RLP and wrong state root for any contract with storage

- **Group:** zevm:state-db-proof  **Category:** consensus
- **Location:** `/Users/williamcory/zevm/src/database/database.zig:34-50 (syncAccountToTrie)`

**What's wrong:** syncAccountToTrie builds the AccountState that is RLP-encoded into the Accounts state trie using AccountState.from(.{ .nonce, .balance, .code_hash }) and never passes .storage_root. AccountState.from defaults storage_root to EMPTY_TRIE_ROOT (see voltaire AccountState.from, storage_root default = EMPTY_TRIE_ROOT). The Ethereum account RLP is [nonce, balance, storageRoot, codeHash]; omitting the real storage root means every contract account that has non-empty storage is encoded with storageRoot = EMPTY_TRIE_ROOT. The resulting trie leaf, and therefore Accounts.stateRoot(), is wrong for any account with storage. The module doc explicitly advertises this path as how to flush dirty accounts before reading stateRoot() to produce block headers, so a header built from this root would be consensus-invalid. The function also never reads the account's storage; there is no computeAccountStorageRoot call as exists in the correct block_builder.zig path (block_builder.zig:619 computeAccountStorageRoot).

**Evidence:**
database.zig lines 44-49:
  const account = primitives.AccountState.AccountState.from(.{
      .nonce = nonce,
      .balance = balance,
      .code_hash = code_hash,
  });   // <-- storage_root not provided
  try self.accounts.put(allocator, address, &account);
AccountState.from (voltaire) defaults storage_root to EMPTY_TRIE_ROOT. Trigger: deploy a contract C that writes a storage slot (e.g. SSTORE slot 0 = 1), call db.syncAccountToTrie(alloc, C); db.accounts.stateRoot(). The stored leaf has storageRoot = EMPTY_TRIE_ROOT instead of keccak(storage trie root), so stateRoot() differs from the canonical state root (the one block_builder.zig:590-634 computes via computeAccountStorageRoot). Any consumer using accounts.stateRoot() for a header gets a wrong/invalid root.

**Suggested fix:** Compute the real storage root and pass it: add a helper (mirroring block_builder.computeAccountStorageRoot) that builds the account's storage trie from StateManager storage and pass .storage_root = <computed> into AccountState.from. Also fold contract/storage-only accounts into syncCachedAccountsToTrie (see related finding).

**Verifier (high confidence):** Confirmed the code-level defect by reading the actual files.

/Users/williamcory/zevm/src/database/database.zig:44-48 builds the account via `primitives.AccountState.AccountState.from(.{ .nonce, .balance, .code_hash })` and never passes `.storage_root`. In the resolved dependency (primitives-0.1.0-9n3NfRx..., packages/voltaire-zig/src/primitives/AccountState/AccountState.zig:87-96) `from` defaults `storage_root: StateRoot.StateRoot = EMPTY_TRIE_ROOT` (line 90). The RLP encoder emits storage_root as field index 2 (AccountState.zig:208-209), matching Ethereum's `[nonce, balance, storageRoot, codeHash]`. So any account with non-empty storage flushed via syncAccountToTrie is encoded with storageRoot = EMPTY_TRIE_ROOT, yielding a wrong trie leaf and wrong accounts.stateRoot(). The correct contrast exists at block_builder.zig:619 (`computeAccountStorageRoot(...)`), which syncAccountToTrie does not mirror. The module doc (database.zig:9-11) explicitly advertises this as the path to flush dirty accounts before reading stateRoot() to produce block headers, so the diagnosis is accurate against real Ethereum account RLP semantics.

The bug is genuine but currently latent, which is why I downgrade severity from high to medium: the live block-header state root in the runtime is produced by block_builder.zig's computeStateRoot (the correct computeAccountStorageRoot path), not by db.accounts.stateRoot(). The only non-test caller of syncAccountToTrie is genesis.zig:273, where PremineAccount (genesis.zig:113-117) has only address/balance/nonce — no storage — and the genesis header root actually returned comes from computeStateRootFromPremine (genesis.zig:276), not from this trie. db.accounts.stateRoot() is otherwise referenced only in database/database_test.zig. So the function does silently produce a consensus-invalid root for any storage-bearing account exactly as described, but no current production consumer feeds it accounts with storage. The report's "high" rests on the assumption this path is actively used for headers, which it is not today; the underlying correctness defect and suggested fix (compute real storage root and pass .storage_root) are valid.


---

## [15] MEDIUM — eth_getTransactionCount with 'pending' tag ignores the txpool

- **Group:** zevm:rpc-handlers  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/rpc/handlers/eth_read.zig:115-124 (handleEthGetTransactionCount) + resolveStateReadBlockNumberValue 507-521`

**What's wrong:** For the 'pending' block tag, eth_getTransactionCount must return the next usable nonce, i.e. account nonce plus the number of consecutive pending transactions already in the mempool for that sender. Here 'pending' is resolved (via resolveTrustedRuntimeBlockSelector -> rpc_parse.resolveTrustedBlockSelector) to head_block_number and the committed state nonce is returned, with no consultation of rt.pool. Under manual/interval mining (mining_config = .manual or .interval), submitting several transactions and querying getTransactionCount(addr, 'pending') to compute the next nonce returns a stale value, causing nonce collisions / 'replacement underpriced' or queued txs that never mine. (Under auto mining the pool is usually empty so it is masked.)

**Evidence:**
handleEthGetTransactionCount calls resolveStateReadBlockNumber(rt, params.block) then read_state.getNonce(...). resolveStateReadBlockNumberValue for string 'pending' falls through to resolveTrustedRuntimeBlockSelector -> rpc_parse.resolveTrustedBlockSelector which maps 'pending' to head_block_number (parse.zig line 161-167). No branch inspects rt.pool / pending pool nonces (grep for 'pending' in eth_read.zig returns nothing; tx_submission tracks pool nonces via rt.pool.setNonce but the read path never reads them).

**Suggested fix:** Detect the literal 'pending' selector in handleEthGetTransactionCount and return max(stateNonce, highest consecutive pending pool nonce + 1) for the address using rt.pool, instead of just the committed state nonce.

**Verifier (high confidence):** Confirmed genuine by reading the code. In /Users/williamcory/zevm/src/rpc/handlers/eth_read.zig:115-124, handleEthGetTransactionCount calls resolveStateReadBlockNumber(rt, params.block) then read_state.getNonce(...) and returns only the committed state nonce. resolveStateReadBlockNumberValue (lines 507-521) routes the 'pending' string through resolveTrustedRuntimeBlockSelector -> rpc_parse.resolveTrustedBlockSelector (parse.zig:156-167), which maps 'pending' (along with latest/safe/finalized) to head_block_number. There is NO branch anywhere in this path that inspects rt.pool. grep for 'pending' in eth_read.zig returns nothing.

The mempool genuinely tracks the data needed: tx_submission.zig:123 (and :238) calls rt.pool.setNonce(sender, current_nonce) and rt.pool.add(...) on every accepted tx, and txpool.zig has baseNonce (185), isPending (175-183), and pendingCount (115) which together define the next consecutive pending nonce per sender. So the read path simply never reads what the write path stores.

This matches real Ethereum semantics: eth_getTransactionCount(addr, 'pending') must return the next usable nonce = account nonce + count of consecutive pending mempool txs (Geth/Anvil behavior, relied on by wallets to compute next nonce). Under manual/interval mining the pool persists across the query, so querying 'pending' after submitting several txs returns a stale committed nonce, causing nonce collisions / 'replacement underpriced' / stuck queued txs, exactly as described. Under auto mining the pool drains immediately so it is masked.

The light-mode path (dispatch_wiring.zig:2100-2102 -> rt.lightGetNonce) is a separate code path but exhibits the same gap; the primary trusted path (dispatch_wiring.zig:186-192) hits the confirmed-buggy handler.

Severity reduced/kept at medium: it is a real correctness break for a common multi-tx workflow, but it only manifests under non-default mining_config (.manual/.interval), is masked under auto mining, and clients can work around it via local nonce tracking. Not critical/high since it does not corrupt state or affect consensus, but the title and description are accurate.


---

## [16] MEDIUM — Double-free of object map in engineClientVersionValue on OOM (overlapping errdefers)

- **Group:** zevm:rpc-core  **Category:** memory-safety
- **Location:** `/Users/williamcory/zevm/src/rpc/dispatch_wiring.zig:900-919 (engineClientVersionValue)`

**What's wrong:** engineClientVersionValue installs two errdefer blocks that both target the same `obj` ObjectMap. The first errdefer (declared right after `obj` is created) deinits `obj`. After populating `obj`, a second errdefer is declared whose body ALSO deinits `obj` (via deinitJsonValue) and additionally calls array.deinit(). The only fallible statement between the second errdefer and the successful return is `try array.append(.{ .object = obj })`. If that append fails (OutOfMemory), BOTH errdefers fire in reverse order: the second frees `obj` (recursively freeing all the duped key/value strings and the map backing) and `array`, then the first errdefer frees `obj` a SECOND time. This is a double-free / use-after-free of the ObjectMap and all its allocations.

**Evidence:**
```zig
fn engineClientVersionValue(allocator: std.mem.Allocator) !std.json.Value {
    var obj = std.json.ObjectMap.init(allocator);
    errdefer { // FIRST errdefer: frees obj
        var value = std.json.Value{ .object = obj };
        deinitJsonValue(allocator, &value);
    }
    try putOwnedJson(&obj, allocator, "code", ...);
    ... // populate obj
    var array = std.json.Array.init(allocator);
    errdefer { // SECOND errdefer: ALSO frees obj, plus array
        var item = std.json.Value{ .object = obj };
        deinitJsonValue(allocator, &item);
        array.deinit();
    }
    try array.append(.{ .object = obj }); // if this OOMs -> both errdefers run -> obj freed twice
    return .{ .array = array };
}
```
Triggering scenario: a client calls `engine_getClientVersionV1` while the allocator is at/near capacity such that `array.append` returns error.OutOfMemory. The function then double-frees `obj` and the duped strings ("ZE", "zevm", "v0.1.0", "0x00000000" and their keys), corrupting the allocator/heap. Compare with the correct sibling helpers (engineCapabilitiesValue, accountsResponse) which use a single errdefer.

**Suggested fix:** Use a single ownership model. Either (a) after the second `array.append` succeeds the object is owned by the array, so structure it so only one errdefer is active at a time, e.g. transfer obj into a local `var obj_value = std.json.Value{ .object = obj };` with one errdefer freeing `obj_value`, append it, and on success it is owned by `array`; or (b) build the array first and only construct `obj` immediately before a single append, guarded by one errdefer. Concretely, drop the first errdefer once `obj` is moved into the array path, e.g.:
```zig
var obj = std.json.ObjectMap.init(allocator);
var moved = false;
errdefer if (!moved) { var v = std.json.Value{ .object = obj }; deinitJsonValue(allocator, &v); };
... populate ...
var array = std.json.Array.init(allocator);
errdefer array.deinit(); // array only owns obj after successful append
try array.append(.{ .object = obj });
moved = true;
return .{ .array = array };
```

**Verifier (high confidence):** Confirmed genuine double-free by reading /Users/williamcory/zevm/src/rpc/dispatch_wiring.zig lines 900-919.

engineClientVersionValue creates `obj` (line 901) and installs a FIRST errdefer (lines 902-905) that builds `std.json.Value{ .object = obj }` and calls deinitJsonValue, which for an object frees every key, every value, and calls object.deinit() (verified at lines 4391-4398). After populating obj with four duped key/value pairs (lines 906-909), it creates `array` and installs a SECOND errdefer (lines 912-916) whose body ALSO frees `obj` via deinitJsonValue AND additionally calls array.deinit().

The only fallible statement under both errdefers is `try array.append(.{ .object = obj })` at line 917. In Zig 0.15.2 (confirmed minimum_zig_version), std.json.Array is an ArrayList(Value) and append is fallible (error.OutOfMemory). If that append fails, both in-scope errdefers fire in reverse order: the second frees obj (all duped strings + map backing) and array, then the first frees obj a SECOND time — a clear double-free / use-after-free of the ObjectMap and its allocations.

This is not guarded anywhere: errdefer fires purely on the function returning an error, and both errdefers have been reached by line 917. The sibling helper engineCapabilitiesValue (lines 886-898) correctly uses a single errdefer, confirming the dual-errdefer-on-same-object pattern here is unintended rather than an intentional idiom.

Severity medium is correct: it is an error-path-only defect requiring array.append to OOM on a single small allocation, not reachable on the happy path, but when triggered it corrupts the heap. The reporter's evidence, trigger scenario (engine_getClientVersionV1 under allocator pressure), and suggested single-ownership fix are all accurate.


---

## [17] MEDIUM — Light-sync shutdown can hang because stopLightSyncThread joins without any cancellation signal

- **Group:** zevm:node-cli  **Category:** error-handling
- **Location:** `/Users/williamcory/zevm/src/node/runtime.zig:stopLightSyncThread (882-887), called first in deinit (1871)`

**What's wrong:** stopIntervalMiningTimer signals interval_stop_requested before join so the mining loop exits promptly. stopLightSyncThread has no equivalent stop flag: it merely calls thread.join(). The light sync thread runs runLightStartupSyncDetached which performs blocking network I/O (engine.sync over HTTP). If the consensus RPC endpoint is slow/unreachable/hung, NodeRuntime.deinit() (invoked via `defer runtime.deinit()` in main.zig for light mode, and on any startup error after startBackgroundServices) blocks until the network call returns or times out, stalling clean shutdown.

**Evidence:**
main.zig light branch: `runtime.startBackgroundServices()` spawns the light sync thread; `defer runtime.deinit()` -> deinit() first line `self.stopLightSyncThread();` -> `thread.join()` with no way to interrupt the in-flight engine.sync()/advance() network request. Compare with stopIntervalMiningTimer which sets interval_stop_requested=true before join.

**Suggested fix:** Add a cancellation flag (like interval_stop_requested) that the light sync thread checks between/within network steps, and/or impose a bounded HTTP timeout on consensus_sync requests, so deinit can request stop and join promptly instead of waiting on an unbounded network call.

**Verifier (high confidence):** Confirmed genuine by reading the actual code.

1) stopLightSyncThread (src/node/runtime.zig:882-887) calls `thread.join()` with no prior cancellation signal. Contrast with stopIntervalMiningTimer (805-811) which does `self.interval_stop_requested.store(true, .seq_cst)` BEFORE `thread.join()`, and intervalMiningLoop (813-829) polls that flag. The report's core claim — that light sync has no equivalent stop flag — is accurate.

2) The light sync thread runs lightSyncStartupLoop -> runLightStartupSyncDetached (900-937) -> `engine.sync(...)` (919). ConsensusSyncEngine.sync (src/consensus_sync.zig:90-136) performs multiple blocking HTTP GETs via BeaconApi (bootstrap, getUpdates, finality_update, optimistic_update).

3) BeaconApi.httpGet (src/beacon_api.zig:208-256) builds a `std.http.Client` with default options and performs `request.receiveHead(...)` (228) and `reader.streamRemaining(...)` (247) with NO connect or read timeout configured. A slow/unreachable/hung consensus endpoint blocks these calls indefinitely (bounded only by OS-level TCP timeouts, which can be minutes).

4) There is no cancellation mechanism in the sync path: grep for atomic/stop/cancel/shutdown/abort in consensus_sync.zig returns nothing, and LightModeState (src/node/runtime.zig:170-215) has no stop flag the thread could check.

5) deinit (1870-1913) calls stopLightSyncThread as its very FIRST action (1871). main.zig light branch (89-98) does `defer runtime.deinit()` right after `runtime.startBackgroundServices()` spawns the thread, and deinit also runs on any startup error after that point. So if the consensus RPC is slow/hung during the startup sync window, deinit() blocks on join() until the in-flight network call returns, stalling clean shutdown.

The suggested fix (add a checked cancellation flag and/or impose a bounded HTTP timeout) is appropriate.

Severity: medium is fair. It does not affect correctness or corrupt state and only manifests when the consensus endpoint hangs during the narrow startup-sync window; the hang is eventually bounded by OS TCP timeouts. But it does degrade clean shutdown / responsiveness, which is a real operational concern, so not low.


---

## [18] MEDIUM — BaseVm._emit silently swallows listener errors and can hang on synchronous listeners

- **Group:** tevm:vm  **Category:** error-handling
- **Location:** `/Users/williamcory/tevm-monorepo/packages/vm/src/createBaseVm.js:18-34 (_emit)`

**What's wrong:** _emit wraps event emission in a Promise that only resolves when (a) there are no listeners, or (b) a listener invokes the `resolve` callback passed as the 3rd argument to events.emit(topic, data, resolve). Two problems: (1) Any error thrown by a listener is caught by the outer try/catch and merely console.error'd, so the rejected inner promise is swallowed and _emit resolves to undefined — errors thrown in beforeTx/afterTx/beforeBlock/afterBlock listeners never propagate to the caller of runTx/runBlock. (2) If at least one listener is registered (events.emit returns truthy) but the listener is a plain synchronous handler that ignores the resolve callback, the returned promise never resolves, so `await vm._emit(...)` in runTx (lines 121, 524) and runBlock (lines 83, 187) hangs forever.

**Evidence:**
In createBaseVm.js: `const hasListeners = events.emit(topic, data, resolve); if (!hasListeners) { resolve() }` — resolution depends entirely on a listener calling `resolve`. A consumer doing `vm.events.on('afterTx', (event) => { doSomething(event) })` (a normal eventemitter3 listener that does not call the injected callback) will cause runTx's `await vm._emit('afterTx', event)` (runTx.ts:524) to never resolve. Separately, `catch (e) { console.error(e) }` swallows listener exceptions instead of propagating them.

**Suggested fix:** Do not rely on listeners invoking a resolve callback for the common synchronous case. Resolve immediately after emit when listeners are synchronous, or document/require the AsyncEventEmitter contract and propagate (rethrow) listener errors instead of console.error swallowing them.

**Verifier (high confidence):** Confirmed by reading the actual code. createBaseVm.js:18-34 implements `_emit` so that resolution depends on a listener invoking the `resolve` callback passed as the 2nd arg to `events.emit(topic, data, resolve)`. The guard `const hasListeners = events.emit(...); if (!hasListeners) resolve()` only resolves immediately when there are ZERO listeners.

HANG BUG (real, primary): The EventEmitter is eventemitter3@5.x (createBaseVm.js:1). Its `emit` (verified in node_modules/.pnpm/eventemitter3@5.0.4/.../index.js) returns `false` only when there are no listeners and `true` whenever >=1 listener exists, invoking them synchronously and never awaiting. So with any registered listener, `hasListeners` is truthy, the immediate-resolve branch is skipped, and the returned Promise resolves ONLY if a listener calls `resolve`. The PUBLICLY DOCUMENTED usage does not call resolve: VMEvents.ts:21-23 (`afterTx: (data) => { console.log(...) }`), AfterTxEvent.ts:14-17 (`vm.events.on('afterTx', (event) => {...})`), and the type makes resolve optional (VMEvents.ts:33-36, `resolve?`). A user following the documented API thus produces a listener that never calls resolve, so `await vm._emit(...)` in runTx.ts:121/524 and runBlock.ts:83/187 never resolves and runTx/runBlock hang forever. The only existing test passes solely because it explicitly does `jest.fn((_, done) => done())` (createBaseVm.spec.ts:37), masking the issue.

ERROR-HANDLING CLAIM (partially a misreading): The report says listener errors are swallowed by the outer `catch { console.error(e) }`. Structurally that is not quite right: the outer try wraps `return new Promise(...)`; the executor runs synchronously, and a throwing listener hits the inner `catch` -> `reject(e)`, returning a REJECTED promise that propagates to the awaiting caller (so the error does propagate, not get swallowed). The outer catch would only fire if the Promise constructor itself threw synchronously. So claim #1 is inaccurate, but it does not affect the verdict.

Overall the report's core thesis — that `_emit` is broken for the common synchronous-listener case and is triggerable via the documented public API — is genuine and verified. Severity raised from low to medium: a documented, normal usage causes an indefinite hang in the core runTx/runBlock execution paths, not merely a logged error.


---

## [19] MEDIUM — putBlock promotes a disconnected block to canonical head whenever the current head is genesis (unbounded "replacesGenesisBootstrap")

- **Group:** tevm:blockchain  **Category:** consensus
- **Location:** `/Users/williamcory/tevm-monorepo/packages/blockchain/src/actions/putBlock.js:42-53 (replacesGenesisBootstrap branch)`

**What's wrong:** The `replacesGenesisBootstrap` predicate is `latestBlock?.header.isGenesis() && block.header.number > latestBlock.header.number`. `isGenesis()` is implemented purely as `number === 0n` (packages/block/src/header.ts:671). It does NOT verify that the incoming block actually connects to the genesis block (no parentHash check). Because this predicate is a top-level OR branch in the `if (isBootstrapBlock || replacesGenesisBootstrap || (extendsLatest && ...))` condition (lines 46-50), it bypasses the `extendsLatest` connectivity check entirely. As a result, when the current head is block 0 (the normal state right after genesis/bootstrap), putting ANY block with number > 0 — even one whose parentHash points nowhere in the chain — makes it the canonical head ('latest'). This corrupts the canonical chain: a disconnected/out-of-order/forged block becomes the head and getCanonicalHeadBlock returns it.

**Evidence:**
Non-fork chain bootstraps with genesis as head: createBaseChain -> putBlock(genesis) sets blocksByTag('latest')=genesis (number 0). Now call putBlock(B) where B.header.number === 5n and B.header.parentHash is an arbitrary unrelated hash not in `blocks`. Trace in putBlock: latestBlock=genesis, isBootstrapBlock=false, parentBlock=blocks.get(parentHash)=undefined so validateHeader is skipped, extendsLatest = blockHasHash(genesis, parentHash) = false. replacesGenesisBootstrap = genesis.isGenesis()(true) && 5n>0n(true) = TRUE. So the branch fires and blocksByTag.set('latest', B) — a block that does not extend genesis is now the canonical head. The existing test 'should not promote a disconnected higher block to latest' (putBlock.spec.ts:46) only passes because it uses real optimism blocks whose number is non-zero so isGenesis() is false; it never exercises the genesis-head case.

**Suggested fix:** Require connectivity in the bootstrap-replacement case too: only treat it as replacing the genesis bootstrap when the new block's parentHash matches the genesis block's hash (blockHasHash(latestBlock, parentHash)) and/or its number is exactly latestBlock.number+1. e.g. `const replacesGenesisBootstrap = latestBlock?.header.isGenesis() && blockHasHash(latestBlock, parentHash)`.

**Verifier (high confidence):** Confirmed by reading the actual code. In /Users/williamcory/tevm-monorepo/packages/blockchain/src/actions/putBlock.js line 42, `replacesGenesisBootstrap = latestBlock?.header.isGenesis() && block.header.number > latestBlock.header.number`. `isGenesis()` (packages/block/src/header.ts:671-673) is purely `return this.number === 0n` — no parentHash/connectivity check. This predicate is a standalone OR branch in the promotion condition (lines 46-50: `isBootstrapBlock || replacesGenesisBootstrap || (extendsLatest && ...)`), so it bypasses the `extendsLatest` connectivity gate entirely.

Trace confirmed: createBaseChain.js:64-68 shows non-fork chains bootstrap with a genesis block (number 0) set as 'latest', so the normal post-bootstrap state has latestBlock.isGenesis()===true. Calling putBlock(B) with B.header.number===5n and an unrelated parentHash not present in `blocks`: latestBlock=genesis, isBootstrapBlock=false, parentBlock=undefined (so validateHeader at line 33-34 is skipped because parentBlock!==undefined is false), extendsLatest=blockHasHash(genesis, parentHash)=false, replacesGenesisBootstrap = true && (5n>0n) = TRUE. The branch fires and line 52 sets blocksByTag('latest')=B — a disconnected block becomes canonical head. getCanonicalHeadBlock.js:9 returns blocksByTag.get('latest'), so callers receive the forged head.

putBlock is a public Chain method (Chain.ts:44, createChain.js:29) with no validation wrapper, so it is reachable/triggerable. The existing test 'should not promote a disconnected higher block to latest' (putBlock.spec.ts:46-63) proves disconnected-block rejection is the INTENDED invariant, but it uses non-zero optimism block numbers (isGenesis()=false), so it never exercises the genesis-head path — exactly the gap. A properly connected block 1 (parentHash==genesis hash) already promotes correctly via the third branch (extendsLatest && 0n<1n), confirming replacesGenesisBootstrap is only needed/used for the non-connecting case, which it handles without any connectivity check.

Severity corrected from high to medium: this is a genuine violation of the chain's connectivity invariant, but it is narrowly scoped (only when head is still genesis on a non-fork chain AND a disconnected/out-of-order block is inserted). Normal sequential mining connects block 1 to genesis legitimately. Tevm is a local EVM dev/sim environment, not a real consensus node, so calling it 'consensus high' overstates real-world impact; medium reflects a real but bounded state-corruption bug. The suggested fix (require blockHasHash(latestBlock, parentHash) or number===latestBlock.number+1) is sound.


---

## [20] MEDIUM — txpool cleanup override collapses the 60-minute `handled` retention window down to the 20-minute pool window

- **Group:** tevm:evm-precompiles-tx  **Category:** state-management
- **Location:** `/Users/williamcory/tevm-monorepo/packages/txpool/src/TxPool.ts:84-109 (cleanup override, specifically lines 105-109)`

**What's wrong:** The Tevm `TxPool.cleanup()` override removes entries from the underlying ZEVM `handled` map for every tx hash that was evicted from `pool` during cleanup. ZEVM intentionally keeps `handled` records far longer than pool storage: `POOLED_STORAGE_TIME_LIMIT = 20` minutes (pool) vs `HANDLED_CLEANUP_TIME_LIMIT = 60` minutes (handled). ZEVM's own `cleanup()` cleans `pool` on the 20-min boundary but only cleans `handled` on the separate 60-min boundary. The Tevm override defeats this by deleting handled records as soon as a tx leaves the pool, effectively shrinking the handled-record lifetime from 60 to 20 minutes.

**Evidence:**
ZEVM (node_modules/@evmts/zevm/dist/txpool.js) cleanup(): pool is filtered with `compDate = Date.now() - POOLED_STORAGE_TIME_LIMIT*...` (20 min), and handled is filtered separately with `compDate = Date.now() - HANDLED_CLEANUP_TIME_LIMIT*...` (60 min). The Tevm override (TxPool.ts:105-109) does:
```
for (const hash of before) {
  if (!after.has(hash)) {
    pool.handled.delete(hash)
  }
}
```
where `before`/`after` are the pool hashes before/after `super.cleanup()`. Triggering scenario: a tx sits in the pool for >20 min; on the periodic cleanup it is removed from `pool` by ZEVM, then this override deletes it from `handled`. A subsequent `getTransactionStatus(hash)` returns 'unknown' instead of 'mined'/known, and the tx is no longer tracked as previously seen, even though ZEVM intended that record to persist for a full 60 minutes.

**Suggested fix:** Do not delete `handled` entries based on pool eviction. Let ZEVM's `super.cleanup()` manage the `handled` map on its own 60-minute schedule. If auxiliary index cleanup is needed, restrict it to `txsByHash`/`txsByNonce`/`txsInNonceOrder` (which ZEVM's cleanup does not maintain) and leave `handled` untouched.

**Verifier (high confidence):** Confirmed real by reading both files.

ZEVM source (packages/txpool/node_modules/@evmts/zevm/dist/txpool.js, symlinked from /Users/williamcory/tevm-monorepo/zevm/npm/zevm):
- Lines 95-96: `POOLED_STORAGE_TIME_LIMIT = 20` and `HANDLED_CLEANUP_TIME_LIMIT = 60` — two deliberately distinct retention windows.
- cleanup() lines 333-355: filters `this.pool` against a 20-min compDate (lines 334-348), then separately filters `this.handled` against a 60-min compDate (lines 350-355). So ZEVM intentionally keeps handled records 40 min longer than pool entries.
- getTransactionStatus() lines 408-417: returns 'pending' if in txsByHash, else 'mined' if in `handled`, else 'unknown'. The 'mined' branch depends on handled outliving the pool entry. This is the exact consumer that breaks.

Tevm override (/Users/williamcory/tevm-monorepo/packages/txpool/src/TxPool.ts lines 84-134):
- Line 92 snapshots pool hashes (before), line 94 calls super.cleanup() (which evicts at 20 min), lines 97-103 snapshot pool hashes after.
- Lines 105-109: `for (const hash of before) { if (!after.has(hash)) pool.handled.delete(hash) }` — deletes the handled record for EVERY hash evicted from pool, i.e. at the 20-min boundary, with no comment justifying it.

Net effect: a tx that sits in pool 20-60 min is pool-evicted by super.cleanup(), then the override deletes its handled entry, so getTransactionStatus() returns 'unknown' instead of 'mined' ~40 min before ZEVM intends. The override correctly needs to sync the Tevm-only side indexes txsByHash/txsByNonce/txsInNonceOrder (lines 111-133, which ZEVM's cleanup does not maintain), but bundling handled into that eviction is the bug. The suggested fix (leave handled to ZEVM's super.cleanup) is correct.

Note: the existing test TxPool.coverage.spec.ts:197-227 ages BOTH the pool object and the handled entry to the same 20-min oldTime (lines 204-210), so it never exercises the bug scenario where pool ages out but handled is still within 60 min; it therefore does not document this as intended behavior.

Severity: medium is appropriate but on the lower end. Impact is bounded — it only affects status reporting for evicted txs during the 20-60 min window in an in-memory pool, getByHash results are unaffected (lines 252-265 require the tx still be in-pool), and there is no crash or data corruption. It is a genuine behavioral regression against ZEVM's intended semantics.


---

## [21] MEDIUM — numberToHex loses precision on large decimal difficulty strings (Number.parseInt instead of BigInt)

- **Group:** tevm:trie-rlp-block-receipt  **Category:** consensus
- **Location:** `/Users/williamcory/tevm-monorepo/packages/block/src/helpers.ts:11-22 (numberToHex)`

**What's wrong:** numberToHex is documented to accept a '0x-prefixed hex or integer (decimal) string' and is used to normalize the block header `difficulty` field coming from JSON-RPC (header-from-rpc.ts line 47: `difficulty: numberToHex(difficulty)`). For the decimal-string branch it does `Number.parseInt(input, 10).toString(16)`, which routes the value through a 64-bit IEEE-754 float. Any value above Number.MAX_SAFE_INTEGER (2^53) is silently rounded, producing a wrong hex string and therefore a wrong difficulty in the constructed BlockHeader. Mainnet/PoW difficulty values are routinely far above 2^53 (e.g. ~5.8e22 near the merge), so a header round-tripped through an RPC provider that returns difficulty as a decimal string (JsonRpcBlock.difficulty is typed `Hex | string` and the doc explicitly supports integer strings) would get a corrupted difficulty. A corrupted difficulty changes the header RLP and thus the block hash, and breaks ethashCanonicalDifficulty/totalDifficulty comparisons.

**Evidence:**
Reproduced the rounding:
  input = '58750003716598352816469' (a realistic mainnet difficulty)
  Number.parseInt(input,10).toString(16) => 'c70d815d562d4000000'  (WRONG)
  BigInt(input).toString(16)               => 'c70d815d562d3cfa955'  (correct)
The low-order digits are lost. numberToHex is the only normalizer applied to `difficulty` in blockHeaderFromRpc, so the corrupted hex is fed straight into BlockHeader.fromHeaderData -> header.raw() -> hash().

**Suggested fix:** Replace `Number.parseInt(input, 10).toString(16)` with a BigInt conversion, e.g. `return `0x${BigInt(input).toString(16)}``. BigInt also naturally validates the all-digits input.

**Verifier (high confidence):** Confirmed genuine. In /Users/williamcory/tevm-monorepo/packages/block/src/helpers.ts line 19, the decimal-string branch returns `0x${Number.parseInt(input, 10).toString(16)}`, routing the value through a 64-bit float. I empirically reproduced the exact rounding: parseInt('58750003716598352816469',10).toString(16) => 'c70d815d562d4000000' (WRONG) vs BigInt => 'c70d815d562d3cfa955' (correct), matching the report. The decimal-string branch is reachable: numberToHex is documented (line 8) and its error message (line 16) to accept integer (decimal) strings, and it is applied to difficulty in header-from-rpc.ts line 47 (`difficulty: numberToHex(difficulty)`), where JsonRpcBlock.difficulty is typed `Hex | string` (types.ts line 477). A corrupted difficulty changes header.raw()/RLP and the block hash, and breaks difficulty/totalDifficulty comparisons. The suggested fix (`return `0x${BigInt(input).toString(16)}``) is correct and BigInt also validates all-digit input.

Severity adjusted from high to medium: in standard Ethereum JSON-RPC, difficulty is returned as a 0x-prefixed hex string, which takes the pass-through branch (line 21, isHex true) and is unaffected. The corruption only triggers when a provider or caller passes a decimal-string difficulty, which is non-standard for eth_getBlockByNumber. So the vulnerable path is real, reachable, and documented-as-supported, but the common real-world RPC case does not hit it. Also note PoW/high-difficulty blocks only exist pre-merge; post-merge difficulty is 0. Still a genuine correctness bug on a supported, documented code path that silently corrupts consensus-critical data, warranting a fix.


---

## [22] MEDIUM — eth_getBalance historical-block cache lookup uses non-checksummed address key, missing the cache (and erroring in non-fork mode)

- **Group:** tevm:actions-eth  **Category:** logic
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/eth/getBalanceHandler.js:42-48 (root[address])`

**What's wrong:** When resolving eth_getBalance for a historical block tag, the handler indexes the cached TevmState object with the raw input address: `if (root?.[address]) return root[address].balance`. However the TevmState map is keyed by EIP-55 checksummed addresses (see dumpCannonicalGenesis.js line 23/45, which stores entries under getAddress(address)). JSON-RPC clients almost always send addresses lowercased, so root[address] (lowercase) never matches the checksummed key. The sibling getCodeHandler.js correctly normalizes via getAddress(params.address) (line 46), confirming the intended behavior; getBalanceHandler does not.

**Evidence:**
getBalanceHandler.js:45-46:
  const root = vm.stateManager._baseState.stateRoots.get(bytesToHex(block.header.stateRoot))
  if (root?.[address]) return root[address].balance
The key was written as getAddress(hexAddress) in packages/state/src/actions/dumpCannonicalGenesis.js:23,45. Verified mismatch: getAddress('0xb794f5ea0ba39494ce839613fffba74279579268') === '0xb794F5eA0ba39494cE839613fffBA74279579268' (!== lowercase input). getBalanceProcedure.js passes req.params[0] through unchanged.
Triggering scenario: a NON-forked local node, call eth_getBalance(address_lowercase, '0x1') where block 1 exists with cached state. root[address] is undefined → control falls through to line 50 `if (!baseClient.forkTransport) throw new NoForkUrlSetError('No fork url set')`. The caller gets a spurious error instead of the correct cached balance. In forked mode it silently misses the cache and re-fetches over RPC, defeating the caching optimization (and ignoring any local state changes applied at that block).

**Suggested fix:** Normalize the lookup key, mirroring getCodeHandler: `const acct = root?.[getAddress(address)]; if (acct) return acct.balance` (import getAddress from '@tevm/utils').

**Verifier (high confidence):** Confirmed by reading the actual code. In packages/actions/src/eth/getBalanceHandler.js:45-46, the handler does `const root = vm.stateManager._baseState.stateRoots.get(bytesToHex(block.header.stateRoot)); if (root?.[address]) return root[address].balance` using the raw input `address`. The `root` is a TevmState object whose keys are EIP-55 checksummed addresses: commit.js:43 stores `dumpCanonicalGenesis(baseState)()` into stateRoots, and dumpCannonicalGenesis.js:23,45 keys each entry under `getAddress(hexAddress)`. getBalanceProcedure.js passes `req.params[0]` through unchanged, and JSON-RPC clients normally send lowercase addresses. Verified `getAddress('0xb794f5ea0ba39494ce839613fffba74279579268') === '0xb794F5eA0ba39494cE839613fffBA74279579268'` (!== lowercase). So `root?.[address]` misses the cache. The sibling getCodeHandler.js:45-46 correctly normalizes via `getAddress(params.address)`, confirming intended behavior and the inconsistency. Triggering scenario holds: non-fork node + lowercase address + historical numeric block with cached state → cache miss → falls through to line 50-51 and throws NoForkUrlSetError instead of returning the cached balance. In fork mode it silently re-fetches via RPC (lines 53-59), missing cache and any local state changes at that block. Severity lowered to medium rather than high: the common 'latest' path (lines 23-25) uses createAddress→stateManager and is unaffected; only historical/numeric block tags hit this path, and fork mode degrades to a (mostly) correct RPC fetch rather than erroring. The suggested fix (normalize via getAddress, mirroring getCodeHandler) is correct.


---

## [23] MEDIUM — Trace `failed` flag hardcoded to false for reverting traced calls in executeCall

- **Group:** tevm:actions-call  **Category:** trace-assembly
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/Call/executeCall.js:55-82 (createTrace branch + lines 78-82)`

**What's wrong:** When a call is executed with `createTrace: true`, executeCall obtains the trace via `runCallWithTrace(vm, client.logger, evmInput, true)` (lazy mode). In lazy mode runCallWithTrace returns early (runCallWithTrace.js line 69-72) WITHOUT ever computing `trace.failed` from the execution result — it leaves the initial default `failed: false`. The non-lazy branch (runCallWithTrace.js line 84) is the only place `failed` is computed from `exceptionError`, and it is never reached for this path. Back in executeCall, after runTx completes, lines 78-82 then set `trace.failed = false` UNCONDITIONALLY, regardless of whether `runTxResult.execResult.exceptionError` is defined. As a result, any reverted / errored call that requests a trace reports `trace.failed === false`, which is incorrect. Consumers (debug_traceCall / debug_traceTransaction style consumers) that read the top-level `failed` flag will treat a failed execution as successful.

**Evidence:**
executeCall.js:
```js
if (params.createTrace) {
  const traceResult = await runCallWithTrace(vm, client.logger, evmInput, true) // lazy=true
  trace = traceResult.trace
  ...
}
...
if (trace) {
  trace.gas = runTxResult.execResult.executionGasUsed
  trace.failed = false   // <-- always false, even when execResult.exceptionError is defined
  trace.returnValue = bytesToHex(runTxResult.execResult.returnValue)
}
```
runCallWithTrace.js lazy path (never computes failed):
```js
if (lazilyRun) {
  return ({ trace, cleanup })  // trace.failed still default false
}
... // line 84 sets trace.failed = exceptionError !== undefined, but only in non-lazy path
```
Triggering scenario: `client.tevmCall({ to: contractThatReverts, data, createTrace: true })`. The returned `trace.failed` is `false` despite the EVM reverting. The individual struct log error is set via onAfterMessage, but the summary `failed` boolean is wrong.

**Suggested fix:** In executeCall.js set `trace.failed = runTxResult.execResult.exceptionError !== undefined` instead of hardcoding `false`.

**Verifier (high confidence):** Confirmed by reading the actual files.

executeCall.js (line 55-60) calls `runCallWithTrace(vm, client.logger, evmInput, true)` with lazilyRun=true. In runCallWithTrace.js, the lazy branch returns early at lines 69-72 with the default trace object (`failed: false`, initialized at line 22), and only the non-lazy branch computes `trace.failed = runCallResult.execResult.exceptionError !== undefined` at line 84. Therefore the lazy path used by executeCall never derives `failed`.

Back in executeCall.js lines 78-82, after runTx completes, the code unconditionally sets `trace.failed = false` (line 80) without consulting `runTxResult.execResult.exceptionError`. The surrounding code clearly has access to `exceptionError` (used at line 87 for logging and lines 114-115 to build the errors array), so a reverted call still produces `trace.failed === false`.

The trace then propagates unchanged to the caller: callHandler.js:215/226/233 forwards `executedCall.trace`, and callHandlerResult.js:23-24 assigns `out.trace = trace`. The TraceResult type (common/TraceResult.ts:6) documents `failed: boolean`, and callHandlerResult.spec.ts:89 asserts it is propagated. So `tevmCall({ to: revertingContract, data, createTrace: true })` returns `result.trace.failed === false` despite the revert. The suggested fix (`trace.failed = runTxResult.execResult.exceptionError !== undefined`) is correct.

Scope correction lowering severity from high to medium: the report claims debug_traceCall/debug_traceTransaction consumers are affected, but that is wrong. traceCallHandler.js:86-88 (the default struct-log debug_traceCall path) calls `runCallWithTrace(vm, logger, callParams)` WITHOUT lazilyRun, so it hits the non-lazy branch and computes `failed` correctly. The bug is confined to the tevmCall createTrace API surface. Additionally, per-opcode errors are still recorded via onAfterMessage (runCallWithTrace.js:50-60) and the top-level call `errors` array is still correct (executeCall.js:113-117); only the trace summary `failed` boolean is wrong. Real bug, genuinely triggerable, but narrower than reported, so medium.


---

## [24] MEDIUM — Deploy revert data never decoded: isHex check uses err.message instead of rawData

- **Group:** tevm:actions-call  **Category:** revert-decoding
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/Deploy/deployHandler.js:85-106 (condition at line 87)`

**What's wrong:** deployHandler attempts to decode constructor revert errors, but the guard `if (isHex(err.message) && err instanceof RevertError)` checks `err.message`, which for a RevertError produced by the call pipeline is the EVM error string `'revert'` (see createEvmError.js case 'revert' -> `new RevertError('revert', ...)` and callHandlerResult.js which pushes createEvmError(exceptionError)). `err.message` is therefore NEVER a hex string, so the decode block is dead code and constructor reverts are returned undecoded. By contrast contractHandler.js (line 107) correctly checks `isHex(result.rawData)` — the revert payload lives in `result.rawData`, not in `err.message`. Also note `decodeErrorResult` is being fed `data: err.message` (the string 'revert') even if the branch were entered, which would be wrong data.

**Evidence:**
deployHandler.js:
```js
if (result.errors && result.errors.length > 0) {
  result.errors = result.errors.map((err) => {
    if (isHex(err.message) && err instanceof RevertError) {  // err.message === 'revert', never hex
      const decodedError = decodeErrorResult({ abi: params.abi, data: err.message, functionName: 'constructor' })
      ...
    }
    return err
  })
}
```
createEvmError.js: `case 'revert': return new RevertError(errorMessage /* 'revert' */, { cause: error })`.
Triggering scenario: `deployHandler(client)({ abi, bytecode, args })` where the constructor reverts with a custom error. The user receives the generic 'revert' RevertError with no decoded error name/args, even though the abi + raw revert data are available. The equivalent contract call would be decoded.

**Suggested fix:** Mirror contractHandler: check `isHex(result.rawData)` and decode `result.rawData` (the actual revert payload) with `decodeErrorResult({ abi: params.abi, data: result.rawData, functionName: 'constructor' })` (or use getContractError), rather than `err.message`.

**Verifier (high confidence):** Confirmed by reading the actual code.

1. deployHandler.js:87 guards the decode block with `if (isHex(err.message) && err instanceof RevertError)`. For a revert produced by the call pipeline, createEvmError.js:54-55 returns `new RevertError(errorMessage, { cause: error })` where errorMessage === error.error === 'revert'. RevertError (packages/errors/src/ethereum/RevertError.js) sets `message` to the first constructor arg verbatim ('revert') and does NOT coerce it to hex. So `isHex(err.message)` is `isHex('revert')` === false, and the decode block (deployHandler.js:88-103) is dead code. Constructor reverts are returned with the generic 'revert' RevertError, never decoded into the custom error name/args.

2. The revert payload actually lives in `result.rawData`: callHandlerResult.js:19 sets `rawData: bytesToHex(...execResult.returnValue)` and callHandlerResult.js:93 pushes `createEvmError(...exceptionError)` as the error. So the raw revert bytes are in result.rawData, not err.message.

3. Even if the branch were somehow entered, deployHandler.js:94 passes `data: err.message` ('revert') to decodeErrorResult, which would throw / be wrong data.

4. The fix pattern is proven correct in the sibling contractHandler.js:107 which checks `isHex(result.rawData)` and at line 112 builds the contract error from `result.rawData`.

Severity kept at medium: the error is still surfaced to the caller (not swallowed/crashing) and result.rawData still holds the raw payload, so callers can manually decode; the defect is a missing/dead decoding path that degrades the error message UX for constructor reverts relative to the equivalent contract call. Suggested fix (mirror contractHandler using isHex(result.rawData) + decode result.rawData / getContractError) is accurate.

Relevant files: /Users/williamcory/tevm-monorepo/packages/actions/src/Deploy/deployHandler.js (lines 85-108), /Users/williamcory/tevm-monorepo/packages/actions/src/internal/createEvmError.js (lines 48-55), /Users/williamcory/tevm-monorepo/packages/actions/src/Call/callHandlerResult.js (lines 18-19, 90-93), /Users/williamcory/tevm-monorepo/packages/actions/src/Contract/contractHandler.js (lines 105-128), /Users/williamcory/tevm-monorepo/packages/errors/src/ethereum/RevertError.js.


---

## [25] MEDIUM — debug_storageRangeAt applies one transaction too many (off-by-one vs txIndex semantics)

- **Group:** tevm:actions-anvil-debug  **Category:** off-by-one
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/debug/debugStorageRangeAtHandler.js:87 (for loop bound `i <= txIndex`)`

**What's wrong:** debug_storageRangeAt(blockHash/blockTag, txIndex, ...) is defined (per geth's StateAtTransaction) to return storage as of the state right BEFORE the transaction at txIndex executes, i.e. after applying transactions [0, txIndex). This handler loops `for (let i = 0; i <= txIndex; i++)` and replays transactions [0, txIndex] INCLUSIVE, so it returns storage AFTER the indexed transaction runs. This is one transaction off and yields wrong storage for any txIndex > 0 where the indexed tx mutates the target account's storage. Note the sibling debug_traceTransaction handler uses the correct exclusive bound (`i < transactionIndex`) for the same 'replay preceding txs' purpose, highlighting the inconsistency.

**Evidence:**
debugStorageRangeAtHandler.js line 87: `for (let i = 0; i <= txIndex; i++) { const tx = block.transactions[i]; ... await vmClone.runTx(...) }`. Compare debugTraceTransactionProcedure.js line 67-69: `block.transactions.filter((_, i) => i < hexToNumber(...transactionIndex))` (exclusive). Triggering scenario: a block whose tx at index 1 writes slot 0x5 of contract C; calling debug_storageRangeAt(block, txIndex=1, address=C) will incorrectly include the write performed by tx[1] instead of returning the pre-tx[1] storage. Tests do not catch this because every spec uses txIndex: 0 (and several are skipped).

**Suggested fix:** Change the loop bound to exclusive: `for (let i = 0; i < txIndex; i++)` so only transactions preceding txIndex are applied, matching geth's storageRangeAt / StateAtTransaction semantics and the debug_traceTransaction handler.

**Verifier (high confidence):** Confirmed genuine off-by-one by reading the actual file. In /Users/williamcory/tevm-monorepo/packages/actions/src/debug/debugStorageRangeAtHandler.js line 87, the replay loop is `for (let i = 0; i <= txIndex; i++)` (inclusive). Inside the loop (lines 88-119) it calls `vmClone.runTx` for each transaction including `block.transactions[txIndex]`, then dumps storage (line 128). This returns storage AFTER the transaction at txIndex executes.

geth's documented semantics for debug_storageRangeAt are the opposite: the txIndex parameter means "take state BEFORE the transaction with index txIndex" (confirmed via go-ethereum docs/issues search — StateAtTransaction/ComputeStateContext applies only transactions [0, txIndex) exclusive). So the correct bound is `i < txIndex`.

The inconsistency is corroborated by the sibling handler debugTraceTransactionProcedure.js lines 67-69, which for the identical "replay the preceding transactions" purpose uses the exclusive bound `block.transactions.filter((_, i) => i < hexToNumber(...transactionIndex))` and then traces the target tx separately. Two handlers in the same package treat the same concept differently; the storageRangeAt one is the wrong one.

This is triggerable and not guarded elsewhere: there is no separate handling that compensates. For any txIndex>0 whose transaction writes the queried account's storage, the result includes that write incorrectly (and even at txIndex=0 it applies tx[0] when it should apply none). Tests do not catch it — every case in debugStorageRangeAtHandler.spec.ts uses txIndex: 0, and none asserts the pre/post-tx storage difference.

Severity medium is appropriate: it is a debug/diagnostic RPC (not consensus-critical execution), but it silently returns state that contradicts the documented geth contract, which can mislead tooling/users. Suggested fix (`i < txIndex`) is correct.


---

## [26] MEDIUM — deepCopy() loses the impersonated account

- **Group:** tevm:node-client  **Category:** state-management
- **Location:** `/Users/williamcory/tevm-monorepo/packages/node/src/createTevmNode.js:607-618, 783-786 (deepCopy)`

**What's wrong:** deepCopy declares a fresh `let impersonatedAccount` initialized to undefined and never copies the parent's impersonated account via baseClient.getImpersonatedAccount(). Every other piece of per-node config IS copied (autoImpersonate at line 623, tracesEnabled at 635, next-block timestamp/gasLimit/baseFee/prevRandao, minGasPrice, blockTimestampInterval, snapshots). The copied client's getImpersonatedAccount() therefore always returns undefined regardless of parent state. Since getImpersonatedAccount() is consumed by ethSendTransactionHandler/ethSendRawTransactionHandler to authorize sending from an unowned address, a deep-copied node cannot send transactions from the address the parent was impersonating.

**Evidence:**
Line 611: `let impersonatedAccount` (no initialization). Line 623 copies auto-impersonate: `let copiedAutoImpersonate = baseClient.getAutoImpersonate()`. But there is no analogous `impersonatedAccount = baseClient.getImpersonatedAccount()`. Line 784 returns this always-undefined variable. Consumers: packages/actions/src/eth/ethSendTransactionHandler.js:21 and ethSendRawTransactionHandler.js:68 call client.getImpersonatedAccount(). Triggering scenario: node.setImpersonatedAccount(addr); const copy = await node.deepCopy(); copy.getImpersonatedAccount() === undefined; sending a tx from addr on `copy` is rejected even though it succeeds on the original.

**Suggested fix:** Initialize the copied value: `let impersonatedAccount = baseClient.getImpersonatedAccount()` (matching the auto-impersonate copy on line 623).

**Verifier (high confidence):** Confirmed genuine by reading the actual code in /Users/williamcory/tevm-monorepo/packages/node/src/createTevmNode.js. In the deepCopy factory, line 611 declares `let impersonatedAccount` with NO initialization (left undefined), and the copied client's getImpersonatedAccount() at lines 783-784 returns this variable. Every other per-node config IS copied from the parent: getAutoImpersonate (line 623), getTracesEnabled (635), getNextBlockTimestamp (647), getNextBlockGasLimit (658), getNextBlockBaseFeePerGas (669), getNextBlockPrevRandao (671), getMinGasPrice (688), getBlockTimestampInterval (699), and snapshots (710). The conspicuous omission of `impersonatedAccount = baseClient.getImpersonatedAccount()` means a deep-copied node always returns undefined from getImpersonatedAccount(), regardless of parent state. The original node (lines 1042-1043) does return the set value, confirming the asymmetry. Consumers verified: ethSendTransactionHandler.js:21 and ethSendRawTransactionHandler.js:68 both call client.getImpersonatedAccount() to authorize unsigned txs from an impersonated address.\n\nOne correction to the report's stated consequence: the tx is not strictly "rejected." Both handlers have an `else if (!tx.isSigned())` fallback (ethSendTransactionHandler.js:38, ethSendRawTransactionHandler.js:85) that uses `impersonatedAccount ?? prefundedAccounts[0]`. So with undefined impersonation, an unsigned tx gets impersonated as the FIRST PREFUNDED ACCOUNT instead of the intended address — i.e., the tx executes from the wrong sender rather than being rejected. This is arguably worse (silent wrong-sender) but the report's core claim (deepCopy loses the impersonated account, breaking impersonation on the copy) is fully accurate and triggerable via: node.setImpersonatedAccount(addr); const copy = await node.deepCopy(); copy.getImpersonatedAccount() === undefined.\n\nSeverity medium is appropriate: real state-loss bug, but impersonation is a dev/test feature and deepCopy is off the hot path. The suggested one-line fix (`let impersonatedAccount = baseClient.getImpersonatedAccount()`) is correct and matches the existing pattern.


---

## [27] MEDIUM — Interval mining silently swallows a missing post-mine state root

- **Group:** tevm:node-client  **Category:** error-handling
- **Location:** `/Users/williamcory/tevm-monorepo/packages/node/src/createTevmNode.js:968-976 (minePendingTransactions)`

**What's wrong:** In minePendingTransactions, after building/committing the block the code looks up the new state root in the deep-copied vm's _baseState.stateRoots and only calls originalVm.stateManager.saveStateRoot when it is found; if it is undefined the save is silently skipped, yet line 976 still does originalVm.stateManager.setStateRoot(getCurrentStateRoot()). The canonical mineHandler (packages/actions/src/Mine/mineHandler.js:184-194) treats this same missing-state-root condition as a hard InternalError because proceeding leaves the canonical state manager pointing at a state root whose state was never copied over. Doing this only for interval mining means an interval-mined block can leave originalVm with an unresolvable / inconsistent canonical state root instead of failing loudly.

**Evidence:**
Lines 968-976:
  const state = vm.stateManager._baseState.stateRoots.get(bytesToHex(block.header.stateRoot))
  if (state !== undefined) {
    originalVm.stateManager.saveStateRoot(block.header.stateRoot, state)
  }
  // ... no else / no error ...
  await originalVm.stateManager.setStateRoot(hexToBytes(vm.stateManager._baseState.getCurrentStateRoot()))
Compare mineHandler.js:186-194 which returns an InternalError ('State root not found in mineHandler') in the undefined case. Triggering scenario: any interval mining cycle where the freshly committed state root is not present in the copied base state map will silently proceed and set a canonical state root with no backing state, leading to later state lookups failing.

**Suggested fix:** Mirror mineHandler: if `state === undefined`, throw/log an InternalError and abort the mining cycle instead of skipping the saveStateRoot but still calling setStateRoot.

**Verifier (high confidence):** Confirmed by reading both files. In packages/node/src/createTevmNode.js, the interval-mining function minePendingTransactions (starts line 897) does at lines 968-971: `const state = vm.stateManager._baseState.stateRoots.get(bytesToHex(block.header.stateRoot)); if (state !== undefined) { originalVm.stateManager.saveStateRoot(block.header.stateRoot, state) }` with no else branch, then unconditionally at line 976: `await originalVm.stateManager.setStateRoot(hexToBytes(vm.stateManager._baseState.getCurrentStateRoot()))`. So when the looked-up state is undefined, saveStateRoot is silently skipped but setStateRoot still runs, leaving the canonical state manager pointed at a state root whose state was never copied over.

The canonical mineHandler at packages/actions/src/Mine/mineHandler.js lines 184-196 handles the identical condition differently: `const value = vm.stateManager._baseState.stateRoots.get(bytesToHex(block.header.stateRoot)); if (!value) { return maybeThrowOnFail(throwOnFail, { errors: [new InternalError('InternalError: State root not found in mineHandler...')] }) }` and only reaches saveStateRoot/setStateRoot (lines 196, 202) when value is present. The two paths genuinely diverge for the same invariant.

The divergence and silent-skip are real and as described. It is an internal-invariant violation (commit(true) should normally populate _baseState.stateRoots), so it is not a routinely-triggered crash but a defensive/error-handling robustness gap: if the invariant is ever violated, interval mining proceeds with an unbacked canonical state root instead of failing loudly like the canonical handler. Severity medium is appropriate (error-handling consistency, conditional impact). Suggested fix to mirror mineHandler is correct.


---

## [28] LOW — Devnet genesis header timestamp uses wall-clock time, making genesis block hash non-deterministic across restarts

- **Group:** zevm:block-mining  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/genesis.zig:188-200 (createGenesisBlockWithProfile devnet branch) and 583 (devnetHeaderForTests)`

**What's wrong:** The devnet genesis header sets `.timestamp = @intCast(std.time.timestamp())`. The genesis block hash (computed by primitives.Block.from) therefore depends on the moment the node starts. Two runs of the same chain produce different genesis hashes, so block 0's hash is not reproducible. Anything that pins to a genesis hash (peer comparison, persisted DB validation, snapshots, client reconnection expecting a stable genesis) will mismatch across restarts. A dev chain genesis should normally use a fixed timestamp (e.g. 0) so the genesis hash is deterministic.

**Evidence:**
Line 193-194 in the devnet branch: `.timestamp = @intCast(std.time.timestamp()),`. createGenesisBlockWithProfile returns primitives.Block.from(&header,...) whose .hash is derived from the header including timestamp. Restarting the node a second later yields a different timestamp and thus a different genesis_hash returned in GenesisResult (line 256) and stored as canonical head (line 251).

**Suggested fix:** Use a fixed deterministic genesis timestamp (e.g. 0 or a configured constant) for the devnet profile instead of std.time.timestamp(), or thread a caller-provided timestamp so genesis is reproducible.

**Verifier (high confidence):** Confirmed by reading the actual code. In /Users/williamcory/zevm/src/genesis.zig the devnet branch of createGenesisBlockWithProfile (line 192) sets `.timestamp = @intCast(std.time.timestamp())`, wall-clock time. devnetHeaderForTests (line 583) does the same. By contrast the mainnet branch (line 183) uses a fixed `.timestamp = 0`.

The genesis hash is genuinely derived from this timestamp: createGenesisBlockWithProfile returns primitives.Block.from(&header,&body) (line 202). In the primitives dependency, Block.from computes `block_hash = BlockHeader.hash(header)` (Block.zig:58-65), and BlockHeader.rlpEncode includes the timestamp as RLP field 12 (BlockHeader.zig:265-268), with the hash being keccak256 of that RLP. So the genesis_hash returned in GenesisResult (line 256) and stored as canonical head (line 251) changes whenever the node restarts at a different wall-clock second. The bug as described is real and triggerable.

Severity is correctly rated low (I keep low). Within a single run everything is internally consistent (all derived from the same genesis_block.hash), so a running node is fine. The impact is purely cross-restart reproducibility (peer genesis comparison, persisted-DB validation, snapshot pinning), and only on the devnet profile — mainnet already uses a fixed timestamp. Notably, common dev tooling (e.g. Anvil) also defaults the genesis timestamp to current time, so this is a borderline/partially-intentional behavior rather than a severe consensus defect. The suggested fix (use a fixed/configurable timestamp) is reasonable.


---

## [29] LOW — mpt_proof.secureProof emits embedded (inline) child nodes as separate proof entries, deviating from EIP-1186

- **Group:** zevm:state-db-proof  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/mpt_proof.zig:192-230 (collectProofNodes)`

**What's wrong:** collectProofNodes unconditionally appends a separate, full RLP-encoded proof entry for every node along the path, including child nodes whose RLP encoding is shorter than 32 bytes. In a canonical Ethereum MPT / EIP-1186 proof, a child node smaller than 32 bytes is embedded inline inside its parent and is NOT returned as a standalone proof element (only nodes referenced by hash appear as separate entries). The parent serialization here is correct (fullNodeData/nodeReferenceData inline small children), so a standard hash-keyed verifier such as geth's trie.VerifyProof will simply ignore the redundant entry; but the proof returned via eth_getProof (eth_read.zig:723,747,774) is non-canonical and larger than spec, and strict verifiers that reject unreferenced/extra nodes or that assume each proof element is hash-referenced could misbehave. This produces proofs that differ from what other clients return for the same state.

**Evidence:**
collectProofNodes (mpt_proof.zig:200-201) appends the encoding of every visited node, then for extension/branch recurses into the child even when nodeReferenceData would have inlined that child (mpt_proof.zig:242 'if (encoded.len < 32) return full;'). So a branch with a <32-byte child both inlines the child in the branch RLP and appends the same child again as its own proof entry. eth_read.zig:747/774 feed secureProof output straight into eth_getProof responses (proofNodesValue, line 723).

**Suggested fix:** In collectProofNodes, only append a node as a separate proof element when it is hash-referenced by its parent (i.e., its encoded length >= 32). Skip emitting standalone entries for embedded children, mirroring nodeReferenceData's >=32 threshold.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/zevm/src/mpt_proof.zig and the caller.

In collectProofNodes (lines 200-201), the function unconditionally appends the full RLP encoding of EVERY visited node along the path, then recurses into extension/branch children (lines 206-228) which append those children too. Meanwhile nodeReferenceData (line 242: `if (encoded.len < 32) return full;`) inlines any child whose RLP encoding is < 32 bytes directly into its parent's serialization (used at fullNodeData lines 260 and 266). So a sub-32-byte child is BOTH embedded inline inside its parent's RLP AND emitted as a separate standalone proof entry. This deviates from the canonical Ethereum MPT / EIP-1186 convention where only hash-referenced nodes appear as standalone proof array elements; inline children are not.

This is triggerable in practice, including with the existing test data (lines 437-446): 3 single-byte values keyed by keccak hashes produce a branch whose single-entry leaf children encode to ~20 bytes (< 32), so they are inlined in the branch yet also appended standalone — yielding e.g. [branch_rlp(with leaf inlined), redundant_leaf_rlp].

Output path confirmed: secureProof.nodes flows directly into eth_getProof's accountProof/storageProof arrays via proofNodesValue (src/rpc/handlers/eth_read.zig:723, 747, 750, 774, 777-789). The cited eth_read.zig line numbers match (the report abbreviated the directory path).

Severity: low is correct. The parent serialization is correct, the root hash is valid, and standard hash-keyed verifiers (e.g. geth trie.VerifyProof) ignore the extra unreferenced entries — so verification still succeeds. Impact is limited to non-canonical, larger-than-spec proofs that differ from other clients and could break strict verifiers that reject extra/unreferenced nodes.

The suggested fix is sound: gate the standalone append on the child being hash-referenced (encoded length >= 32), mirroring nodeReferenceData's threshold. Caveat for the implementer: the root node should always be emitted even if < 32 bytes, so the guard belongs on the recursive child appends, not the initial root append.


---

## [30] LOW — ReceiptIndex.by_tx silently overwrites entries on duplicate transaction_hash, leaking the prior receipt's logs

- **Group:** zevm:tx-encoding-index  **Category:** memory-safety
- **Location:** `/Users/williamcory/zevm/src/receipt_index.zig:42-58 (putBlockReceipts), 15-27 (deinit)`

**What's wrong:** putBlockReceipts inserts every cloned receipt into by_tx with `self.by_tx.put(cloned[i].transaction_hash, cloned[i])`. AutoHashMap.put overwrites an existing value without returning/freeing the old one. The by_tx value owns its logs slice (the same pointer also referenced by the by_block array). deinit frees logs only by iterating by_tx values, and frees by_block arrays with allocator.free(receipts.*) which frees ONLY the Receipt struct array, not the logs inside. So when a transaction_hash collides (e.g. the same tx appears in two stored blocks during a re-org, or putBlockReceipts is invoked twice for overlapping content), the first receipt's logs slice is dropped from by_tx and is never freed -> memory leak. (No double free, because by_block frees only the struct arrays.)

**Evidence:**
putBlockReceipts(blockA, [receiptX]) -> by_tx[X]=receiptX(logs=LA), by_block[A]=[receiptX]. putBlockReceipts(blockB, [receiptX]) -> by_tx[X] overwritten to receiptX'(logs=LB); receiptX with LA is no longer in any map value reachable by deinit's by_tx iteration. deinit: by_tx iteration frees LB only; by_block frees arrays A and B as plain struct arrays (Receipt has no embedded ownership freed by allocator.free of the array). LA leaks. A re-org that re-seals a block containing an already-indexed tx triggers this.

**Suggested fix:** Before put, check getEntry/fetchPut: if an old value exists for that transaction_hash, call old_value.deinit(allocator) (taking care it is not aliased by a still-live by_block array) — or restructure so by_tx stores a pointer/index into a single owned store rather than an independent deep clone, eliminating the aliasing entirely.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/zevm/src/receipt_index.zig. The ownership model and leak mechanism are exactly as reported:

1. ALIASING (putBlockReceipts, lines 48-57): cloneReceipt (line 52, defined line 78) allocates a fresh `logs` slice. The cloned[i] struct (which owns that logs pointer) is copied into BOTH by_tx (line 54: `self.by_tx.put(cloned[i].transaction_hash, cloned[i])`) and into the `cloned` array that is put into by_block (line 57). Both map values therefore share the same logs pointer.

2. SILENT OVERWRITE (line 54): Zig's std.AutoHashMap.put overwrites an existing value without returning or freeing the previous value. On a transaction_hash collision, the prior receipt struct (with its logs slice) is dropped from by_tx and is only reachable via by_block.

3. ASYMMETRIC DEINIT (lines 15-27): by_tx value iteration calls receipt.deinit(allocator) (frees logs); by_block iteration calls allocator.free(receipts.*) which frees ONLY the Receipt struct array container, not the per-receipt logs slices. This asymmetry is the intended single-free design (avoids double-free given the aliasing). Consequence: an overwritten by_tx entry's logs slice is never freed by either path -> leak. No double-free, matching the report.

So the data-structure-level bug is genuine and triggerable whenever the same transaction_hash is inserted twice into one persistent ReceiptIndex (e.g., a receipts slice containing a duplicate hash, multiple receipts with a default all-zero transaction_hash, or two stored block hashes sharing a tx during a re-org/re-import). The structure has no guard against this.

Severity downgraded from medium to low: it is a bounded memory leak (one receipt's logs per collision), not corruption/UAF/double-free, and the normal node paths do not hit it — canonical tx hashes are unique, and the re-org/import paths in src/node/runtime.zig (lines 2192-2193, 2505-2517) use separate temp/replacement ReceiptIndex instances that are deinit'd independently rather than re-inserting colliding hashes into the live index (persistMinedBlock at line 2581 inserts each freshly-mined block once). It is a real latent leak requiring an unusual-but-plausible input, hence low.

Suggested fix is sound: before put, fetch any existing by_tx value and free it (taking care about by_block aliasing), or restructure so by_tx stores an index/pointer into a single owned store instead of an independent aliased deep clone.


---

## [31] LOW — Transaction replacement only compares max_fee_per_gas, ignoring priority fee and requiring no minimum price bump

- **Group:** zevm:tx-encoding-index  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/txpool.zig:88-105 (add)`

**What's wrong:** add() replaces an existing same-(sender,nonce) transaction whenever the new tx.max_fee_per_gas is strictly greater than the stored one. It (a) never considers max_priority_fee_per_gas, and (b) accepts a bump of as little as 1 wei. Standard txpools (geth/anvil) require BOTH the fee cap and the priority fee to be bumped, and require a minimum percentage bump (default +10%). This allows replacing a transaction with one that pays the miner LESS (lower priority fee) merely by nudging the fee cap up by 1 wei, and enables cheap replacement spam.

**Evidence:**
Stored EIP-1559 tx: max_fee_per_gas=100, max_priority_fee_per_gas=50. New tx with same sender/nonce: max_fee_per_gas=101, max_priority_fee_per_gas=1. add() takes the `if (tx.max_fee_per_gas <= stored.max_fee_per_gas)` branch -> 101 <= 100 is false, so it does NOT reject; it replaces. The replacement actually pays the block producer a lower tip (1 vs 50), and the bump is only 1 wei, contradicting replacement-underpriced policy.

**Suggested fix:** Require both max_fee_per_gas and max_priority_fee_per_gas (for typed txs) to exceed the stored values by at least a configurable percentage (e.g. 10%), and for blob txs also require max_fee_per_blob_gas to be bumped; otherwise return error.ReplacementUnderpriced.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/zevm/src/txpool.zig lines 88-105. The add() replacement logic is:

  if (tx.max_fee_per_gas <= self.transactions.items[index].max_fee_per_gas) return error.ReplacementUnderpriced;  (line 93)
  ... else replaces the stored tx (lines 97-99).

Both reported defects are real:
(a) Only max_fee_per_gas is compared. max_priority_fee_per_gas (field present at txpool.zig line 14 and passed in by the caller) is never consulted, nor is max_fee_per_blob_gas for blob txs.
(b) The comparison is strict `<=`, so any increase, even 1 wei, satisfies the check — there is no minimum percentage bump.

The reporter's evidence walk-through is correct: stored {maxFee=100, tip=50}, new {maxFee=101, tip=1} → 101 <= 100 is false → no rejection → tx is replaced, even though the new tx pays the block producer a lower tip. This diverges from geth/anvil which require both the fee cap and the tip to increase by at least a price-bump percentage (default 10%).

I verified there is no caller-side guard. The sole submission caller (src/rpc/handlers/tx_submission.zig lines 123-141) calls rt.pool.add() directly with the parsed values and applies no replacement-price policy beforehand; add() is the only place this is enforced. So the weak check is actually reachable from RPC tx submission.

Severity adjusted to low rather than medium: this is a local-node mempool economic/policy issue (cheap replacement spam, possible tip reduction). It is not a consensus, fund-loss, or memory-safety bug, and it does not affect block validity. It is a genuine deviation from standard txpool replacement policy worth fixing (require both fee cap and tip — and blob fee for 4844 — to exceed by a configurable percentage), but its real-world impact on a single node is limited.


---

## [32] LOW — putBlockReceipts leaks/double-references logs of already-inserted receipts when a later by_tx.put fails

- **Group:** zevm:tx-encoding-index  **Category:** error-handling
- **Location:** `/Users/williamcory/zevm/src/receipt_index.zig:48-58 (putBlockReceipts)`

**What's wrong:** Inside the clone loop, `errdefer cloned[i].deinit(allocator)` only covers the current iteration's receipt, and the outer `errdefer allocator.free(cloned)` frees only the Receipt struct array. If `self.by_tx.put` fails on iteration i (OutOfMemory), receipts cloned[0..i] have already been inserted into by_tx (their logs now owned by by_tx) AND their structs live in the `cloned` array that the outer errdefer frees as a plain array. The successfully-inserted by_tx entries remain in the map pointing at logs that are still allocated, but the partially-built block array is discarded — leaving by_tx populated with entries for a block that was never stored in by_block, an inconsistent index. On a subsequent deinit those by_tx logs are freed (no double free), but the index is left in a corrupt partial state after the failed call.

**Evidence:**
receipts=[r0,r1,r2]; cloning succeeds for all but by_tx.put fails on i=2 (allocator OOM during map growth). by_tx now contains entries for r0.tx_hash and r1.tx_hash whose logs are allocated; errdefer frees cloned[2]'s logs and frees the `cloned` struct array. by_block never receives this block. The pool now reports getByTxHash(r0.tx_hash)/getByTxHash(r1.tx_hash) as present even though putBlockReceipts returned an error and the block is absent from by_block.

**Suggested fix:** On any failure, roll back: remove the by_tx entries inserted during this call before returning the error (track inserted hashes and by_tx.remove them in the errdefer), so a failed putBlockReceipts leaves the index unchanged.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/zevm/src/receipt_index.zig:48-58. The bug as described is technically accurate.

In Zig, the `errdefer cloned[i].deinit(allocator)` on line 53 is scoped to the loop-body block, so it only fires if an error propagates during the SAME iteration. Once an iteration completes successfully (its `by_tx.put` on line 54 succeeds), that errdefer is cancelled. Therefore, for receipts=[r0,r1,r2] where `by_tx.put` succeeds for i=0,1 and fails (OOM) at i=2:
- by_tx now contains entries for r0.tx_hash and r1.tx_hash (their logs owned by by_tx).
- The i=2 errdefer frees cloned[2]'s logs; the outer `errdefer allocator.free(cloned)` (line 49) frees the struct array.
- `by_block.put` (line 57) never runs, so by_block has no entry for this block.

The result is a genuine logical inconsistency: after a failed putBlockReceipts, getByTxHash(r0)/getByTxHash(r1) return receipts while getByBlockHash(block) returns null. The reporter correctly notes this is NOT a memory leak or double-free — the r0/r1 log allocations are owned by by_tx and get freed on deinit (lines 16-20). So this is purely an error-handling/consistency defect, not a memory-safety bug.

Severity is correctly "low":
- Only triggers on allocator OOM mid-loop (rare path).
- The single real caller, persistMinedBlock at src/node/runtime.zig:2581, is already non-transactional: it calls putBlock/setCanonicalHead (lines 2572-2573) and appends owned_block_bodies BEFORE putBlockReceipts, with no rollback errdefer for those. So a failure here aborts block production and the broader runtime state is already partially inconsistent regardless of this function. There is no caught-error-and-continue path that reads the index expecting by_tx/by_block consistency.
- Notably, clone() (line 29-39) uses `errdefer cloned.deinit(allocator)`, which would correctly free everything if a putBlockReceipts call failed during clone — so the inconsistency is transient there.

The suggested fix (track inserted by_tx hashes and remove them in an errdefer so a failed putBlockReceipts leaves the index unchanged) is a valid robustness improvement. Real bug, low severity, high confidence.


---

## [33] LOW — Use-after-free of imported block body if owned_block_bodies.append fails after putBlock

- **Group:** zevm:consensus-sync  **Category:** memory-safety
- **Location:** `/Users/williamcory/zevm/src/chain_import.zig:importChainBytes (86-102)`

**What's wrong:** decodeNextBlock produces a Block whose body slices (body.transactions, body.ommers, body.withdrawals, header.extra_data) point into heap allocations owned by decoded.owned_body. In importChainBytes the block is first inserted into the blockchain via blockchain.putBlock(decoded.block) (which stores the Block struct by value without copying the underlying slice data — see blockchain BlockStore.putBlock storing `block` directly into the hash map), and only afterwards owned_block_bodies.append(allocator, decoded.owned_body) takes ownership and sets owned=true. The errdefer is `if (!owned) decoded.deinit(allocator);`. If owned_block_bodies.append fails (e.g. allocation failure growing the ArrayList), owned is still false, so decoded.deinit frees the transaction/ommer/withdrawal/extra_data buffers — but the Block already stored inside the blockchain still references those now-freed buffers, leaving dangling pointers (use-after-free) for any later read of that block.

**Evidence:**
chain_import.zig: `try blockchain.putBlock(decoded.block); try owned_block_bodies.append(allocator, decoded.owned_body); owned = true;` with `errdefer if (!owned) decoded.deinit(allocator);`. blockchain/BlockStore.zig putBlock: `try self.blocks.put(block_hash, block);` stores the Block (and its slice fields) without deep-copying. If the append between putBlock and `owned = true` returns error.OutOfMemory, deinit frees buffers still referenced by the stored block.

**Suggested fix:** Append to owned_block_bodies (transfer ownership) BEFORE calling putBlock, or set owned=true before putBlock and have the cleanup path also remove the just-inserted block from the blockchain. Simplest: reorder so the owned-body vector takes ownership first, then put the block.

**Verifier (high confidence):** Verified against actual source. In /Users/williamcory/zevm/src/chain_import.zig importChainBytes (lines 86-102), the ownership transfer is ordered after the insert:

  try blockchain.putBlock(decoded.block);                       // line 95
  try owned_block_bodies.append(allocator, decoded.owned_body); // line 96
  owned = true;                                                 // line 97

with errdefer `if (!owned) decoded.deinit(allocator);` (line 89).

decodeNextBlock builds the Block via primitives.Block.from (verified in voltaire Block.zig lines 76-82: `.header = header.*, .body = body.*`), which is a shallow copy. The body slices (transactions, ommers, withdrawals) and header.extra_data point into heap buffers owned by decoded.owned_body (see chain_import.zig lines 127-138). blockchain.putBlock -> BlockStore.putBlock stores the Block by value with `self.blocks.put(block_hash, block)` (verified in voltaire BlockStore.zig line 116) and performs NO deep copy of those slices. So after line 95 the hash map holds a Block whose slices alias owned_body's buffers.

If line 96 (ArrayList.append) fails with error.OutOfMemory while growing, `owned` is still false, so the errdefer runs decoded.deinit, freeing the transaction/ommer/withdrawal/extra_data buffers (OwnedBlockBody.deinit, lines 33-55) that the just-inserted blockchain Block still references — a genuine dangling-pointer / use-after-free for any subsequent read of that stored block. The suggested fix (append to owned_block_bodies before putBlock) is correct.

This is a real ownership/ordering bug confirmed in the actual code. I lowered severity from medium to low because the trigger conditions are narrow: it requires an allocation failure precisely on that one ArrayList append, AND a caller that, after catching the import error, continues to read the stored block rather than tearing down the blockchain. The realistic recovery path on OOM during a chain import is to abort and discard the whole blockchain, which masks the dangling reference. It is still a real latent memory-safety defect worth fixing by reordering.


---

## [34] LOW — CLI cannot override only fork block number when fork URL comes from config file

- **Group:** zevm:node-cli  **Category:** logic
- **Location:** `/Users/williamcory/zevm/src/config.zig:resolveFork (485-511)`

**What's wrong:** When options.hasForkUnit() is true (any of fork_url/fork_block_number set on CLI), resolveFork ignores the file fork entirely and requires fork_url to be present on the CLI, otherwise returns error.InvalidConfig. This means a user who has `fork.url` in their config file and only wants to override the pinned block via `--fork-block-number 123` gets a hard InvalidConfig error instead of fork_url(from file)+block_number(from CLI). CLI overrides for other fields merge with the file, but fork is all-or-nothing.

**Evidence:**
resolveFork: `if (options.hasForkUnit()) { if (options.fork_block_number != null and options.fork_url == null) return error.InvalidConfig; ... }` — the file_fork branch is only reached when hasForkUnit() is false, so `--fork-block-number N` with file-provided url is rejected.

**Suggested fix:** When only fork_block_number is supplied on the CLI, fall back to the file fork url (if any) and apply the CLI block number, only erroring when no url is available from either source.

**Verifier (high confidence):** Confirmed by reading the actual code. In /Users/williamcory/zevm/src/cli.zig:93-94, hasForkUnit() returns true if EITHER fork_url or fork_block_number is set on the CLI. In /Users/williamcory/zevm/src/config.zig resolveFork (485-511): when hasForkUnit() is true (line 490), the function enters that branch and never reaches the file_fork fallback at line 503. Line 491-493 then returns error.InvalidConfig whenever fork_block_number is set but fork_url is null on the CLI — without ever consulting file_fork.url.

Trigger trace for `--fork-block-number 123` with `fork.url` in the config file (no --fork-url on CLI): options.fork_url == null, options.fork_block_number == 123, so hasForkUnit() == true; line 491 evaluates `(123 != null) and (fork_url == null)` == true, returning error.InvalidConfig. The file_fork branch at 503 (which would have provided the URL) is unreachable. The bug is exactly as described and triggerable.

This is genuinely inconsistent with sibling resolvers in the same file: resolveLight (519-549) merges each field with `options.X orelse file_value.X`, and resolveMining (468-474) falls back to file config. Only resolveFork is all-or-nothing for the URL. No test documents this as intentional (cli_test.zig only tests parsing of the flags at lines 50-72, not the merge/resolution logic).

Severity low is correct: it's an ergonomics gap affecting only the narrow combination of a file-provided fork URL plus a CLI-only block-number override, has an obvious workaround (also pass --fork-url), and produces a clean InvalidConfig error rather than silent incorrect behavior or data corruption.


---

## [35] LOW — defineCall drops precompile revert data instead of ABI-encoding the revert reason

- **Group:** tevm:evm-precompiles-tx  **Category:** error-handling
- **Location:** `/Users/williamcory/tevm-monorepo/packages/precompiles/src/defineCall.ts:75-88`

**What's wrong:** In the error/revert path of a custom precompile call, the returnValue (which the caller will read as revert data) is only forwarded if it already happens to be a Uint8Array; otherwise it is replaced with an empty Uint8Array. But in the success path, `returnValue` is a decoded JS value that gets ABI-encoded via `encodeFunctionResult`. So a handler that returns `{ error, returnValue: <some JS value> }` to revert with data silently loses that data: callers in Solidity see an empty revert with no reason, rather than the expected ABI-encoded `Error(string)` / custom-error payload.

**Evidence:**
Lines 76-83:
```
const result: ExecResult = {
  executionGasUsed,
  returnValue: returnValue instanceof Uint8Array ? returnValue : new Uint8Array(),
  exceptionError: { ...new EvmError('revert'), ...{ message: error.message } },
}
```
Triggering scenario: a precompile handler computes a revert reason and returns `{ error: new Error('bad'), returnValue: 'bad' }`. Since 'bad' is a string (not Uint8Array), `returnValue` is overwritten with an empty array, so the EVM revert carries no data and a Solidity `try/catch` cannot recover the reason. The contrast with the success path (which encodes the value) shows the asymmetry is unintended.

**Suggested fix:** In the error branch, if `returnValue` is not already bytes, ABI-encode the revert reason (e.g. encode a standard `Error(string)` from `error.message`, or encode `returnValue` per the function's outputs) so the revert carries proper data, mirroring the success-path encoding.

**Verifier (medium confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/precompiles/src/defineCall.ts (lines 75-88) plus CallResult.ts and the EVM consumer.

The asymmetry is real. Success path (lines 89-98) ABI-encodes the handler's `returnValue` via `encodeFunctionResult` + `hexToBytes`. Error path (line 78) forwards `returnValue` only if `returnValue instanceof Uint8Array`, otherwise replaces it with `new Uint8Array()`. Per CallResult.ts (lines 21-42), `returnValue` is typed as `CallReturnValue` — the decoded JS value matching the function outputs (string/bool/bigint/tuple), never a Uint8Array for typical ABIs. So the `instanceof Uint8Array` branch is effectively dead, and any revert data a handler tries to surface via `returnValue` is silently discarded.

Triggerability confirmed by the existing test defineCall.spec.ts lines 36-57: the error handler returns `returnValue: 0n`; `0n instanceof Uint8Array` is false, so the resulting revert carries empty data. The test only asserts `exceptionError`, masking the dropped data.

EVM semantics confirm the data would otherwise matter: @ethereumjs/evm@10.1.1 evm.js preserves `result.returnValue` as revert return data even when `exceptionError` is REVERT (line ~724, `returnValue: result.returnValue ?? new Uint8Array(0)`), which is exactly how Solidity revert reasons propagate. So the mechanism to carry revert data exists but defineCall throws it away.

Caveat lowering confidence to medium: the reporter's suggested fix ("mirror the success-path encoding") is partly wrong — `encodeFunctionResult` encodes per the function's OUTPUT types, which is not the correct shape for a Solidity revert (`Error(string)` selector 0x08c379a0 + custom errors). A faithful fix would ABI-encode an Error(string) from error.message or accept raw bytes, not reuse encodeFunctionResult. But the core defect (revert data in returnValue is dropped, and the type makes Uint8Array nearly unreachable) is genuine. Severity low is appropriate: it is a rarely-exercised feature (custom precompile revert data), with no observed crash or consensus issue, and the type system steers most users away from relying on it.


---

## [36] LOW — valuesArrayToHeaderData error message states wrong max field count

- **Group:** tevm:trie-rlp-block-receipt  **Category:** error-handling
- **Location:** `/Users/williamcory/tevm-monorepo/packages/block/src/helpers.ts:62-64`

**What's wrong:** The guard `if (values.length > 21) throw ... 'Max: 20, got: N'` is internally inconsistent: it permits up to 21 values (which is correct — a full EIP-7685 header has 21 fields: 15 base + baseFeePerGas, withdrawalsRoot, blobGasUsed, excessBlobGas, parentBeaconBlockRoot, requestsRoot) but the thrown message claims the maximum is 20. This is a cosmetic/diagnostic defect (the boundary itself is correct), but it will mislead anyone debugging an over-length header and could mask the off-by-one if someone later 'fixes' the threshold to match the message.

**Evidence:**
Destructuring at lines 38-60 lists exactly 21 named positions (parentHash ... requestsRoot). The valid maximum length is therefore 21, and the check `> 21` is correct, but the message string says `Max: 20`.

**Suggested fix:** Change the message to `Max: 21, got: ${values.length}` (or define a constant for the field count and use it in both the check and the message).

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/block/src/helpers.ts lines 37-92. The destructuring at lines 38-60 lists exactly 21 named positions (15 base fields parentHash..nonce, plus baseFeePerGas, withdrawalsRoot, blobGasUsed, excessBlobGas, parentBeaconBlockRoot, requestsRoot). The guard at line 62 is `if (values.length > 21)`, which correctly permits up to 21 values. However the thrown message at line 63 says `Max: 20, got: ${values.length}`. This is internally inconsistent: a 22-element array throws with a message claiming the max is 20, when the actual enforced max is 21. The boundary logic itself is correct (so no functional/consensus bug — a valid 21-field EIP-7685 header still parses), making this purely a diagnostic/cosmetic defect that could mislead a debugger or invite a wrong 'fix' to the threshold. Severity low is accurate. Suggested fix (change message to `Max: 21`) is correct.


---

## [37] LOW — eth_feeHistory reward percentiles computed by transaction count instead of cumulative-gas weighting (non-spec, wrong values)

- **Group:** tevm:actions-eth  **Category:** consensus
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/eth/ethFeeHistoryHandler.js:151-160`

**What's wrong:** For the local (non-forked) path, reward percentiles are computed as a count-based percentile over the sorted list of per-transaction effective priority fees: index = floor((percentile/100) * txCount). The EIP-1559 / eth_feeHistory specification defines reward percentiles as gas-weighted: transactions are sorted by effective priority fee and the percentile is taken at the point where the cumulative gasUsed of the block crosses percentile% of the block's total gas. A block with one large-gas low-tip tx and many tiny-gas high-tip txs will report very different rewards under the two methods, so clients/wallets relying on eth_feeHistory for local devnets get incorrect priority-fee suggestions.

**Evidence:**
ethFeeHistoryHandler.js:155-159:
  const index = Math.floor((percentile / 100) * effectivePriorityFees.length)
  return effectivePriorityFees[Math.min(index, effectivePriorityFees.length - 1)] ?? 0n
This ignores per-tx gasUsed entirely. Spec requires cumulative-gas-weighted percentile (geth/erigon implementation). Triggering scenario: block with tx A (gas 21000, tip 1 gwei) and tx B (gas 5,000,000, tip 100 gwei); 50th percentile by count returns ~1 gwei, by gas weight returns ~100 gwei.

**Suggested fix:** Sort (priorityFee, gasUsed) pairs by priorityFee, accumulate gasUsed, and for each percentile pick the priority fee of the first tx whose cumulative gas >= (percentile/100)*block.gasUsed.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/actions/src/eth/ethFeeHistoryHandler.js. The local (non-forked) reward-percentile computation is genuinely count-based, not gas-weighted, contrary to the eth_feeHistory / EIP-1559 spec (geth/erigon reference behavior).

Concrete evidence:
- Lines 138-149 build `effectivePriorityFees` as a flat array of per-tx effective tips and never capture each transaction's gasUsed.
- Line 152 sorts only the fee values, so any tip<->gas association is lost.
- Lines 155-158: `const index = Math.floor((percentile / 100) * effectivePriorityFees.length); return effectivePriorityFees[Math.min(index, effectivePriorityFees.length - 1)] ?? 0n` — this is a count-based percentile over tx count.

The spec requires sorting (tip, gasUsed) by tip, accumulating gasUsed, and selecting the tip of the first tx whose cumulative gas crosses percentile% of block.gasUsed. The report's triggering scenario (one large-gas low-tip tx + many small-gas high-tip txs) does produce materially different results, so the bug is real and triggerable.

Mitigations affecting severity: (1) only the local devnet path is affected — the forked path (lines 37-71) forwards to the real RPC and is correct; (2) eth_feeHistory is an informational RPC used for fee/tip suggestions and does NOT affect consensus, block validity, or EVM state transition, so the "consensus" category is a misnomer — this is RPC-correctness; (3) devnet blocks are commonly single-tx/uniform-gas, so divergence is usually small in practice. Given it is devnet-only and non-consensus, I correct severity down to low while confirming the underlying deviation is real.


---

## [38] LOW — eth_feeHistory with blockCount=0 returns oldestBlock past the newest block

- **Group:** tevm:actions-eth  **Category:** off-by-one
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/eth/ethFeeHistoryHandler.js:101-105`

**What's wrong:** When blockCount is 0, blockCountNum-1 = -1, so oldestBlock = newestBlockNumber - (-1) = newestBlockNumber + 1, and actualBlockCount = Number(newestBlockNumber - oldestBlock) + 1 = 0. The loop produces empty arrays but the returned oldestBlock is newestBlockNumber+1 (a block beyond the requested range / possibly beyond chain head). Per the eth_feeHistory spec blockCount must be >=1; tevm neither rejects 0 nor returns a sane oldestBlock.

**Evidence:**
ethFeeHistoryHandler.js:101-103: blockCountNum=0 → BigInt(blockCountNum-1) = -1n; newestBlockNumber >= -1n is true → oldestBlock = newestBlockNumber - (-1n) = newestBlockNumber + 1n. Line 105 actualBlockCount = 0, loop skipped, result.oldestBlock = newestBlockNumber+1. The procedure also accepts a 0x0 hex blockCount without validation (ethFeeHistoryProcedure.js:15 hexToBigInt).

**Suggested fix:** Validate blockCount >= 1n and throw an InvalidParams (-32602) error when blockCount is 0, matching the JSON-RPC spec.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/actions/src/eth/ethFeeHistoryHandler.js lines 100-105 and 195-204, plus ethFeeHistoryProcedure.js.

The math is exactly as reported. With blockCount=0 on the local (non-forked) devnet path:
- Line 101: blockCountNum = Number(0n) = 0
- Line 103: BigInt(blockCountNum - 1) = -1n; the condition `newestBlockNumber >= -1n` is always true, so oldestBlock = newestBlockNumber - (-1n) = newestBlockNumber + 1n
- Line 105: actualBlockCount = Number(newestBlockNumber - (newestBlockNumber + 1n)) + 1 = -1 + 1 = 0, so the loop (line 115) is skipped.
- Lines 195-204: result.oldestBlock is returned as newestBlockNumber + 1n with empty baseFeePerGas and gasUsedRatio arrays.

Additionally, line 175's guard `if (baseFeePerGas.length > 0 ...)` means the next-block base fee prediction is also skipped, so baseFeePerGas is empty — violating the eth_feeHistory spec requirement that baseFeePerGas has blockCount+1 entries and that oldestBlock be a real block <= newest. Neither the handler nor the procedure validates blockCount >= 1; ethFeeHistoryProcedure.js:15 parses 0x0 via hexToBigInt to 0n with no rejection.

This is a genuine, triggerable off-by-one / missing-validation bug on the local devnet code path (the forked path at lines 37-70 forwards upstream, where the provider would likely reject 0). It produces malformed-but-harmless output rather than a crash or state corruption, and requires an out-of-spec input that real clients would not send, so the claimed 'low' severity is correct.


---

## [39] LOW — Leftover console.log in handleStateOverrides leaks state-override data to stdout

- **Group:** tevm:actions-call  **Category:** logging
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/Call/handleStateOverrides.js:18`

**What's wrong:** A raw `console.log('setting state', address, state)` debug statement was left in production code. Every call that includes a `stateOverrideSet` will unconditionally print the override address and the full state object (which may include balances, nonces, arbitrary storage, and code) to stdout, bypassing the client's logger/log-level configuration. This is inconsistent with the rest of the package which uses `client.logger.debug`, and it produces noisy/uncontrollable output and potential information disclosure in server contexts.

**Evidence:**
handleStateOverrides.js:
```js
for (const [address, state] of Object.entries(stateOverrideSet)) {
  console.log('setting state', address, state)   // leftover debug log
  const res = await setAccountHandler(client)({ ... })
```
Triggering scenario: any `tevmCall`/`tevmContract` with `stateOverrideSet: { '0x...': { balance, code, state } }` will print the override to stdout on every invocation regardless of log level.

**Suggested fix:** Remove the console.log or replace it with `client.logger.debug({ address, state }, 'handleStateOverrides: applying state override')`.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/actions/src/Call/handleStateOverrides.js. Line 18 is exactly `console.log('setting state', address, state)`, inside the `for (const [address, state] of Object.entries(stateOverrideSet))` loop. It is unconditional and not guarded by any debug flag or log level. The function receives a `client` (TevmNode) which exposes a logger used elsewhere in the package, yet here a raw console.log is used instead, bypassing log-level config. Any tevmCall/tevmContract invocation that passes a stateOverrideSet will print the override address and full state object (which can contain balance, nonce, code, and arbitrary storage) to stdout on every entry. This is genuinely triggerable and inconsistent with the package's client.logger.debug convention. Severity low is appropriate: it is noise/minor information disclosure to local stdout, not a security/correctness defect. The suggested fix (remove the line or replace with client.logger.debug) is valid.


---

## [40] LOW — blockOverrideSet pulls header fields from canonical head instead of the requested block

- **Group:** tevm:actions-call  **Category:** blockOverride
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/Call/callHandlerOpts.js:61-93`

**What's wrong:** When a `blockOverrideSet` is supplied together with a non-latest `blockTag`, the override logic builds the header from `getCanonicalHeadBlock()` (the latest head) for every non-overridden field (number, difficulty, prevRandao, gasLimit, timestamp, baseFeePerGas, blob gas price), while only copying `stateRoot` from the actually-resolved `block`. So a call against `blockTag: 5n` with a blockOverrideSet that only overrides e.g. `time` will execute with block 5's state but the HEAD block's number/difficulty/prevRandao/baseFee, producing inconsistent and surprising results (e.g. NUMBER/PREVRANDAO/BASEFEE opcodes return head values, not block 5). The code itself flags this as a known limitation, but it can silently produce wrong execution context.

**Evidence:**
callHandlerOpts.js:
```js
if (params.blockOverrideSet) {
  const { header } = await vm.blockchain.getCanonicalHeadBlock()   // always HEAD, ignores resolved `block`
  opts.block = { ...opts.block, header: {
    ...{ stateRoot: block.header.stateRoot },  // stateRoot from requested block
    number: params.blockOverrideSet.number !== undefined ? ... : header.number,  // HEAD number
    difficulty: header.difficulty,             // HEAD difficulty
    prevRandao: header.prevRandao,             // HEAD prevRandao
    ... } }
}
```
Triggering scenario: `tevmCall({ to, data, blockTag: 5n, blockOverrideSet: { time: 123n } })` against a chain whose head is block 100 — the EVM sees number=100, baseFee/prevRandao from block 100, not block 5.

**Suggested fix:** Base the overridden header on the already-resolved `block.header` (spread `block.header` and apply overrides) rather than re-fetching `getCanonicalHeadBlock()`, so non-overridden fields reflect the requested block.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/actions/src/Call/callHandlerOpts.js lines 61-93. The resolved block is correctly computed at lines 26-58 (e.g. via vm.blockchain.getBlock(params.blockTag) for a bigint tag). But inside the blockOverrideSet branch, line 65 fetches `const { header } = await vm.blockchain.getCanonicalHeadBlock()` — always HEAD, independent of the resolved `block`. The constructed header then takes ONLY `stateRoot` from the requested block (line 70), while every other non-overridden field falls back to the HEAD `header`: coinbase (74), number (75), difficulty (76), prevRandao (77), gasLimit (79), timestamp (80), baseFeePerGas (84), and getBlobGasPrice (89). So a call with `blockTag: 5n` + `blockOverrideSet: { time: 123n }` executes with block 5's stateRoot but HEAD's number/difficulty/prevRandao/baseFee, making the NUMBER/PREVRANDAO/BASEFEE/COINBASE opcodes return head values rather than block 5's — a genuine, triggerable inconsistency. blockOverrideSet is a real public param (CallParams/CallJsonRpcRequest, exercised in callHandlerOpts.spec.ts and executeCall.spec.ts) and is not gated against being combined with a non-latest blockTag (only createTransaction is disallowed, per zCallParams). The Ethereum-semantics claim is accurate: block-context opcodes read the header. The code itself flags this with a TODO comment at lines 63-64 calling it a known bug. Severity confirmed as low: with the default blockTag=latest, the canonical head equals the resolved block so there is no discrepancy in the common path; the issue only surfaces when overrides are combined with a non-latest tag, and it is a correctness/surprise issue, not a consensus or security failure. The suggested fix (base the header on the already-resolved block.header and apply overrides on top) is correct.


---

## [41] LOW — Default struct-log tracer reports 0-based call depth (geth uses 1-based)

- **Group:** tevm:actions-anvil-debug  **Category:** trace-fidelity
- **Location:** `/Users/williamcory/tevm-monorepo/packages/actions/src/internal/runCallWithTrace.js:38 (depth: step.depth)`

**What's wrong:** The default struct-log tracer emits `depth: step.depth`, which is 0-based for the top-level frame (snapshot shows depth 0 for top-level opcodes). geth's structLogs are 1-based (top-level call = depth 1), and tevm's own muxTracer struct-log path uses `step.depth + 1`. Consumers relying on geth-compatible depth numbering (and call/return nesting detection) will be off by one and inconsistent between the two tracer code paths.

**Evidence:**
runCallWithTrace.js line 38: `depth: step.depth,` with snapshot __snapshots__/runCallWithTrace.spec.ts.snap showing `"depth": 0` for top-level PUSH opcodes. runCallWithMuxTrace.js line 346 uses `depth: step.depth + 1`. The two disagree; only one can match geth (1-based).

**Suggested fix:** Decide on geth-compatible 1-based depth and apply it uniformly (`step.depth + 1`) across runCallWithTrace.js and runCallWithMuxTrace.js, then update snapshots, or document the 0-based convention explicitly if intentional.

**Verifier (high confidence):** Confirmed by reading the actual code. In /Users/williamcory/tevm-monorepo/packages/actions/src/internal/runCallWithTrace.js line 38 the default struct-log tracer pushes `depth: step.depth` (0-based for the top-level frame). The snapshot at packages/actions/src/internal/__snapshots__/runCallWithTrace.spec.ts.snap confirms `"depth": 0` for top-level opcodes (every entry shown is depth 0). In contrast, the muxTracer's default struct-log path in /Users/williamcory/tevm-monorepo/packages/actions/src/internal/runCallWithMuxTrace.js line 346 pushes `depth: step.depth + 1` (1-based). The two paths genuinely produce different depth numbering for identical execution.

The divergence is triggerable through the public debug API: traceCallHandler.js routes the default (no/null tracer) case to runCallWithTrace (lines 86-88) — i.e. the geth-style struct-log tracer used by debug_traceCall/debug_traceTransaction — while routing tracer:'muxTracer' to runCallWithMuxTrace. So a consumer calling the default struct-log tracer gets 0-based depth, but the same struct logs requested via muxTracer get 1-based depth.

Geth's structLogs use 1-based depth (top-level call = depth 1), so the muxTracer path matches geth and the default runCallWithTrace path is off by one. This is a real fidelity/consistency bug. Severity is correctly low: it does not affect EVM execution correctness, only the reported depth field's geth-compatibility and internal consistency between the two tracer code paths. Suggested fix (use step.depth + 1 uniformly and regenerate snapshots) is sound.


---

## [42] LOW — Prefunded genesis accounts get 1000 ETH, not the documented/anvil-standard 10000 ETH

- **Group:** tevm:node-client  **Category:** logic
- **Location:** `/Users/williamcory/tevm-monorepo/packages/node/src/GENESIS_STATE.js:4-6, 23`

**What's wrong:** The module comment states the prefunded accounts match hardhat/anvil which start with 10000 ETH, but INITIAL_BALANCE = parseEther('1000') (1000 ETH). This breaks parity with anvil/hardhat default balances that users and tooling may rely on, and contradicts the file's own documentation.

**Evidence:**
Line 4-6 comment: 'These are the same accounts hardhat and anvil start with 10000 eth'. Line 23: `const INITIAL_BALANCE = parseEther('1000')`. parseEther('1000') = 1000 ETH, while anvil/hardhat default is 10000 ETH. Triggering scenario: createMemoryClient(); getBalance for 0xf39Fd6... returns 1000 ETH instead of the expected 10000 ETH that anvil-compatible code assumes.

**Suggested fix:** Either change INITIAL_BALANCE to parseEther('10000') to match anvil/hardhat (and the comment), or fix the comment to state 1000 ETH if 1000 is intentional.

**Verifier (high confidence):** Confirmed by reading /Users/williamcory/tevm-monorepo/packages/node/src/GENESIS_STATE.js. Line 4 comment states: "These are the same accounts hardhat and anvil start with 10000 eth", but line 23 sets `const INITIAL_BALANCE = parseEther('1000')` (1000 ETH). Lines 36-47 build GENESIS_STATE assigning this INITIAL_BALANCE to every account, and createTevmNode.js line 490 spreads `...GENESIS_STATE` into the node's initial state, so the 1000 ETH balance is the actual runtime value for the standard accounts (0xf39Fd6e5..., 0x70997970..., etc., which are indeed the canonical anvil/hardhat accounts). Anvil's documented default balance is 10000 ETH per account, so the code contradicts both its own comment and anvil/hardhat parity. This is a genuine, triggerable discrepancy: getBalance on 0xf39Fd6... returns 1000 ETH, not 10000. The existing test (GENESIS_STATE.spec.ts line 10) only asserts balance > 0n, so it does not catch this. Severity correctly assessed as low: it is a real internal documentation/value mismatch and a parity break, but tevm is not a guaranteed drop-in for anvil and the value is non-zero/functional. One off-scope note: Object.fromEntries on lines 36-47 silently ignores the trailing multicall3Contract element since fromEntries only reads [0] and [1] of each entry array — separate from the reported bug.
