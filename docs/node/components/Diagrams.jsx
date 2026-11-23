import React from 'react'

/**
 * Shared SVG wrapper for crisp, responsive, theme-aware diagrams.
 * Uses Vocs CSS variables so diagrams adapt cleanly between light and dark modes.
 */
function DiagramFrame({ title, caption, viewBox, children }) {
	return (
		<figure className="tevm-diagram">
			{title && <div className="tevm-diagram__header">{title}</div>}
			<div className="tevm-diagram__canvas">
				<svg
					viewBox={viewBox}
					width="100%"
					role="img"
					aria-label={title || 'Tevm architecture diagram'}
					xmlns="http://www.w3.org/2000/svg"
					className="tevm-svg"
				>
					<defs>
						<marker
							id="tevm-arrow"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="currentColor" />
						</marker>
						<marker
							id="tevm-arrow-accent"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="var(--tevm-primary, #0085ff)" />
						</marker>
						<marker
							id="tevm-arrow-emerald"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
						</marker>
						<marker
							id="tevm-arrow-amber"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
						</marker>
					</defs>
					{children}
				</svg>
			</div>
			{caption && <figcaption className="tevm-diagram__caption">{caption}</figcaption>}
		</figure>
	)
}

/**
 * 1. Full TEVM + ZEVM + Voltaire + Guillotine Mini layered architecture diagram.
 */
export function ArchitectureDiagram() {
	return (
		<DiagramFrame
			title="TEVM Runtime Stack"
			caption="Your TypeScript code talks to a serialized Node-API bridge. Native Zig code executes EVM bytecode, manages state, and dispatches JSON-RPC."
			viewBox="0 0 760 440"
		>
			{/* Layer 1: Consumers */}
			<rect x="20" y="16" width="720" height="72" rx="10" className="svg-band-subtle" />
			<text x="36" y="36" className="svg-eyebrow">HOST CONSUMERS</text>

			<rect x="36" y="46" width="154" height="32" rx="6" className="svg-box" />
			<text x="113" y="66" textAnchor="middle" className="svg-label-sm">Viem / App / Vitest</text>

			<rect x="204" y="46" width="154" height="32" rx="6" className="svg-box" />
			<text x="281" y="66" textAnchor="middle" className="svg-label-sm">Ethers (TevmProvider)</text>

			<rect x="372" y="46" width="166" height="32" rx="6" className="svg-box" />
			<text x="455" y="66" textAnchor="middle" className="svg-label-sm">Browser (HTTP / WS)</text>

			<rect x="552" y="46" width="172" height="32" rx="6" className="svg-box" />
			<text x="638" y="66" textAnchor="middle" className="svg-label-sm">AI Agents (@tevm/mcp)</text>

			{/* Arrows down to Layer 2 */}
			<line x1="150" y1="88" x2="150" y2="118" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<line x1="281" y1="88" x2="281" y2="118" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<line x1="455" y1="88" x2="530" y2="118" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<line x1="638" y1="88" x2="610" y2="118" className="svg-line" markerEnd="url(#tevm-arrow)" />

			{/* Layer 2: JS Host Surfaces */}
			<rect x="20" y="122" width="350" height="78" rx="10" className="svg-box-accent" />
			<text x="38" y="146" className="svg-title">MemoryClient (@tevm/memory-client)</text>
			<text x="38" y="166" className="svg-sub">viem public · wallet · test (Anvil) · tevm* actions</text>
			<text x="38" y="184" className="svg-mono-muted">createMemoryClient() · createTevmTransport()</text>

			<rect x="390" y="122" width="350" height="78" rx="10" className="svg-box" />
			<text x="408" y="146" className="svg-title">RPC Servers (@tevm/server)</text>
			<text x="408" y="166" className="svg-sub">HTTP · WebSocket subscriptions · Unix IPC · Express · Next.js</text>
			<text x="408" y="184" className="svg-mono-muted">createServer() · createIpcServer() · createHttpClient()</text>

			{/* Arrows to ZevmEngine */}
			<line x1="210" y1="200" x2="310" y2="232" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />
			<line x1="550" y1="200" x2="450" y2="232" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />

			{/* Layer 3: ZevmEngine / Node-API boundary */}
			<rect x="20" y="236" width="720" height="62" rx="10" className="svg-box-strong" />
			<text x="38" y="260" className="svg-title">ZevmEngine (@tevm/node)  —  Node-API / C ABI Boundary</text>
			<text x="38" y="281" className="svg-mono-muted">request() · rpc(json) · events (request, response, block, close) · ready() · close()</text>
			<rect x="595" y="249" width="128" height="24" rx="12" className="svg-pill-accent" />
			<text x="659" y="265" textAnchor="middle" className="svg-pill-text">Serialized Queue</text>

			{/* Divider line JS vs Native */}
			<line x1="20" y1="312" x2="740" y2="312" strokeDasharray="5 5" className="svg-divider" />
			<rect x="300" y="302" width="160" height="20" rx="4" className="svg-bg-chip" />
			<text x="380" y="316" textAnchor="middle" className="svg-eyebrow">NATIVE ZIG ENGINE</text>

			{/* Layer 4: Native Zig Components */}
			<rect x="20" y="330" width="232" height="92" rx="10" className="svg-box-emerald" />
			<text x="36" y="354" className="svg-title">ZEVM</text>
			<text x="36" y="373" className="svg-sub">NodeRuntime &amp; RPC dispatcher</text>
			<text x="36" y="390" className="svg-sub">Chain, mempool, mining, filters</text>
			<text x="36" y="407" className="svg-sub">Snapshots &amp; fork backend</text>

			<rect x="264" y="330" width="232" height="92" rx="10" className="svg-box-amber" />
			<text x="280" y="354" className="svg-title">Voltaire</text>
			<text x="280" y="373" className="svg-sub">Account &amp; storage state</text>
			<text x="280" y="390" className="svg-sub">Ethereum primitives &amp; RLP</text>
			<text x="280" y="407" className="svg-sub">Cryptography &amp; precompiles</text>

			<rect x="508" y="330" width="232" height="92" rx="10" className="svg-box-accent" />
			<text x="524" y="354" className="svg-title">Guillotine Mini</text>
			<text x="524" y="373" className="svg-sub">Native EVM bytecode interpreter</text>
			<text x="524" y="390" className="svg-sub">Gas accounting &amp; hardforks</text>
			<text x="524" y="407" className="svg-sub">debug_traceCall opcode tracer</text>

			{/* Bidirectional connectors between Zig modules */}
			<line x1="252" y1="376" x2="264" y2="376" className="svg-line" />
			<line x1="496" y1="376" x2="508" y2="376" className="svg-line" />
		</DiagramFrame>
	)
}

/**
 * 2. Simulation vs Pending Mempool vs Mined Canonical Block.
 */
export function ExecutionFlowDiagram() {
	return (
		<DiagramFrame
			title="Three Paths Through tevmCall"
			caption="A plain tevmCall never mutates chain state. Pass addToMempool to queue a transaction, or addToBlockchain to include it in a block immediately."
			viewBox="0 0 760 278"
		>
			{/* Row 1: Simulate */}
			<rect x="16" y="16" width="728" height="74" rx="10" className="svg-band-subtle" />
			<rect x="28" y="28" width="160" height="50" rx="8" className="svg-box" />
			<text x="108" y="49" textAnchor="middle" className="svg-mono">tevmCall(params)</text>
			<text x="108" y="66" textAnchor="middle" className="svg-pill-muted">default: read-only</text>

			<line x1="188" y1="53" x2="226" y2="53" className="svg-line" markerEnd="url(#tevm-arrow)" />

			<rect x="230" y="28" width="146" height="50" rx="8" className="svg-box" />
			<text x="303" y="49" textAnchor="middle" className="svg-label-sm">eth_call</text>
			<text x="303" y="66" textAnchor="middle" className="svg-sub">optional stateOverride</text>

			<line x1="376" y1="53" x2="414" y2="53" className="svg-line" markerEnd="url(#tevm-arrow)" />

			<rect x="418" y="28" width="146" height="50" rx="8" className="svg-box" />
			<text x="491" y="49" textAnchor="middle" className="svg-label-sm">Discard state</text>
			<text x="491" y="66" textAnchor="middle" className="svg-sub">chain untouched</text>

			<line x1="564" y1="53" x2="602" y2="53" className="svg-line" markerEnd="url(#tevm-arrow)" />

			<rect x="606" y="28" width="124" height="50" rx="8" className="svg-box-accent" />
			<text x="668" y="49" textAnchor="middle" className="svg-mono">{'{ rawData }'}</text>
			<text x="668" y="66" textAnchor="middle" className="svg-sub">no txHash</text>

			{/* Row 2: Queue to mempool */}
			<rect x="16" y="102" width="728" height="74" rx="10" className="svg-band-subtle" />
			<rect x="28" y="114" width="160" height="50" rx="8" className="svg-box-amber" />
			<text x="108" y="135" textAnchor="middle" className="svg-mono">addToMempool: true</text>
			<text x="108" y="152" textAnchor="middle" className="svg-sub">manual mining mode</text>

			<line x1="188" y1="139" x2="226" y2="139" className="svg-line-amber" markerEnd="url(#tevm-arrow-amber)" />

			<rect x="230" y="114" width="146" height="50" rx="8" className="svg-box" />
			<text x="303" y="135" textAnchor="middle" className="svg-label-sm">eth_sendTransaction</text>
			<text x="303" y="152" textAnchor="middle" className="svg-sub">queued in txpool</text>

			<line x1="376" y1="139" x2="414" y2="139" className="svg-line-amber" markerEnd="url(#tevm-arrow-amber)" />

			<rect x="418" y="114" width="146" height="50" rx="8" className="svg-box-amber" />
			<text x="491" y="135" textAnchor="middle" className="svg-label-sm">Pending (unmined)</text>
			<text x="491" y="152" textAnchor="middle" className="svg-sub">receipt is null until mine</text>

			<line x1="564" y1="139" x2="602" y2="139" className="svg-line-amber" markerEnd="url(#tevm-arrow-amber)" />

			<rect x="606" y="114" width="124" height="50" rx="8" className="svg-box" />
			<text x="668" y="135" textAnchor="middle" className="svg-mono">{'{ txHash }'}</text>
			<text x="668" y="152" textAnchor="middle" className="svg-sub">call tevmMine()</text>

			{/* Row 3: Add to blockchain */}
			<rect x="16" y="188" width="728" height="74" rx="10" className="svg-band-subtle" />
			<rect x="28" y="200" width="160" height="50" rx="8" className="svg-box-emerald" />
			<text x="108" y="221" textAnchor="middle" className="svg-mono">addToBlockchain: true</text>
			<text x="108" y="238" textAnchor="middle" className="svg-sub">or auto mining (default)</text>

			<line x1="188" y1="225" x2="226" y2="225" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="230" y="200" width="146" height="50" rx="8" className="svg-box" />
			<text x="303" y="221" textAnchor="middle" className="svg-label-sm">Send + evm_mine</text>
			<text x="303" y="238" textAnchor="middle" className="svg-sub">mines if unmined</text>

			<line x1="376" y1="225" x2="414" y2="225" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="418" y="200" width="146" height="50" rx="8" className="svg-box-emerald" />
			<text x="491" y="221" textAnchor="middle" className="svg-label-sm">Canonical block</text>
			<text x="491" y="238" textAnchor="middle" className="svg-sub">state committed</text>

			<line x1="564" y1="225" x2="602" y2="225" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="606" y="200" width="124" height="50" rx="8" className="svg-box-emerald" />
			<text x="668" y="221" textAnchor="middle" className="svg-mono">{'{ txHash,'}</text>
			<text x="668" y="238" textAnchor="middle" className="svg-mono">{'  receipt }'}</text>
		</DiagramFrame>
	)
}

/**
 * 3. Mining Modes timeline diagram.
 */
export function MiningModesDiagram() {
	return (
		<DiagramFrame
			title="Block Production Modes"
			caption="Automining is on by default. Switch to manual mining for multi-transaction blocks, or interval mining for wall-clock block cadence."
			viewBox="0 0 760 280"
		>
			{/* Auto */}
			<text x="20" y="34" className="svg-title">1. Auto (default)</text>
			<text x="190" y="34" className="svg-mono-muted">mining: {'{ auto: true }'}</text>
			<line x1="20" y1="62" x2="730" y2="62" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<rect x="80" y="44" width="110" height="34" rx="6" className="svg-box-emerald" />
			<text x="135" y="65" textAnchor="middle" className="svg-label-sm">tx1 → Block #1</text>
			<rect x="290" y="44" width="110" height="34" rx="6" className="svg-box-emerald" />
			<text x="345" y="65" textAnchor="middle" className="svg-label-sm">tx2 → Block #2</text>
			<rect x="500" y="44" width="110" height="34" rx="6" className="svg-box-emerald" />
			<text x="555" y="65" textAnchor="middle" className="svg-label-sm">tx3 → Block #3</text>

			{/* Manual */}
			<text x="20" y="122" className="svg-title">2. Manual</text>
			<text x="190" y="122" className="svg-mono-muted">mining: {'{ auto: false }'}</text>
			<line x1="20" y1="150" x2="730" y2="150" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<rect x="80" y="132" width="76" height="34" rx="6" className="svg-box-amber" />
			<text x="118" y="153" textAnchor="middle" className="svg-label-sm">tx1 queued</text>
			<rect x="180" y="132" width="76" height="34" rx="6" className="svg-box-amber" />
			<text x="218" y="153" textAnchor="middle" className="svg-label-sm">tx2 queued</text>
			<rect x="330" y="132" width="184" height="34" rx="6" className="svg-box-accent" />
			<text x="422" y="153" textAnchor="middle" className="svg-label-sm">tevmMine() → Block #1 [tx1, tx2]</text>

			{/* Interval */}
			<text x="20" y="210" className="svg-title">3. Interval (Zig thread)</text>
			<text x="190" y="210" className="svg-mono-muted">mining: {'{ auto: false, interval: 2 }'}</text>
			<line x1="20" y1="238" x2="730" y2="238" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<rect x="80" y="220" width="110" height="34" rx="6" className="svg-box" />
			<text x="135" y="241" textAnchor="middle" className="svg-label-sm">t = 2s · Block #1</text>
			<rect x="290" y="220" width="110" height="34" rx="6" className="svg-box" />
			<text x="345" y="241" textAnchor="middle" className="svg-label-sm">t = 4s · Block #2</text>
			<rect x="500" y="220" width="110" height="34" rx="6" className="svg-box" />
			<text x="555" y="241" textAnchor="middle" className="svg-label-sm">t = 6s · Block #3</text>
			<text x="20" y="272" className="svg-sub">Always call client.tevmClose() (or engine.close()) to stop interval timers and release native handles.</text>
		</DiagramFrame>
	)
}

/**
 * 4. ZEVM Fork Overlay & Lazy Read-Through Cache diagram.
 */
export function ForkOverlayDiagram() {
	return (
		<DiagramFrame
			title="How ZEVM Forking Works"
			caption="ZEVM starts a fresh local chain at block 0 backed by lazy upstream state reads. Writes stay in memory and never touch the upstream RPC."
			viewBox="0 0 760 270"
		>
			{/* Local Process Box */}
			<rect x="16" y="16" width="468" height="236" rx="12" className="svg-band-subtle" />
			<text x="32" y="38" className="svg-eyebrow">LOCAL NODE.JS PROCESS (HEIGHT STARTS AT 0)</text>

			{/* Read / Write caller */}
			<rect x="32" y="54" width="136" height="178" rx="8" className="svg-box" />
			<text x="100" y="128" textAnchor="middle" className="svg-title">Your Client</text>
			<text x="100" y="148" textAnchor="middle" className="svg-sub">reads &amp; writes</text>
			<text x="100" y="166" textAnchor="middle" className="svg-mono-muted">tevmSetAccount</text>
			<text x="100" y="182" textAnchor="middle" className="svg-mono-muted">tevmCall / mine</text>

			{/* Local Overlay */}
			<rect x="216" y="54" width="248" height="78" rx="8" className="svg-box-emerald" />
			<text x="232" y="78" className="svg-title">1. Local Write Overlay</text>
			<text x="232" y="97" className="svg-sub">Accounts, code, storage, mined blocks</text>
			<text x="232" y="114" className="svg-sub">Checked first on every read · Never sent upstream</text>

			{/* Cache */}
			<rect x="216" y="154" width="248" height="78" rx="8" className="svg-box-accent" />
			<text x="232" y="178" className="svg-title">2. Lazy Read-Through Cache</text>
			<text x="232" y="197" className="svg-sub">Miss? Fetch once at pinned blockNumber</text>
			<text x="232" y="214" className="svg-sub">Hit? Served locally at native speed</text>

			{/* Arrows inside local */}
			<line x1="168" y1="93" x2="212" y2="93" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
			<text x="190" y="86" textAnchor="middle" className="svg-pill-muted">write</text>

			<line x1="168" y1="184" x2="212" y2="184" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />
			<text x="190" y="177" textAnchor="middle" className="svg-pill-muted">read</text>

			<line x1="340" y1="132" x2="340" y2="152" className="svg-line" markerEnd="url(#tevm-arrow)" />

			{/* Remote Upstream Box */}
			<rect x="536" y="16" width="208" height="236" rx="12" className="svg-box-amber" />
			<text x="552" y="40" className="svg-eyebrow">SEPARATE PROCESS / RPC</text>
			<text x="552" y="72" className="svg-title">Upstream JSON-RPC</text>
			<text x="552" y="94" className="svg-sub">Mainnet, Optimism, Base,</text>
			<text x="552" y="111" className="svg-sub">or a separate local server</text>

			<rect x="552" y="134" width="176" height="44" rx="6" className="svg-box" />
			<text x="640" y="153" textAnchor="middle" className="svg-mono">eth_getBalance / Code</text>
			<text x="640" y="169" textAnchor="middle" className="svg-mono">eth_getStorageAt</text>

			<text x="552" y="206" className="svg-sub">Sync HTTP in native code:</text>
			<text x="552" y="223" className="svg-sub">do not fork a server on the</text>
			<text x="552" y="239" className="svg-sub">same JS event loop.</text>

			{/* Arrow across process boundary */}
			<line x1="464" y1="192" x2="532" y2="192" className="svg-line-amber" markerEnd="url(#tevm-arrow-amber)" />
			<text x="498" y="182" textAnchor="middle" className="svg-pill-muted">cache miss</text>
		</DiagramFrame>
	)
}

/**
 * 5. Snapshots vs Dump/Load State diagram.
 */
export function StateRollbackDiagram() {
	return (
		<DiagramFrame
			title="Snapshots vs. State Blobs"
			caption="Use evm_snapshot/evm_revert to rewind one engine between test cases. Use tevmDumpState/tevmLoadState to clone or persist state across engines."
			viewBox="0 0 760 232"
		>
			{/* Left: Snapshot/Revert */}
			<rect x="16" y="16" width="356" height="200" rx="10" className="svg-band-subtle" />
			<text x="32" y="40" className="svg-title">In-Process Rewind (snapshot / revert)</text>
			<text x="32" y="58" className="svg-sub">Same engine · Instant · Reverts blocks, time, and accounts</text>

			<rect x="32" y="78" width="90" height="44" rx="6" className="svg-box-accent" />
			<text x="77" y="98" textAnchor="middle" className="svg-label-sm">Baseline</text>
			<text x="77" y="114" textAnchor="middle" className="svg-mono-muted">id = 0x1</text>

			<line x1="122" y1="100" x2="152" y2="100" className="svg-line" markerEnd="url(#tevm-arrow)" />

			<rect x="156" y="78" width="84" height="44" rx="6" className="svg-box" />
			<text x="198" y="98" textAnchor="middle" className="svg-label-sm">Mutate</text>
			<text x="198" y="114" textAnchor="middle" className="svg-sub">txs / edits</text>

			<line x1="240" y1="100" x2="270" y2="100" className="svg-line" markerEnd="url(#tevm-arrow)" />

			<rect x="274" y="78" width="82" height="44" rx="6" className="svg-box" />
			<text x="315" y="98" textAnchor="middle" className="svg-label-sm">Assert</text>
			<text x="315" y="114" textAnchor="middle" className="svg-sub">read state</text>

			{/* Curved arrow back */}
			<path d="M 315 122 L 315 164 L 77 164 L 77 126" fill="none" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />
			<rect x="138" y="152" width="118" height="22" rx="4" className="svg-bg-chip" />
			<text x="197" y="167" textAnchor="middle" className="svg-mono">revert({'{ id }'})</text>

			<text x="32" y="200" className="svg-sub">Note: reverting consumes snapshot id; take a fresh snapshot for the next test.</text>

			{/* Right: Dump/Load */}
			<rect x="388" y="16" width="356" height="200" rx="10" className="svg-band-subtle" />
			<text x="404" y="40" className="svg-title">Portable State Blob (dumpState / loadState)</text>
			<text x="404" y="58" className="svg-sub">Across engines or disk · ZEVM opaque hex blob</text>

			<rect x="404" y="88" width="96" height="54" rx="6" className="svg-box" />
			<text x="452" y="112" textAnchor="middle" className="svg-label-sm">Engine A</text>
			<text x="452" y="129" textAnchor="middle" className="svg-mono-muted">tevmDumpState()</text>

			<line x1="500" y1="115" x2="528" y2="115" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="532" y="88" width="68" height="54" rx="6" className="svg-box-emerald" />
			<text x="566" y="112" textAnchor="middle" className="svg-mono">0x...</text>
			<text x="566" y="129" textAnchor="middle" className="svg-sub">hex blob</text>

			<line x1="600" y1="115" x2="628" y2="115" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="632" y="88" width="96" height="54" rx="6" className="svg-box" />
			<text x="680" y="112" textAnchor="middle" className="svg-label-sm">Engine B</text>
			<text x="680" y="129" textAnchor="middle" className="svg-mono-muted">tevmLoadState()</text>

			<text x="404" y="176" className="svg-sub">Format is ZEVM v2 binary-in-hex — not a JSON account map.</text>
			<text x="404" y="196" className="svg-sub">Save to disk or pass between worker processes.</text>
		</DiagramFrame>
	)
}

/**
 * 6. Server Transports diagram (HTTP, WS, IPC, Express, Next.js).
 */
export function ServerTransportsDiagram() {
	return (
		<DiagramFrame
			title="Serving One Native Engine Over Multiple Transports"
			caption="Browser apps and external tools connect to @tevm/server over HTTP or WebSocket; local processes can also connect over Unix IPC."
			viewBox="0 0 760 264"
		>
			{/* Clients on left */}
			<rect x="16" y="20" width="186" height="46" rx="8" className="svg-box" />
			<text x="109" y="40" textAnchor="middle" className="svg-label-sm">Browser dApp (viem)</text>
			<text x="109" y="56" textAnchor="middle" className="svg-mono-muted">http() / webSocket()</text>

			<rect x="16" y="80" width="186" height="46" rx="8" className="svg-box" />
			<text x="109" y="100" textAnchor="middle" className="svg-label-sm">Remote Node / CLI</text>
			<text x="109" y="116" textAnchor="middle" className="svg-mono-muted">createHttpClient()</text>

			<rect x="16" y="140" width="186" height="46" rx="8" className="svg-box" />
			<text x="109" y="160" textAnchor="middle" className="svg-label-sm">Local Process / Foundry</text>
			<text x="109" y="176" textAnchor="middle" className="svg-mono-muted">/tmp/tevm.sock</text>

			<rect x="16" y="200" width="186" height="46" rx="8" className="svg-box" />
			<text x="109" y="220" textAnchor="middle" className="svg-label-sm">Express / Next.js Route</text>
			<text x="109" y="236" textAnchor="middle" className="svg-mono-muted">middleware / handler</text>

			{/* Transport adapters middle */}
			<rect x="268" y="20" width="218" height="106" rx="10" className="svg-box-accent" />
			<text x="377" y="45" textAnchor="middle" className="svg-title">createServer(client)</text>
			<text x="377" y="66" textAnchor="middle" className="svg-sub">HTTP POST · batches · notifications</text>
			<text x="377" y="85" textAnchor="middle" className="svg-sub">WebSocket · eth_subscribe</text>
			<text x="377" y="104" textAnchor="middle" className="svg-mono-muted">newHeads · logs · pendingTxs</text>

			<rect x="268" y="140" width="218" height="46" rx="8" className="svg-box" />
			<text x="377" y="160" textAnchor="middle" className="svg-title">createIpcServer(client)</text>
			<text x="377" y="176" textAnchor="middle" className="svg-sub">newline-delimited JSON stream</text>

			<rect x="268" y="200" width="218" height="46" rx="8" className="svg-box" />
			<text x="377" y="220" textAnchor="middle" className="svg-title">createHttpHandler(client)</text>
			<text x="377" y="236" textAnchor="middle" className="svg-sub">Express &amp; Next.js adapters</text>

			{/* Arrows left -> middle */}
			<line x1="202" y1="43" x2="264" y2="54" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />
			<line x1="202" y1="103" x2="264" y2="92" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />
			<line x1="202" y1="163" x2="264" y2="163" className="svg-line" markerEnd="url(#tevm-arrow)" />
			<line x1="202" y1="223" x2="264" y2="223" className="svg-line" markerEnd="url(#tevm-arrow)" />

			{/* Single Engine right */}
			<rect x="550" y="54" width="194" height="156" rx="12" className="svg-box-emerald" />
			<text x="647" y="96" textAnchor="middle" className="svg-title">Shared Client</text>
			<text x="647" y="116" textAnchor="middle" className="svg-mono-muted">ZevmEngine</text>
			<line x1="572" y1="132" x2="722" y2="132" className="svg-divider" />
			<text x="647" y="152" textAnchor="middle" className="svg-sub">One chain state</text>
			<text x="647" y="170" textAnchor="middle" className="svg-sub">Native filters</text>
			<text x="647" y="188" textAnchor="middle" className="svg-sub">Serialized queue</text>

			{/* Arrows middle -> right */}
			<line x1="486" y1="73" x2="546" y2="108" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
			<line x1="486" y1="163" x2="546" y2="144" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
			<line x1="486" y1="223" x2="546" y2="176" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
		</DiagramFrame>
	)
}

/**
 * 7. Bundler Pipeline diagram.
 */
export function BundlerPipelineDiagram() {
	return (
		<DiagramFrame
			title="Solidity-to-TypeScript Build Pipeline"
			caption="Bundler plugins compile .sol files at build time and emit typed Contract modules with ABI, bytecode, and action creators."
			viewBox="0 0 760 180"
		>
			<rect x="16" y="34" width="152" height="110" rx="10" className="svg-box" />
			<text x="92" y="64" textAnchor="middle" className="svg-title">Counter.sol</text>
			<text x="92" y="86" textAnchor="middle" className="svg-sub">Local files</text>
			<text x="92" y="104" textAnchor="middle" className="svg-sub">node_modules/</text>
			<text x="92" y="122" textAnchor="middle" className="svg-sub">Foundry remappings</text>

			<line x1="168" y1="89" x2="206" y2="89" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />

			<rect x="210" y="24" width="176" height="130" rx="10" className="svg-box-accent" />
			<text x="298" y="50" textAnchor="middle" className="svg-title">Tevm Bundler</text>
			<text x="298" y="72" textAnchor="middle" className="svg-sub">Vite · Rollup · esbuild</text>
			<text x="298" y="90" textAnchor="middle" className="svg-sub">Webpack · Rspack · Bun</text>
			<line x1="230" y1="104" x2="366" y2="104" className="svg-divider" />
			<text x="298" y="122" textAnchor="middle" className="svg-mono-muted">solc + module cache</text>
			<text x="298" y="140" textAnchor="middle" className="svg-mono-muted">@tevm/ts-plugin (IDE)</text>

			<line x1="386" y1="89" x2="424" y2="89" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />

			<rect x="428" y="24" width="156" height="130" rx="10" className="svg-box-emerald" />
			<text x="506" y="50" textAnchor="middle" className="svg-title">Contract Module</text>
			<text x="506" y="74" textAnchor="middle" className="svg-mono-muted">Counter.abi</text>
			<text x="506" y="92" textAnchor="middle" className="svg-mono-muted">Counter.bytecode</text>
			<text x="506" y="110" textAnchor="middle" className="svg-mono-muted">Counter.read.*</text>
			<text x="506" y="128" textAnchor="middle" className="svg-mono-muted">Counter.write.*</text>
			<text x="506" y="146" textAnchor="middle" className="svg-mono-muted">Counter.deploy()</text>

			<line x1="584" y1="89" x2="620" y2="89" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="624" y="44" width="120" height="90" rx="10" className="svg-box" />
			<text x="684" y="78" textAnchor="middle" className="svg-title">Your Code</text>
			<text x="684" y="98" textAnchor="middle" className="svg-sub">tevmDeploy()</text>
			<text x="684" y="116" textAnchor="middle" className="svg-sub">readContract()</text>
		</DiagramFrame>
	)
}

/**
 * 8. Native Tracing Pipeline diagram (debug_traceCall).
 */
export function TracePipelineDiagram() {
	return (
		<DiagramFrame
			title="Native Opcode Tracing with debug_traceCall"
			caption="Guillotine Mini records pre-opcode stack, memory, gas, and returnData inside native code and returns a bounded structLogs array."
			viewBox="0 0 760 176"
		>
			<rect x="16" y="34" width="188" height="108" rx="10" className="svg-box" />
			<text x="110" y="60" textAnchor="middle" className="svg-mono">debug_traceCall</text>
			<text x="110" y="82" textAnchor="middle" className="svg-sub">call object + blockTag</text>
			<text x="110" y="100" textAnchor="middle" className="svg-mono-muted">enableMemory: true</text>
			<text x="110" y="116" textAnchor="middle" className="svg-mono-muted">enableReturnData: true</text>
			<text x="110" y="132" textAnchor="middle" className="svg-mono-muted">disableStack / Storage</text>

			<line x1="204" y1="88" x2="246" y2="88" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />

			<rect x="250" y="24" width="218" height="128" rx="10" className="svg-box-accent" />
			<text x="359" y="50" textAnchor="middle" className="svg-title">Guillotine Mini Tracer</text>
			<text x="359" y="72" textAnchor="middle" className="svg-sub">Snapshots before each opcode:</text>
			<text x="359" y="92" textAnchor="middle" className="svg-mono-muted">pc · op · gas · gasCost · depth</text>
			<text x="359" y="110" textAnchor="middle" className="svg-mono-muted">stack[] · memory[] · returnData</text>
			<rect x="276" y="122" width="166" height="20" rx="10" className="svg-pill-accent" />
			<text x="359" y="136" textAnchor="middle" className="svg-pill-text">Cap: 100,000 steps</text>

			<line x1="468" y1="88" x2="510" y2="88" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />

			<rect x="514" y="24" width="230" height="128" rx="10" className="svg-box-emerald" />
			<text x="629" y="50" textAnchor="middle" className="svg-title">Trace Payload</text>
			<text x="530" y="74" className="svg-mono-muted">gas: 21018</text>
			<text x="530" y="92" className="svg-mono-muted">failed: false</text>
			<text x="530" y="110" className="svg-mono-muted">returnValue: &quot;0x...2a&quot;</text>
			<text x="530" y="128" className="svg-mono-muted">truncated: false</text>
			<text x="530" y="144" className="svg-mono-muted">structLogs: [...]</text>
		</DiagramFrame>
	)
}

/**
 * 9. MCP Server Session Architecture diagram.
 */
export function McpLoopDiagram() {
	return (
		<DiagramFrame
			title="@tevm/mcp Session Architecture"
			caption="Each MCP session handle maps to its own isolated native ZEVM engine. Closing or expiring a session releases its native handle."
			viewBox="0 0 760 190"
		>
			<rect x="16" y="40" width="164" height="108" rx="10" className="svg-box" />
			<text x="98" y="76" textAnchor="middle" className="svg-title">AI Coding Agent</text>
			<text x="98" y="98" textAnchor="middle" className="svg-sub">Claude, Cursor,</text>
			<text x="98" y="116" textAnchor="middle" className="svg-sub">Codex, Antigravity</text>
			<text x="98" y="136" textAnchor="middle" className="svg-mono-muted">MCP over stdio</text>

			<line x1="180" y1="94" x2="228" y2="94" className="svg-line-accent" markerEnd="url(#tevm-arrow-accent)" />

			<rect x="232" y="24" width="232" height="140" rx="10" className="svg-box-accent" />
			<text x="348" y="50" textAnchor="middle" className="svg-title">@tevm/mcp Server</text>
			<text x="348" y="72" textAnchor="middle" className="svg-sub">14 Zod-validated EVM tools</text>
			<text x="348" y="94" textAnchor="middle" className="svg-mono-muted">evm_create_session / fork</text>
			<text x="348" y="112" textAnchor="middle" className="svg-mono-muted">evm_compile / deploy / call</text>
			<text x="348" y="130" textAnchor="middle" className="svg-mono-muted">evm_mine / trace_call</text>
			<text x="348" y="150" textAnchor="middle" className="svg-sub">SessionManager (TTL cleanup)</text>

			<line x1="464" y1="62" x2="520" y2="48" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
			<line x1="464" y1="94" x2="520" y2="94" className="svg-line-emerald" markerEnd="url(#tevm-arrow-emerald)" />
			<line x1="464" y1="126" x2="520" y2="140" className="svg-line-amber" markerEnd="url(#tevm-arrow-amber)" />

			<rect x="524" y="22" width="220" height="42" rx="8" className="svg-box-emerald" />
			<text x="634" y="40" textAnchor="middle" className="svg-label-sm">Session A (local · 31337)</text>
			<text x="634" y="56" textAnchor="middle" className="svg-mono-muted">isolated ZevmEngine</text>

			<rect x="524" y="74" width="220" height="42" rx="8" className="svg-box-emerald" />
			<text x="634" y="92" textAnchor="middle" className="svg-label-sm">Session B (fork · mainnet)</text>
			<text x="634" y="108" textAnchor="middle" className="svg-mono-muted">isolated ZevmEngine</text>

			<rect x="524" y="126" width="220" height="42" rx="8" className="svg-box-amber" />
			<text x="634" y="144" textAnchor="middle" className="svg-label-sm">solc Compiler</text>
			<text x="634" y="160" textAnchor="middle" className="svg-mono-muted">evm_compile_solidity</text>
		</DiagramFrame>
	)
}
