# Scope-coherence lint

Scope: the complete diff. This is a check-only review; never propose edits.

The repository's recent history strongly favors one coherent intent per PR.
Judge semantic scope, not raw file count. A large generated or manifest sweep is
valid when every changed file is a deterministic instance of one rule. A small
diff is invalid when it quietly mixes unrelated behavior.

Report only concrete scope escapes:

- A second subsystem or behavior change has no dependency on the stated change,
  its tests, generated outputs, documentation, or release metadata.
- A dependency/toolchain migration also introduces product refactors or fixes
  that can be reviewed and reverted independently.
- Generated docs, lockfiles, snapshots, compiled output, vendored trees, or git
  links changed without a corresponding source/config input in the diff.
- Two competing implementations or compatibility layers are added where the
  repository already has a single owner/helper, especially when one is dead or
  unreachable.
- Broad formatting, renaming, dependency churn, or copied upstream source
  obscures the behavioral change.

Allow recursive barrels, `tevm` facades, a changeset, package manifests,
lockfile changes caused by those manifests, regenerated docs, and focused tests
as part of one public API change. Allow an enumerably mechanical repository-wide
sweep such as replacing one canonical repository URL in every manifest.

For each finding name the exact unrelated file group and explain the independent
intent. Do not use vague claims such as "too many files" or impose an arbitrary
line limit. If the diff is broad but mechanically coherent, pass it.
