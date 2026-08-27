# Changeset lint

Scope: the diff only.

A diff that changes published source (`packages/*/src`, `bundler-packages/*/src`,
`extensions/*/src`, `lsp/*/src`, `cli/src`, `tevm/**/*.ts`, excluding
`*.spec.ts` and `*.test.ts`) must carry a changeset entry in `.changeset/*.md`
that names every affected package.

Packages listed under `ignore` in `.changeset/config.json` (examples, docs
sites, integration test packages, `@tevm/bench`, `@tevm/scripts`, `@evmts/*`)
need no changeset.

Judge three things:

1. Presence. If published behavior changes and no changeset exists in the
   diff, report it.
2. Coverage. Every published package the diff touches must appear in the
   changeset frontmatter. `@tevm/*`, `tevm`, and `tevm-run` are `linked`, so
   one entry naming the touched packages is enough.
3. Level. Read the declared level and compare it against the change: bug
   fixes and internal refactors are `patch`; new exported symbols, new
   JSON-RPC methods, and new options are `minor`; removed or renamed exports,
   changed defaults, and changed error shapes are `major`. Report a level
   that understates the change. The repo is in `next` prerelease mode, so
   `major` is still the right label for a breaking change.

Doc-only, test-only, and chore diffs need no changeset; do not report those.

In fix mode, write or correct the changeset entry: one sentence, present
tense, user-facing wording. Do not touch source files.
