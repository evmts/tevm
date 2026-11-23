import type { ReactNode } from 'react'

function DiagramFrame({
	title,
	caption,
	viewBox,
	children,
}: {
	title: string
	caption: string
	viewBox: string
	children: ReactNode
}) {
	return (
		<figure className="tevm-diagram">
			<div className="tevm-diagram__header">{title}</div>
			<div className="tevm-diagram__canvas">
				<svg viewBox={viewBox} width="100%" role="img" aria-label={title} className="tevm-svg">
					<defs>
						<marker id="core-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="currentColor" />
						</marker>
						<marker id="core-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0085ff" />
						</marker>
						<marker id="core-arrow-emerald" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
						</marker>
						<marker id="core-arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
						</marker>
					</defs>
					{children}
				</svg>
			</div>
			<figcaption className="tevm-diagram__caption">{caption}</figcaption>
		</figure>
	)
}

export function CoreStackDiagram() {
	return (
		<DiagramFrame
			title="Native TEVM Execution Stack"
			caption="MemoryClient, standalone actions, and @tevm/server all talk to one serialized ZevmEngine over Node-API."
			viewBox="0 0 760 310"
		>
			<rect x="20" y="16" width="224" height="62" rx="8" className="svg-box-accent" />
			<text x="132" y="42" textAnchor="middle" className="svg-title">MemoryClient</text>
			<text x="132" y="61" textAnchor="middle" className="svg-sub">viem public · wallet · test · tevm</text>

			<rect x="268" y="16" width="224" height="62" rx="8" className="svg-box" />
			<text x="380" y="42" textAnchor="middle" className="svg-title">Standalone Actions</text>
			<text x="380" y="61" textAnchor="middle" className="svg-sub">tevm/actions (browser-safe)</text>

			<rect x="516" y="16" width="224" height="62" rx="8" className="svg-box" />
			<text x="628" y="42" textAnchor="middle" className="svg-title">RPC Servers</text>
			<text x="628" y="61" textAnchor="middle" className="svg-sub">HTTP · WebSocket · Unix IPC</text>

			<line x1="132" y1="78" x2="290" y2="114" className="svg-line-accent" markerEnd="url(#core-arrow-accent)" />
			<line x1="380" y1="78" x2="380" y2="114" className="svg-line-accent" markerEnd="url(#core-arrow-accent)" />
			<line x1="628" y1="78" x2="470" y2="114" className="svg-line-accent" markerEnd="url(#core-arrow-accent)" />

			<rect x="20" y="118" width="720" height="58" rx="10" className="svg-box-strong" />
			<text x="38" y="142" className="svg-title">ZevmEngine (@tevm/node)  —  Serialized Node-API Bridge</text>
			<text x="38" y="162" className="svg-mono-muted">request() · rpc(json) · events (request, response, block, close) · ready() · close()</text>

			<line x1="20" y1="192" x2="740" y2="192" strokeDasharray="5 5" className="svg-divider" />
			<rect x="304" y="182" width="152" height="20" rx="4" className="svg-bg-chip" />
			<text x="380" y="196" textAnchor="middle" className="svg-eyebrow">NATIVE ZIG ENGINE</text>

			<rect x="20" y="210" width="232" height="84" rx="10" className="svg-box-emerald" />
			<text x="36" y="234" className="svg-title">ZEVM</text>
			<text x="36" y="253" className="svg-sub">NodeRuntime, mempool, mining</text>
			<text x="36" y="271" className="svg-sub">Receipts, filters, fork, JSON-RPC</text>

			<rect x="264" y="210" width="232" height="84" rx="10" className="svg-box-amber" />
			<text x="280" y="234" className="svg-title">Voltaire</text>
			<text x="280" y="253" className="svg-sub">Accounts, code, storage slots</text>
			<text x="280" y="271" className="svg-sub">Crypto, RLP, precompiles</text>

			<rect x="508" y="210" width="232" height="84" rx="10" className="svg-box-accent" />
			<text x="524" y="234" className="svg-title">Guillotine Mini</text>
			<text x="524" y="253" className="svg-sub">EVM bytecode interpreter</text>
			<text x="524" y="271" className="svg-sub">Gas, hardforks, debug_traceCall</text>
		</DiagramFrame>
	)
}

export function CoreCallFlowDiagram() {
	return (
		<DiagramFrame
			title="Simulate vs. Queue vs. Mine"
			caption="Plain tevmCall runs eth_call and discards state. Add addToMempool to queue, or addToBlockchain (or default automining) to commit."
			viewBox="0 0 760 220"
		>
			<rect x="16" y="16" width="728" height="58" rx="8" className="svg-band-subtle" />
			<text x="32" y="42" className="svg-mono">tevmCall(params)</text>
			<text x="32" y="59" className="svg-sub">eth_call · read-only · optional stateOverride</text>
			<line x1="360" y1="45" x2="460" y2="45" className="svg-line" markerEnd="url(#core-arrow)" />
			<rect x="466" y="25" width="262" height="40" rx="6" className="svg-box-accent" />
			<text x="597" y="49" textAnchor="middle" className="svg-mono">{'{ rawData }'}  (state untouched)</text>

			<rect x="16" y="82" width="728" height="58" rx="8" className="svg-band-subtle" />
			<text x="32" y="108" className="svg-mono">addToMempool: true</text>
			<text x="32" y="125" className="svg-sub">eth_sendTransaction · waits for tevmMine() in manual mode</text>
			<line x1="360" y1="111" x2="460" y2="111" className="svg-line-amber" markerEnd="url(#core-arrow-amber)" />
			<rect x="466" y="91" width="262" height="40" rx="6" className="svg-box-amber" />
			<text x="597" y="115" textAnchor="middle" className="svg-mono">{'{ txHash }'}  (pending in txpool)</text>

			<rect x="16" y="148" width="728" height="58" rx="8" className="svg-band-subtle" />
			<text x="32" y="174" className="svg-mono">addToBlockchain: true</text>
			<text x="32" y="191" className="svg-sub">sends + mines block immediately</text>
			<line x1="360" y1="177" x2="460" y2="177" className="svg-line-emerald" markerEnd="url(#core-arrow-emerald)" />
			<rect x="466" y="157" width="262" height="40" rx="6" className="svg-box-emerald" />
			<text x="597" y="181" textAnchor="middle" className="svg-mono">{'{ txHash, receipt }'}  (canonical)</text>
		</DiagramFrame>
	)
}

export function CoreForkDiagram() {
	return (
		<DiagramFrame
			title="Local Fork Overlay"
			caption="ZEVM starts a local chain at block 0 backed by lazy upstream reads at your pinned blockNumber. Writes never leave your process."
			viewBox="0 0 760 190"
		>
			<rect x="16" y="18" width="212" height="154" rx="10" className="svg-box-emerald" />
			<text x="32" y="46" className="svg-title">1. Local Write Overlay</text>
			<text x="32" y="70" className="svg-sub">Height starts at 0</text>
			<text x="32" y="90" className="svg-sub">All mutations &amp; mined</text>
			<text x="32" y="108" className="svg-sub">blocks stay local</text>
			<text x="32" y="146" className="svg-mono-muted">Checked first</text>

			<line x1="228" y1="95" x2="268" y2="95" className="svg-line-accent" markerEnd="url(#core-arrow-accent)" />

			<rect x="272" y="18" width="216" height="154" rx="10" className="svg-box-accent" />
			<text x="288" y="46" className="svg-title">2. Lazy Read Cache</text>
			<text x="288" y="70" className="svg-sub">Misses fetch once from</text>
			<text x="288" y="90" className="svg-sub">upstream at blockNumber</text>
			<text x="288" y="114" className="svg-sub">Hits stay in native RAM</text>
			<text x="288" y="146" className="svg-mono-muted">No full chain copy</text>

			<line x1="488" y1="95" x2="528" y2="95" className="svg-line-amber" markerEnd="url(#core-arrow-amber)" />

			<rect x="532" y="18" width="212" height="154" rx="10" className="svg-box-amber" />
			<text x="548" y="46" className="svg-title">3. Upstream RPC</text>
			<text x="548" y="70" className="svg-sub">Remote network or</text>
			<text x="548" y="90" className="svg-sub">separate OS process</text>
			<text x="548" y="122" className="svg-sub">Never forked from the</text>
			<text x="548" y="140" className="svg-sub">same JS event loop</text>
		</DiagramFrame>
	)
}

export function QaBox({ question, children }: { question: string; children: ReactNode }) {
	return (
		<aside className="tevm-callout tevm-callout--qa">
			<div className="tevm-callout__label">Q: {question}</div>
			<div className="tevm-callout__body">{children}</div>
		</aside>
	)
}

export function WatchOut({ title = 'Watch out', children }: { title?: string; children: ReactNode }) {
	return (
		<aside className="tevm-callout tevm-callout--warn">
			<div className="tevm-callout__label">{title}</div>
			<div className="tevm-callout__body">{children}</div>
		</aside>
	)
}
