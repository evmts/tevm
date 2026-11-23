#!/usr/bin/env bash
set -euo pipefail
cd -- "$1/$2"
pin=$3
step=$4
filter=$5
duration=$6
export PATH="$PATH:$HOME/.cargo/bin:$HOME/.local/bin"
zig="$HOME/.local/zig-$pin/zig"
[[ -x "$zig" ]] || zig=zig
[[ "$("$zig" version)" == "$pin" ]] || { echo "Expected Zig $pin" >&2; exit 1; }

if [[ -z "$step" ]]; then
	help=$("$zig" build --help)
	if grep -Eq '^[[:space:]]+fuzz-c-abi([[:space:]]|$)' <<< "$help"; then step=fuzz-c-abi
	elif grep -Eq '^[[:space:]]+fuzz([[:space:]]|$)' <<< "$help"; then step=fuzz
	else step=test
	fi
fi
cache=$(mktemp -d)
worker=
cleanup() {
	if [[ -n "$worker" ]]; then
		kill -TERM -- "-$worker" 2>/dev/null || true
		wait "$worker" 2>/dev/null || true
	fi
	rm -rf -- "$cache"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP
args=(build "$step" --cache-dir "$cache")
[[ -z "$filter" ]] || args+=("-Dfuzz-filter=$filter")
"$zig" "${args[@]}"
set -m
"$zig" "${args[@]}" --fuzz &
worker=$!

# Zig 0.15.2 rebuilds instrumented tests inside --fuzz. The first native
# usize of each v/<id> coverage map is SeenPcsHeader.n_runs on 64-bit Linux.
# The fresh cache ensures a previous campaign cannot satisfy this check.
shopt -s nullglob
first_run() {
	local file runs
	for file in "$cache"/v/*; do
		runs=$(od -An -N8 -tu8 -- "$file")
		[[ "$runs" =~ [1-9] ]] && return 0
	done
	return 1
}
require_worker() {
	if ! kill -0 "$worker" 2>/dev/null; then
		wait "$worker" || exit $?
		echo "Fuzzer exited before completing its budget" >&2
		exit 1
	fi
}
start=$SECONDS
until first_run; do
	require_worker
	(( SECONDS - start < 1800 )) || { echo "No fuzz execution within 30 minutes" >&2; exit 1; }
	sleep 1
done
echo "Observed a fuzz execution. Running for ${duration}s."
start=$SECONDS
while (( SECONDS - start < duration )); do
	require_worker
	sleep 1
done
kill -INT -- "-$worker"
status=0
wait "$worker" || status=$?
worker=
[[ "$status" == 0 || "$status" == 130 ]] || exit "$status"
