# Upgrade viem

Input: optionally a target viem version. Without one, use the latest
release on npm.

viem is both a dependency and a peer dependency across the workspace. An
upgrade is complete only when every range agrees and every test passes.

1. Find every manifest that lists `viem` under `dependencies`,
   `devDependencies`, or `peerDependencies` (`grep -l '"viem"' */package.json
   */*/package.json`). Bump each range to the target version. Peer ranges use
   the same caret form the manifest already uses.
2. Run `pnpm install` so `pnpm-lock.yaml` resolves the new version. Do not
   hand-edit the lockfile.
3. Read the viem changelog between the old and new versions. List every
   breaking change that touches an API this repo calls (transports, actions,
   `defineChain`, error classes, formatters).
4. Run the tree-wide typecheck. Fix compile errors caused by the upgrade in
   the packages that own them; do not loosen types to make errors go away.
5. Run the tree-wide tests. Snapshot diffs that are only a version string
   are expected: update them. A snapshot whose content changes from a
   successful result to an error, or whose values change without a viem
   changelog entry explaining why, is a regression: fix the code, not the
   snapshot, and say so in the PR body.
6. Add one `patch` changeset naming every package whose manifest changed,
   unless a breaking viem change surfaces through tevm's public types, in
   which case the changeset is `minor` and names the affected exports.

PR title: `⬆️ chore(deps): upgrade viem to <version>`. Body: the version
range, the breaking changes considered, and every snapshot that changed with
the reason. Keep unrelated dependency bumps out of this PR.
