# Barrel-exports lint

Scope: the diff only.

Repository rule (CLAUDE.md, adding to the public API): a new public symbol is
exported explicitly through every barrel file up the package tree, and then
through the `tevm` meta package. Wildcard re-exports are not used, so an
omission is silent: the symbol type-checks inside the package and is
unreachable from `tevm`.

For each `export` added to a file under `packages/*/src/**`,
`bundler-packages/*/src/**`, or `extensions/*/src/**` in the diff:

1. Follow the chain of `index.js` / `index.ts` files from that file's
   directory to the package's `src/index.*`. Each level must re-export the
   symbol by name. Report the first level that does not.
2. If the package is one of the entry points `tevm/<name>/index.ts`
   re-exports (`tevm/actions`, `tevm/memory-client`, `tevm/state`, and the
   rest of the `tevm/*` directories), check that `tevm/<name>/index.ts`
   exposes it and that `tevm/jsr.json` still maps the entry point.
3. Symbols whose name starts with an underscore, symbols documented as
   internal in their JSDoc, and test helpers are exempt.

Removed exports are a separate concern: report a removed public symbol that
has no `major` changeset (see changeset.md) as a breaking change.

In fix mode, add the missing named re-exports in each barrel, keeping each
barrel's existing ordering convention, and nothing else.
