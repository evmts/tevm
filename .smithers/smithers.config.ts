export const repoCommands = {
  lint: null,
  test: null,
  coverage: null,
} as const;

// Pinned to sqlite: this workspace was migrated to pglite on 2026-06-23, but
// `smithers oneshot` runs an inline workflow and inline workflows are
// sqlite-only (BACKEND_MISMATCH). The pre-migration `smithers.db` still holds
// the same two historical runs, so nothing is lost by reading and writing there.
export default { repoCommands, backend: "sqlite" as const };
