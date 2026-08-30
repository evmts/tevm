# PR-history-derived factory rules

This is the evidence record for TEVM-specific automation. It was generated on
2026-08-29 from the 100 most recent pull requests authored by `roninjin10`
(Will Cory) in `evmts/tevm`, plus inline review findings on the representative
PRs linked below. It is a design input, not a live GitHub dependency.

## Shape of the sample

- 57 merged, 34 closed without merge, and 9 open PRs.
- Median changed files: 6 for merged PRs and 15 for closed/unmerged PRs.
- Seven closed/unmerged PRs changed more than 50 files. The largest attempts
  mixed 902-2,346 files; large merged changes were generally deletions or
  enumerably mechanical sweeps.
- The repository-wide 85-manifest URL correction in
  [#2091](https://github.com/evmts/tevm/pull/2091) is the useful counterexample:
  broad scope is safe when one deterministic rule explains every edit.

These numbers motivate semantic scope review, not a hard file-count limit.

## Repeated patterns and encoded response

| Pattern | PR evidence | Factory response |
| --- | --- | --- |
| JSON-RPC values are correct internally but wrong at the wire boundary | [#1894](https://github.com/evmts/tevm/pull/1894) returned a `Promise`; [#1971](https://github.com/evmts/tevm/pull/1971) exposed `bigint`; [#1969](https://github.com/evmts/tevm/pull/1969) repaired missing/null/legacy receipt fields; [#2049](https://github.com/evmts/tevm/pull/2049) and [#2081](https://github.com/evmts/tevm/pull/2081) show the same storage-padding area needed a second, fuller fix. | `//:rpcContractLint` checks serializability, canonical hex/null/error shapes, surface unions/dispatch, and wire assertions. `//workflows/repair-rpc-regression:repairRpcRegression` creates a reproduction-first repair. |
| Coverage can miss the exact negative or stateful branch | Reviews on [#2079](https://github.com/evmts/tevm/pull/2079) requested the public `-32000` error-code assertion; [#2076](https://github.com/evmts/tevm/pull/2076) found a manual-mining bypass and required `from`; [#2090](https://github.com/evmts/tevm/pull/2090) found mutable shared `Common` state and an incomplete Proxy invariant; [#2094](https://github.com/evmts/tevm/pull/2094) added dual empty-account encodings. | `//:regressionProofLint` asks whether the test fails for the reported reason at the public boundary, covers equivalent encodings and negative branches, and isolates mutable state. |
| One public feature fans out through several silent surfaces | [#2076](https://github.com/evmts/tevm/pull/2076) touched request/response/params/result/procedure/handler/matrix unions; [#2084](https://github.com/evmts/tevm/pull/2084) carried WebSocket support through server barrels and `tevm`; review on [#2076](https://github.com/evmts/tevm/pull/2076) caught wildcard rather than named exports. | Existing barrel/docs lints remain, `addJsonrpcMethod` now carries an explicit contract matrix, and `//workflows/sync-public-surface:syncPublicSurface` repairs an already-defined symbol's recursive exports, facade, generated docs, and changeset. |
| Generated/provenance inputs drift and create failures far from the edit | [#2083](https://github.com/evmts/tevm/pull/2083) pinned Zevm and repaired the frozen lockfile; [#2091](https://github.com/evmts/tevm/pull/2091) fixed npm provenance across 85 manifests; [#2088](https://github.com/evmts/tevm/pull/2088) repaired Changesets workspace policy; [#1971](https://github.com/evmts/tevm/pull/1971) accumulated unresolved markers in generated docs; [#1822](https://github.com/evmts/tevm/pull/1822) removed an accidental gitlink. | `//factory:repositoryMetadataLint` and `repositoryMetadataWrite` own canonical repository identity in manifests and release workflows. `//factory:sourceIntegrity` rejects unresolved conflicts and orphaned gitlinks. Existing preflight pins local Flows/Zevm revisions and lockfile provenance. |
| Broad agent changes need backpressure based on intent | [#1994](https://github.com/evmts/tevm/pull/1994) was explicitly closed as "currently ai slop"; several dependency/native migrations exceeded 900 files and closed unmerged, while focused parity fixes such as [#2081](https://github.com/evmts/tevm/pull/2081) and [#2082](https://github.com/evmts/tevm/pull/2082) merged. | `//:scopeCoherenceLint` is a check-only semantic review. It permits generated/mechanical fan-out but blocks unrelated subsystems, copied trees, duplicate implementations, and dependency churn mixed with product work. Candidate lanes retain narrow write sets and bounded rounds. |
| Documentation examples are executable API | Reviews on [#2087](https://github.com/evmts/tevm/pull/2087) repeatedly found missing imports, invalid types, un-awaited Effects, incorrect error/null handling, and timing-dependent examples. | The existing `//:jsdocLint` remains a first-class gate and the public-surface codegen lane regenerates reference docs from corrected source rather than hand-editing generated pages. |

## Review policy

The evidence above does not make bot review comments automatically correct.
Every agent prompt says to verify a finding against current code, keep fixes
diff-scoped, and report uncertainty when the governing protocol specification is
not locally available. Mechanical invariants stay deterministic; models are
reserved for contract completeness, regression quality, and semantic scope.
