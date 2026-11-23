#!/usr/bin/env node
/**
 * Aggregates every package's `artifacts/bench.json` into unified reports:
 * - `artifacts/benchmarks/report.json`
 * - `artifacts/benchmarks/summary.md`
 * - `artifacts/benchmarks/report.html` (self-contained interactive dashboard)
 *
 * Compares against `benchmarks/baseline.json` when present so every change
 * immediately surfaces speedups and regressions.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')

const benchPaths = process.argv.slice(2).sort()
if (benchPaths.length === 0) {
	throw new Error('Usage: report.mjs <relative-path-to-bench.json> [...]')
}

const baselinePath = resolve(repoRoot, 'benchmarks/baseline.json')
/** @type {Map<string, { hz: number, meanMs: number, p99Ms: number }>} */
const baselineMap = new Map()
if (existsSync(baselinePath)) {
	const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
	for (const pkg of baseline.packages ?? []) {
		for (const b of pkg.benchmarks ?? []) {
			baselineMap.set(`${pkg.package}::${b.suite}::${b.name}`, {
				hz: b.hz,
				meanMs: b.meanMs,
				p99Ms: b.p99Ms,
			})
		}
	}
}

const packages = []
const rows = []
let totalBenchmarks = 0
let regressions = 0
let improvements = 0

for (const rel of benchPaths) {
	const abs = resolve(repoRoot, rel)
	if (!existsSync(abs)) {
		throw new Error(`Missing benchmark artifact: ${rel}`)
	}
	const data = JSON.parse(readFileSync(abs, 'utf8'))
	packages.push(data)
	for (const b of data.benchmarks ?? []) {
		totalBenchmarks += 1
		const key = `${data.package}::${b.suite}::${b.name}`
		const base = baselineMap.get(key)
		let deltaPct = null
		let status = 'new'
		if (base && base.hz > 0) {
			deltaPct = Number((((b.hz - base.hz) / base.hz) * 100).toFixed(1))
			if (deltaPct <= -15) {
				status = 'regression'
				regressions += 1
			} else if (deltaPct >= 15) {
				status = 'improvement'
				improvements += 1
			} else {
				status = 'stable'
			}
		}
		rows.push({
			package: data.package,
			dir: data.dir,
			runner: data.runner,
			suite: b.suite,
			name: b.name,
			hz: b.hz,
			meanMs: b.meanMs,
			medianMs: b.medianMs,
			p99Ms: b.p99Ms,
			rme: b.rme,
			samples: b.samples,
			baselineHz: base?.hz ?? null,
			deltaPct,
			status,
		})
	}
}

const outDir = resolve(repoRoot, process.env.TEVM_BENCH_REPORT_DIR ?? 'artifacts/benchmarks')
mkdirSync(outDir, { recursive: true })

const aggregate = {
	schemaVersion: 1,
	packageCount: packages.length,
	benchmarkCount: totalBenchmarks,
	regressions,
	improvements,
	packages,
	rows,
}

writeFileSync(resolve(outDir, 'report.json'), `${JSON.stringify(aggregate, null, 2)}\n`, 'utf8')

const fmtHz = (hz) =>
	hz >= 1_000_000
		? `${(hz / 1_000_000).toFixed(2)}M`
		: hz >= 1_000
			? `${(hz / 1_000).toFixed(2)}k`
			: hz.toFixed(1)

const fmtMs = (ms) => (ms < 0.01 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(3)}ms`)

const fmtDelta = (row) => {
	if (row.deltaPct === null) return 'baseline'
	const sign = row.deltaPct >= 0 ? '+' : ''
	const badge = row.status === 'regression' ? ' [SLOW]' : row.status === 'improvement' ? ' [FAST]' : ''
	return `${sign}${row.deltaPct.toFixed(1)}%${badge}`
}

const mdLines = [
	'# TEVM Performance Benchmarks',
	'',
	`- **Packages:** ${packages.length}`,
	`- **Benchmarks:** ${totalBenchmarks}`,
	`- **Improvements (>= +15%):** ${improvements}`,
	`- **Regressions (<= -15%):** ${regressions}`,
	'',
	'| Package | Benchmark | Ops/sec | Mean | p99 | RME | vs Baseline |',
	'| --- | --- | ---: | ---: | ---: | ---: | ---: |',
]
for (const r of rows) {
	mdLines.push(
		`| \`${r.package}\` | ${r.name} | ${fmtHz(r.hz)} | ${fmtMs(r.meanMs)} | ${fmtMs(r.p99Ms)} | ±${r.rme.toFixed(1)}% | ${fmtDelta(r)} |`,
	)
}
const summaryMd = `${mdLines.join('\n')}\n`
writeFileSync(resolve(outDir, 'summary.md'), summaryMd, 'utf8')

const esc = (s) =>
	String(s)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')

const htmlRows = rows
	.map(
		(r) =>
			`<tr data-pkg="${esc(r.package)}" data-status="${esc(r.status)}">` +
			`<td><code>${esc(r.package)}</code></td>` +
			`<td>${esc(r.name)}</td>` +
			`<td class="num">${esc(fmtHz(r.hz))}/s</td>` +
			`<td class="num">${esc(fmtMs(r.meanMs))}</td>` +
			`<td class="num">${esc(fmtMs(r.p99Ms))}</td>` +
			`<td class="num">±${r.rme.toFixed(1)}%</td>` +
			`<td class="num delta ${esc(r.status)}">${esc(fmtDelta(r))}</td>` +
			'</tr>',
	)
	.join('\n')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TEVM Performance Benchmarks</title>
<style>
  :root { --bg:#0d1117; --card:#161b22; --border:#30363d; --text:#e6edf3; --muted:#8b949e; --green:#3fb950; --red:#f85149; --blue:#58a6ff; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); padding: 24px; }
  h1 { margin: 0 0 8px; font-size: 24px; }
  .sub { color: var(--muted); margin-bottom: 20px; font-size: 14px; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .kpi { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .kpi .label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .kpi .val { font-size: 26px; font-weight: 700; margin-top: 4px; }
  .kpi .val.good { color: var(--green); }
  .kpi .val.bad { color: var(--red); }
  .controls { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  input, select { background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; }
  input { flex: 1; min-width: 240px; }
  table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; font-size: 13px; }
  th, td { padding: 9px 12px; border-bottom: 1px solid var(--border); text-align: left; }
  th { background: #1c2128; color: var(--muted); font-weight: 600; position: sticky; top: 0; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  code { color: var(--blue); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .delta.improvement { color: var(--green); font-weight: 600; }
  .delta.regression { color: var(--red); font-weight: 600; }
  .delta.stable, .delta.new { color: var(--muted); }
  tr:hover { background: rgba(88,166,255,0.06); }
</style>
</head>
<body>
  <h1>TEVM Performance Benchmarks</h1>
  <div class="sub">Incremental Smithers benchmark suite across all workspace packages</div>
  <div class="kpis">
    <div class="kpi"><div class="label">Packages</div><div class="val">${packages.length}</div></div>
    <div class="kpi"><div class="label">Benchmarks</div><div class="val">${totalBenchmarks}</div></div>
    <div class="kpi"><div class="label">Improvements (&ge;15%)</div><div class="val good">${improvements}</div></div>
    <div class="kpi"><div class="label">Regressions (&le;-15%)</div><div class="val ${regressions > 0 ? 'bad' : ''}">${regressions}</div></div>
  </div>
  <div class="controls">
    <input id="q" placeholder="Filter by package or benchmark name..." />
    <select id="st">
      <option value="">All statuses</option>
      <option value="regression">Regressions</option>
      <option value="improvement">Improvements</option>
      <option value="stable">Stable</option>
      <option value="new">New / Baseline</option>
    </select>
  </div>
  <table>
    <thead><tr><th>Package</th><th>Benchmark</th><th class="num">Ops/sec</th><th class="num">Mean</th><th class="num">p99</th><th class="num">RME</th><th class="num">vs Baseline</th></tr></thead>
    <tbody id="rows">${htmlRows}</tbody>
  </table>
  <script>
    const q = document.getElementById('q');
    const st = document.getElementById('st');
    const trs = Array.from(document.querySelectorAll('#rows tr'));
    const filter = () => {
      const term = q.value.toLowerCase();
      const s = st.value;
      for (const tr of trs) {
        const matchText = !term || tr.textContent.toLowerCase().includes(term);
        const matchSt = !s || tr.dataset.status === s;
        tr.style.display = matchText && matchSt ? '' : 'none';
      }
    };
    q.addEventListener('input', filter);
    st.addEventListener('change', filter);
  </script>
</body>
</html>
`
writeFileSync(resolve(outDir, 'report.html'), html, 'utf8')
console.log(`Aggregated ${totalBenchmarks} benchmarks across ${packages.length} packages -> ${outDir}/`)
