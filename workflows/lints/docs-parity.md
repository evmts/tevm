# Docs-parity lint

Scope: the diff only.

The public surface has two documentation homes: the reference docs typedoc
generates from JSDoc (`generate:docs`, covered by jsdoc.md) and the written
guides under `docs/node/pages` and `sites/core/pages`. This lint covers the
guides.

Report an added or changed public entry point that has no guide coverage:

- A new JSON-RPC handler in `packages/actions/src` (`eth_*`, `anvil_*`,
  `debug_*`, `tevm_*`) needs a row in the JSON-RPC reference page and, for
  `tevm_*` methods, a section in the tevm actions guide.
- A new action exported from `packages/actions`, `packages/memory-client`,
  or `packages/decorators` needs a page or a section under the matching
  guide, with a runnable example that imports from `tevm`.
- A new bundler plugin option in `bundler-packages/*` needs a mention in the
  bundler guide's options table.
- A new `tevm/*` entry point (a new directory under `tevm/`) needs an entry
  in the package reference index.

Changed defaults and renamed options must update the guide text that states
the old value.

Do not report internal helpers, test utilities, or changes whose only
public effect is a bug fix already described in a changeset.

For each finding give the symbol, the file that introduces it, and the
guide page that should cover it. In fix mode, add the page or section in the
style of its neighbors: short prose, one complete example with imports, no
`...` placeholders (CLAUDE.md, JSDoc conventions apply to guide examples
too).
