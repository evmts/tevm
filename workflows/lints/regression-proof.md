# Regression-proof lint

Scope: the diff only. Judge whether a bug-fix or conformance test proves the
reported behavior rather than merely increasing coverage.

For each changed production branch accompanied by a new or changed test,
require a focused regression proof:

1. The assertion observes the nearest public boundary named by the bug (wire
   JSON-RPC response, memory client, server transport, state manager, or node),
   using real TEVM objects and fixtures.
2. The test would fail on the pre-fix implementation for the same reason as the
   report. A snapshot refresh, a broad "does not throw", or an assertion on an
   implementation helper is not enough.
3. The exact edge case is represented: null/error responses, empty and
   non-empty state, short and full-width hex, legacy and current transaction
   forms, absent transport/provider, or the relevant configuration transition.
4. Negative behavior includes the stable public error class/code/shape, not
   only a message fragment. Stateful behavior proves both the before and after
   state and does not share a mutable `Common`, client, node, timer, or cache
   between cases unless isolation is itself proven.
5. A parity claim names the reference and retains a deterministic fixture or
   local case. A replaced `it.todo` is removed rather than leaving two sources
   of truth.

Also report a test that encodes the old bug as the new expected value or covers
only one representation when the production branch accepts multiple equivalent
encodings.

Do not demand redundant unit tests when an existing integration test in the
diff already proves the branch at a stronger boundary. Mock policy is handled
by the separate no-mocks lint; focus here on semantic adequacy.

In fix mode, edit only focused test and fixture files. Add the missing case
without weakening existing assertions or changing production code. If the
implementation cannot satisfy the correct test, leave a finding for the author.
