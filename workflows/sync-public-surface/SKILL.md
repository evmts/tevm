# Synchronize a public symbol

Input: an owning package directory and an already-defined exported symbol,
optionally the intended contributor-facing guide.

The implementation and public JSDoc are source inputs, not a license to redesign
the API. If the symbol does not exist, is internal, has incomplete/incorrect
JSDoc, or would require implementation changes, stop and report that the owning
change must be fixed first.

1. Find the defining file and determine the symbol's exact value/type export.
   Confirm it is intended to be public from its JSDoc and neighboring exports.
2. Follow the directory tree outward. Add a named export at every existing
   `index.js`/`index.ts` level through the owning package root. Never use
   `export *` and never expose sibling internal helpers.
3. Find the corresponding `tevm/<entry>/index.ts` facade and add the same named
   export. Confirm `tevm/jsr.json` already maps the entry point; this lane does
   not create a new package entry point.
4. Update the written guide only when the symbol is contributor-facing. Reuse
   the source JSDoc's executable example, with complete imports and no `...`.
5. Regenerate TypeDoc/reference output using the repository command. Do not hand
   repair line numbers or merge markers in generated Markdown. Include only the
   output attributable to this symbol and reject unrelated generator churn.
6. Add a minor changeset for a newly reachable symbol or a patch changeset when
   repairing an export/docs omission for behavior already intended to be public.
7. Run type generation, docs generation, packed-package validation, and the
   changeset gate. If a generated output differs nondeterministically between two
   runs, stop instead of committing it.

Keep the candidate limited to barrels, the existing `tevm` facade, docs, and the
changeset. Do not alter the symbol implementation or create compatibility aliases.
