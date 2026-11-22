#!/usr/bin/env node
/**
 * Runs native coverage-guided Zig fuzz tests (`zig build ... --fuzz`) for TEVM's
 * embedded native engine (../zevm, ../voltaire, ../guillotine-mini).
 *
 * Zig's built-in libFuzzer/coverage runner requires Linux (macOS lacks Mach-O
 * debug-info glue and fails with InvalidElfMagic). On Linux this runs locally;
 * on macOS it syncs the sibling Zig repos to a bare-metal Ubuntu Latitude host
 * (default: `nyc-01`, override via `TEVM_ZIG_FUZZ_HOST`) and executes real
 * Linux coverage-guided fuzzing there with the pinned Zig 0.15.2 toolchain.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const siblingRoot = resolve(repoRoot, '..')

const host = process.env['TEVM_ZIG_FUZZ_HOST'] ?? 'nyc-01'
const remoteBase = process.env['TEVM_ZIG_FUZZ_DIR'] ?? '/tmp/tevm-zig-fuzz'
const durationSeconds = Number.parseInt(process.env['TEVM_ZIG_FUZZ_SECONDS'] ?? '15', 10)
const filter = process.env['TEVM_ZIG_FUZZ_FILTER'] ?? ''
const targetRepo = process.env['TEVM_ZIG_FUZZ_REPO'] ?? 'zevm'

const miseToml = readFileSync(resolve(repoRoot, 'mise.toml'), 'utf8')
const pinnedZig = /zig\s*=\s*"([^"]+)"/.exec(miseToml)?.[1] ?? '0.15.2'

const run = (cmd, args, opts = {}) => {
	const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
	if (res.status !== 0) {
		process.exit(res.status ?? 1)
	}
}

const repos = ['zevm', 'voltaire', 'guillotine-mini']
for (const name of repos) {
	const full = resolve(siblingRoot, name)
	if (!existsSync(full)) {
		console.error(`Missing sibling native repository: ${full}`)
		process.exit(1)
	}
}

const buildTargetArgs = (step, testFilter) => [
	'build',
	step,
	...(testFilter ? [`-Dfuzz-filter=${testFilter}`] : []),
	'--fuzz',
]

if (process.platform === 'linux' && !process.env['TEVM_ZIG_FUZZ_FORCE_REMOTE']) {
	const cwd = resolve(siblingRoot, targetRepo)
	const step = process.env['TEVM_ZIG_FUZZ_STEP'] ?? (targetRepo === 'zevm' ? 'fuzz-c-abi' : 'test')
	console.log(`Running native Linux Zig fuzzing locally in ${cwd} (${step}, ${durationSeconds}s)...`)
	const res = spawnSync('timeout', ['--signal=INT', `${durationSeconds}s`, 'zig', ...buildTargetArgs(step, filter)], {
		cwd,
		stdio: 'inherit',
	})
	// Exit code 124 (timeout reached cleanly with zero crashes) is success for continuous fuzzing.
	if (res.status !== 0 && res.status !== 124 && res.status !== 130) {
		process.exit(res.status ?? 1)
	}
	process.exit(0)
}

console.log(`Syncing sibling native Zig repositories to ${host}:${remoteBase} (Zig ${pinnedZig})...`)
run('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', host, `mkdir -p ${remoteBase}`])

for (const name of repos) {
	const src = `${resolve(siblingRoot, name)}/`
	const dst = `${host}:${remoteBase}/${name}/`
	run('rsync', [
		'-az',
		'--delete',
		'--exclude=.git',
		'--exclude=.jj',
		'--exclude=.zig-cache',
		'--exclude=.zig-cache-*',
		'--exclude=zig-out',
		'--exclude=node_modules',
		'--exclude=target',
		'--exclude=artifacts',
		'--exclude=.smithers',
		'--exclude=.worktrees',
		'--exclude=.playwright-mcp',
		'--exclude=smithers.db*',
		'--exclude=tevm-monorepo',
		'--exclude=docs',
		'--exclude=docs-starlight',
		'--exclude=apps',
		'--exclude=benchmark',
		'--exclude=coverage',
		'--exclude=kotlin',
		'--exclude=reports',
		'--exclude=examples',
		'--exclude=client-ts',
		'--exclude=cloudflare',
		'--exclude=wasm',
		'--exclude=workflow',
		'--exclude=*.log',
		src,
		dst,
	])
}

const stepOverride = process.env['TEVM_ZIG_FUZZ_STEP'] ?? ''

const remoteScript = `
set -euo pipefail
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"
ZIG_BIN="$HOME/.local/zig-${pinnedZig}/zig"
if [ ! -x "$ZIG_BIN" ]; then
  if command -v zig >/dev/null 2>&1; then
    ZIG_BIN="$(command -v zig)"
  else
    echo "Zig ${pinnedZig} not found on ${host}" >&2
    exit 1
  fi
fi
echo "Remote host: $(hostname) ($(uname -sr))"
echo "Using Zig: $($ZIG_BIN version) at $ZIG_BIN"
cd "${remoteBase}/${targetRepo}"
STEP="${stepOverride}"
if [ -z "$STEP" ]; then
  if "$ZIG_BIN" build --help 2>&1 | grep -qE '^\\s+fuzz-c-abi\\b'; then
    STEP="fuzz-c-abi"
  elif "$ZIG_BIN" build --help 2>&1 | grep -qE '^\\s+fuzz\\b'; then
    STEP="fuzz"
  else
    STEP="test"
  fi
fi
echo "Running corpus replay: zig build $STEP"
"$ZIG_BIN" build "$STEP" ${filter ? `-Dfuzz-filter=${JSON.stringify(filter)}` : ''}
echo "Running coverage-guided Linux fuzzing: zig build $STEP --fuzz (timeout ${durationSeconds}s)"
set +e
timeout --signal=INT "${durationSeconds}s" "$ZIG_BIN" build "$STEP" ${filter ? `-Dfuzz-filter=${JSON.stringify(filter)}` : ''} --fuzz
STATUS=$?
set -e
if [ "$STATUS" -eq 0 ] || [ "$STATUS" -eq 124 ] || [ "$STATUS" -eq 130 ]; then
  echo "Coverage-guided Zig fuzzing completed cleanly (exit=$STATUS, zero crashes)."
  exit 0
fi
echo "Coverage-guided Zig fuzzing FAILED (exit=$STATUS)" >&2
exit "$STATUS"
`

console.log(`Executing coverage-guided Zig fuzzing on ${host} for ${durationSeconds}s...`)
run('ssh', ['-o', 'BatchMode=yes', host, 'bash', '-s'], {
	stdio: ['pipe', 'inherit', 'inherit'],
	input: remoteScript,
})
console.log(`Remote Ubuntu Zig fuzzing (${targetRepo}) completed cleanly.`)
