# JSDoc lint

Scope: the diff only.

For each exported symbol added or changed in the diff under
packages/*/src or bundler-packages/*/src:

- It must carry a JSDoc comment that typedoc can render: a one-line
  summary, `@param` for each parameter, `@returns` when the return value
  is not obvious from the summary, and `@example` for new public entry
  points.
- The comment must describe behavior, not restate the signature.
- Type re-exports and internal helpers that are not part of a package's
  public entrypoint are exempt.

Report each missing or inadequate comment with file, line, and symbol. In
fix mode, write the comment from the implementation; do not change code.
