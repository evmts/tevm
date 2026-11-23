#!/usr/bin/env bash
set -euo pipefail

# Hold ownership across both preparation and publication. A leftover backup
# from a previous interrupted run belongs to manual --restore.
lock=.changeset/.publish-prep-lock
mkdir "$lock"
trap 'rmdir "$lock"' EXIT
if [[ -e .changeset/.publish-prep-backup.json ]]; then
	echo "Publish backup already exists. Run --restore before publishing." >&2
	exit 1
fi

pnpm install
nx run-many --target=build:app,build:dist,build:types --skip-nx-cache

publisher=
cleanup() {
	local status=$?
	trap - EXIT
	trap '' INT TERM
	if [[ -n "$publisher" ]]; then
		kill -TERM -- "-$publisher" 2>/dev/null || true
		wait "$publisher" 2>/dev/null || true
	fi
	node scripts/prepare-changeset-publish.mjs --restore || status=$?
	rmdir "$lock" || status=$?
	exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
node scripts/prepare-changeset-publish.mjs --apply
export TEVM_REAL_PNPM="$(command -v pnpm)"
export PATH="$PWD/scripts/pnpm-publish-wrapper:$PATH"
# A separate process group lets a signal to this shell stop publish and its children.
set -m
changeset publish "$@" &
publisher=$!
status=0
wait "$publisher" || status=$?
publisher=
exit "$status"
