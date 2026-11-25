#!/usr/bin/env sh
set -eu
set -- cli/dist/cli.js serve --json \
  --host "${TEVM_HIVE_HOST:-0.0.0.0}" \
  --port "${TEVM_HIVE_PORT:-8545}" \
  --chain-id "${TEVM_HIVE_CHAIN_ID:-900}" \
  --logging-level "${TEVM_HIVE_LOG_LEVEL:-info}"
if [ -n "${TEVM_HIVE_FORK_URL:-}" ]; then
  set -- "$@" --fork "$TEVM_HIVE_FORK_URL"
fi
exec node "$@"
