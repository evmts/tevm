# TEVM contributor portal

This static Vite app presents the repository's governed contribution paths with
`@smthrs/ui` components. It opens explicit GitHub issue, fork, discussion, and
security-advisory links; it never accepts credentials or performs GitHub writes.

```bash
pnpm factory:contributor-data-write
pnpm factory:ui
pnpm factory:ui-check
```

Policy, issue-form, and runnable-target facts are generated into
`src/generated/factory-data.json`. Edit their authoritative repository sources,
then regenerate instead of hand-editing that file.

The app keeps TypeScript `strict` enabled. `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess` stay off because `@smthrs/ui@0.33.0` publishes its
TypeScript source and is not internally clean under those consumer-side flags;
remove the exception when that published component version supports them.
