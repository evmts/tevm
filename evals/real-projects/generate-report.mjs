import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const input = path.resolve(root, process.argv[2] || 'results/final.json')
const output = path.resolve(
  process.argv[3] ||
  '/Users/williamcory/Tevm-Ops/Research/real-project-evals-2026-07-28/report.html',
)
const report = JSON.parse(await fs.readFile(input, 'utf8'))
const percent = (value) => `${(value * 100).toFixed(1)}%`
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])
const rows = report.results.map((item) => `
  <tr>
    <th scope="row">${escape(item.project)}</th>
    <td><span class="status ${item.oneShotPassed ? 'pass' : item.checkerPassed ? 'retry' : 'fail'}">${item.oneShotPassed ? 'One-shot pass' : item.checkerPassed ? 'Retry pass' : 'Fail'}</span></td>
    <td>${item.assertions.passed}/${item.assertions.total}</td>
    <td>${item.attempts}</td>
    <td><code>${escape(item.smithersRunId || 'not admitted')}</code></td>
    <td>${escape(item.failureMode || 'No first-attempt or checker failure')}</td>
  </tr>`).join('')
const failed = report.results.filter((item) => !item.oneShotPassed)
const failureItems = failed.length
  ? failed.map((item) => `<li><strong>${escape(item.project)}:</strong> ${escape(item.failureMode)}</li>`).join('')
  : '<li>No generated SDK failed its hidden checker.</li>'
const attemptRows = report.results.map((item) => `
  <li><strong>${escape(item.project)}:</strong> ${item.attempts} stack attempt(s). ${escape(item.launchHistory)}</li>
`).join('')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tevm real-project SDK evals</title>
<style>
  :root { color-scheme: light dark; --bg:#f7f7f4; --panel:#fff; --text:#171717; --muted:#626262;
    --line:#d8d8d2; --accent:#3157d5; --pass:#117a44; --fail:#b42318; --code:#f0f0eb; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#111210; --panel:#1b1c19; --text:#f2f2ed; --muted:#a9aaa3; --line:#383a34;
      --accent:#8ba5ff; --pass:#5ed692; --fail:#ff8a80; --code:#252721; }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.55 ui-sans-serif,system-ui,sans-serif; }
  main { width:min(1160px, calc(100% - 32px)); margin:40px auto 72px; }
  header, section { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:28px; margin:18px 0; }
  h1 { font-size:clamp(2rem,5vw,4.5rem); line-height:1; margin:.2rem 0 1rem; letter-spacing:-.04em; }
  h2 { margin-top:0; }
  .eyebrow { color:var(--accent); font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .lede { max-width:76ch; color:var(--muted); font-size:1.08rem; }
  .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin-top:24px; }
  .metric { border:1px solid var(--line); border-radius:12px; padding:16px; }
  .metric b { display:block; font-size:2rem; line-height:1.15; }
  .metric span { color:var(--muted); }
  .table-wrap { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; min-width:900px; }
  th, td { border-bottom:1px solid var(--line); padding:12px; text-align:left; vertical-align:top; }
  thead th { color:var(--muted); font-size:.86rem; text-transform:uppercase; letter-spacing:.05em; }
  code { background:var(--code); border-radius:5px; padding:2px 5px; font-size:.86em; }
  .status { display:inline-block; border:1px solid currentColor; border-radius:999px; padding:2px 9px; font-weight:700; }
  .pass { color:var(--pass); } .retry { color:var(--accent); } .fail { color:var(--fail); }
  li + li { margin-top:.7rem; }
  footer { color:var(--muted); text-align:center; margin-top:24px; }
</style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">Real-project stack eval</div>
    <h1>${report.passed}/${report.cases} passed one-shot</h1>
    <p class="lede">Smithers was asked to generate typed SDKs for six shipped Ethereum projects. Hidden tests exercised each eventual candidate against a Tevm fork of real mainnet state at block ${escape(report.blockNumber)}. ${report.eventualPassed}/${report.cases} eventually produced working SDKs, with ${report.assertionsPassed}/${report.assertions} final end-to-end assertions passing.</p>
    <div class="metrics">
      <div class="metric"><b>${percent(report.passRate)}</b><span>project pass rate</span></div>
      <div class="metric"><b>${report.eventualPassed}/${report.cases}</b><span>eventual working SDKs</span></div>
      <div class="metric"><b>${percent(report.assertionPassRate)}</b><span>assertion pass rate</span></div>
      <div class="metric"><b>${report.blockNumber}</b><span>pinned mainnet block</span></div>
      <div class="metric"><b>${escape(report.model)}</b><span>worker model</span></div>
    </div>
  </header>
  <section>
    <h2>Per-project result</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Project</th><th>SDK</th><th>Assertions</th><th>Attempts</th><th>Run ID</th><th>What failed</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>
  <section>
    <h2>Attempt history</h2>
    <p>The attempt count includes Smithers launch failures because this is a stack eval, not a prompt eval.</p>
    <ul>${attemptRows}</ul>
  </section>
  <section>
    <h2>Failure modes</h2>
    <ul>${failureItems}</ul>
  </section>
  <section>
    <h2>What this says about Tevm's API and docs</h2>
    <ul>
      <li>The client-compatible <code>readContract</code> and <code>getContractEvents</code> surface is familiar enough for agents to wrap real protocol ABIs without a Tevm-specific adapter.</li>
      <li>Pinned pre-Cancun mainnet state avoided the KZG initialization failure seen in the snippet suite at block 20,000,000.</li>
      <li>Large named tuples, overloaded protocol conventions, and request-builder typing remain the strongest API-documentation test. Failures here should be fixed with complete typed examples that use a Tevm fork client, not isolated ABI snippets.</li>
      <li>The largest observed stack risk was nested Smithers admission, where synchronous child launches reused the parent run context and returned success without running a worker. A runner must treat a missing candidate artifact as an orchestration failure even when the launch command exits zero.</li>
    </ul>
  </section>
  <footer>Generated from ${escape(path.basename(input))} on ${escape(report.completedAt)}. No model judged its own output.</footer>
</main>
</body>
</html>
`
await fs.mkdir(path.dirname(output), { recursive: true })
await fs.writeFile(output, html)
console.log(output)
