# No-mocks lint

Scope: the diff only, restricted to `*.spec.ts` and `*.test.ts` files.

Repository rule (CLAUDE.md, testing conventions): tests never mock what they
can exercise for real. Real state managers, real memory clients, real
compiled contracts from `@tevm/test-utils`, and real RPC responses replayed
from `__rpc_snapshots__` are the expected inputs. The one exemption is the
bundler packages under `bundler-packages/*`, where the file system and
bundler host are hard to drive without doubles, and even there a fixture
under `src/fixtures` is preferred over a mock.

Report each added or changed test that:

- Calls `vi.mock`, `vi.fn`, `vi.spyOn`, `mock.module`, or `jest.*` on a
  module or object that a real instance could replace (a tevm client, a
  state manager, a viem transport, the EVM).
- Hand-writes an RPC response instead of recording it with the snapshot
  transport.
- Asserts on a mock being called instead of on an observable result.

Do not report:

- Doubles for the process boundary: `process.exit`, timers, `console`,
  network failure injection, the file system in `bundler-packages/*`.
- Fixtures under `src/fixtures/**`.

For each finding give file, line, and the real object that should replace
the mock. In fix mode, rewrite the test against the real object when the
replacement is mechanical (a `createMemoryClient()` or `createTevmNode()`
in place of a mocked client); otherwise leave the test and report.
