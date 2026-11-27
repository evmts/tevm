# Rules

Uphill writes these rules from each metric's `description`. Write code that meets them. `uphill` scores each metric against its target, and `uphill --compare HEAD --compact` lists what a change made worse.

## Footprint

Keep every @tevm/* package lean, modular, and minimal in runtime dependencies.

- Keep each @tevm/* package's source footprint lean; split heavy adapters and avoid bundling dead code. At most 12 kB.
- Keep every production source module under 250 lines with one exported concept per file (AGENTS.md). At most 250.
- Keep direct runtime dependencies minimal (<= 3 per core package); avoid pulling heavy libraries into core packages. At most 3.

## Quality

Enforce strict typing, JSDoc discipline, zero stray console calls, and TigerStyle function limits across packages.

- Never use `: any` or `as any` in production source; use explicit types or `unknown` with narrowing.
- Eliminate `@ts-ignore`, `@ts-expect-error`, and `@ts-nocheck` directives from production source.
- Never leave `console.log` or `console.debug` in library packages under `packages/`; route diagnostics through the logger.
- Resolve or convert `TODO`/`FIXME`/`HACK` comments into tracked issues or explained workarounds with removal conditions (AGENTS.md).
- Keep functions at or under 70 lines (TigerStyle); decompose long handlers and parsers into focused helpers.
- Document every exported runtime symbol in `packages/*/src/` with complete JSDoc (AGENTS.md).

## Architecture & Testing

Maintain high test depth per package, synchronized `tevm` facade exports, and valid documentation links.

- Maintain at least an 80% test-to-source line ratio in every workspace package, especially `@tevm/cli` and `@tevm/errors`. At least 80.
- Keep every subpath in `tevm/package.json` synchronized with its facade directory and barrel exports (AGENTS.md).
- Keep all relative Markdown links in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, and `CLAUDE.md` valid.

## Factory & Trust

Enforce Smithers Cloud trust boundaries, shared object store isolation, QuickJS Realm workflows, personalized home UI, Obsidian wiki, mythical history, and playground CSP integrity.

- Split read and write secrets on build.smithers.sh and prevent untrusted PRs from accessing write or publish tokens.
- Keep every .smithers/workflows/*.ts workflow valid under Smithers Cloud's QuickJS Realm planner and aligned with factory.json triggers.
- Keep .smithers/home.json valid under @smthrs/views with tailored maintainer, contributor, and viewer sections.
- Keep .smithers/coding-project.json, Obsidian [[wikilinks]], and .smithers/history/MYTHICAL.md synchronized and link-checked.
- Keep .smithers/playground/index.html CSP SHA-256 hashes synchronized with inline script and style blocks.
