# Triage a conformance failure

Input: a failing test id from the ethereum/tests or execution-spec-tests
suites, for example gst-frontier-upstream-state-root.

A conformance run reported this test failing. Find the divergence and land
a fix or a precise repro.

1. Isolate the test with the runner's --isolate flag and capture an
   EIP-3155 trace (--trace-out).
2. Compare against the reference trace (--trace-compare,
   --trace-reference). The first divergent step names the opcode or state
   transition at fault.
3. Locate the implementation in packages/evm, packages/vm, or
   packages/state and identify the deviation from the yellow paper or the
   relevant EIP.
4. If the fix is contained, apply it and add a focused unit test in the
   owning package. Otherwise commit the isolate artifacts and a failing
   unit test that reproduces the divergence without the full suite, marked
   as skipped, with a comment naming the suspected opcode or transition.

Keep the diff minimal. Do not touch unrelated hardforks.
