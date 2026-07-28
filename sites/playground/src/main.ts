import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { solidity } from '@replit/codemirror-lang-solidity'
import { oneDark } from '@codemirror/theme-one-dark'
import { examples, type Example } from './examples'
import { runCode, type RunLine } from './runner'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
	<header class="header">
		<div class="header-title">
			<h1>tevm playground</h1>
			<p>A real EVM, running in this page. No node. No RPC server. No signup. View it, run it, copy it out.</p>
		</div>
		<a class="header-link" href="https://tevm.sh" target="_blank" rel="noreferrer">tevm.sh →</a>
	</header>
	<nav class="tabs" role="tablist"></nav>
	<p class="blurb"></p>
	<div class="panes">
		<section class="pane">
			<div class="pane-head"><span>TypeScript — edit me</span>
				<span class="pane-actions">
					<button class="btn btn-copy" title="Copy a complete runnable file">Copy file</button>
					<button class="btn btn-share" title="Copy a link that reproduces this exact state">Share</button>
					<button class="btn btn-run">▶ Run</button>
				</span>
			</div>
			<div class="editor ts-editor"></div>
		</section>
		<section class="pane">
			<div class="pane-head"><span class="sol-label">Solidity — precompiled with solc 0.8.28</span></div>
			<div class="editor sol-editor"></div>
		</section>
	</div>
	<section class="pane output-pane">
		<div class="pane-head"><span>Output</span><span class="run-status"></span></div>
		<pre class="output"><span class="dim">Press Run. Everything executes locally in your browser tab.</span></pre>
	</section>
	<footer class="foot">
		Solidity here is precompiled — in-browser solc is not in this version.
		Copied files run as-is in a fresh project: <code>npm install tevm@1.0.0-rc.151 viem</code>, then <code>node --experimental-strip-types file.ts</code> (or tsx).
	</footer>
`

const tabsEl = app.querySelector<HTMLElement>('.tabs')!
const blurbEl = app.querySelector<HTMLElement>('.blurb')!
const outputEl = app.querySelector<HTMLPreElement>('.output')!
const statusEl = app.querySelector<HTMLElement>('.run-status')!
const runBtn = app.querySelector<HTMLButtonElement>('.btn-run')!
const copyBtn = app.querySelector<HTMLButtonElement>('.btn-copy')!
const shareBtn = app.querySelector<HTMLButtonElement>('.btn-share')!

const dark = window.matchMedia('(prefers-color-scheme: dark)')
const themeCompartment = new Compartment()
const solThemeCompartment = new Compartment()
const themeExt = () => (dark.matches ? oneDark : [])

let current: Example = examples[0]

const tsView = new EditorView({
	parent: app.querySelector('.ts-editor')!,
	state: EditorState.create({ doc: '', extensions: [] }),
})
const solView = new EditorView({
	parent: app.querySelector('.sol-editor')!,
	state: EditorState.create({ doc: '', extensions: [] }),
})

const tsState = (doc: string) =>
	EditorState.create({
		doc,
		extensions: [
			basicSetup,
			javascript({ typescript: true }),
			themeCompartment.of(themeExt()),
			keymap.of([{ key: 'Mod-Enter', run: () => (run(), true) }]),
		],
	})
const solState = (doc: string) =>
	EditorState.create({
		doc,
		extensions: [basicSetup, solidity, solThemeCompartment.of(themeExt()), EditorState.readOnly.of(true)],
	})

dark.addEventListener('change', () => {
	tsView.dispatch({ effects: themeCompartment.reconfigure(themeExt()) })
	solView.dispatch({ effects: solThemeCompartment.reconfigure(themeExt()) })
})

// --- URL state: #e=<id> and, if the code was edited, &c=<base64 code> ---
const encodeState = () => {
	const code = tsView.state.doc.toString()
	const edited = code !== current.code
	const c = edited ? `&c=${btoa(String.fromCharCode(...new TextEncoder().encode(code)))}` : ''
	return `#e=${current.id}${c}`
}
const decodeHash = (): { example: Example; code: string } => {
	const params = new URLSearchParams(location.hash.slice(1))
	const example = examples.find((e) => e.id === params.get('e')) ?? examples[0]
	let code = example.code
	const c = params.get('c')
	if (c) {
		try {
			code = new TextDecoder().decode(Uint8Array.from(atob(c), (ch) => ch.charCodeAt(0)))
		} catch {
			/* bad hash — fall back to the example's own code */
		}
	}
	return { example, code }
}

const renderTabs = () => {
	tabsEl.innerHTML = ''
	for (const e of examples) {
		const b = document.createElement('button')
		b.textContent = e.title
		b.className = `tab${e.id === current.id ? ' active' : ''}`
		b.setAttribute('role', 'tab')
		b.dataset.example = e.id
		b.onclick = () => select(e)
		tabsEl.appendChild(b)
	}
}

const select = (e: Example, code?: string) => {
	current = e
	tsView.setState(tsState(code ?? e.code))
	solView.setState(solState(e.solidity))
	blurbEl.textContent = e.blurb + (e.usesNetwork ? ' Uses a public RPC to fetch fork state — it can rate-limit.' : '')
	outputEl.innerHTML = '<span class="dim">Press Run. Everything executes locally in your browser tab.</span>'
	statusEl.textContent = ''
	history.replaceState(null, '', encodeState())
	renderTabs()
}

let running = false
const run = async () => {
	if (running) return
	running = true
	runBtn.disabled = true
	runBtn.textContent = '… running'
	statusEl.textContent = current.usesNetwork ? 'fetching fork state over RPC…' : 'executing locally…'
	outputEl.innerHTML = ''
	const started = performance.now()
	const append = (line: RunLine) => {
		const span = document.createElement('span')
		span.className = `line ${line.kind}`
		span.textContent = line.text + '\n'
		outputEl.appendChild(span)
		outputEl.scrollTop = outputEl.scrollHeight
	}
	try {
		await runCode(tsView.state.doc.toString(), append)
		statusEl.textContent = `done in ${((performance.now() - started) / 1000).toFixed(2)}s`
	} catch (err) {
		const text =
			err instanceof Error
				? `${err.name}: ${err.message || err.stack || 'Unknown error'}`
				: String(err)
		append({ kind: 'error', text })
		statusEl.textContent = 'failed'
	} finally {
		running = false
		runBtn.disabled = false
		runBtn.textContent = '▶ Run'
	}
}

const flash = (btn: HTMLButtonElement, label: string) => {
	const prev = btn.textContent
	btn.textContent = label
	setTimeout(() => (btn.textContent = prev), 1500)
}

runBtn.onclick = run
copyBtn.onclick = async () => {
	await navigator.clipboard.writeText(tsView.state.doc.toString())
	flash(copyBtn, 'Copied ✓')
}
shareBtn.onclick = async () => {
	const url = `${location.origin}${location.pathname}${encodeState()}`
	history.replaceState(null, '', url)
	await navigator.clipboard.writeText(url)
	flash(shareBtn, 'Link copied ✓')
}

const initial = decodeHash()
select(initial.example, initial.code !== initial.example.code ? initial.code : undefined)
