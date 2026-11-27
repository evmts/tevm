import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CodeBlock,
	SectionHeader,
	StatusPill,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@smthrs/ui'
import { ExternalTextLink } from '../components/ExternalAction'
import { sectionTitle } from '../components/sectionTitle'
import { factoryData, type ViewerRole } from '../data'

export const McpAndTrust = ({ role }: { role: ViewerRole }) => {
	const { repository, trust, commands, cloud } = factoryData
	const cursorConfig = JSON.stringify({ mcpServers: { tevm: { url: repository.mcpUrl } } }, null, 2)

	return (
		<section className="tevm-section" id="mcp">
			<SectionHeader
				eyebrow="Public MCP and execution trust"
				title={sectionTitle(<h2>Attach your agent, share the cache safely</h2>)}
			>
				<p>
					Every agent interacts with TEVM through the authenticated Smithers Cloud MCP server to create issues, TODOs,
					artifacts, and PRs. Untrusted runs are welcomed with read-only object store hits and can never poison the
					cache or skip gates.
				</p>
			</SectionHeader>

			<div className="tevm-trust-grid">
				<Card>
					<CardHeader>
						<div>
							<CardTitle>Trusted execution (Sandboxes &amp; Maintainers)</CardTitle>
							<CardDescription>Accepted for cache writes, gate attestations, and automated merges.</CardDescription>
						</div>
						<StatusPill status="ready" label="trusted" />
					</CardHeader>
					<CardContent>
						<ul className="tevm-trust-list">
							<li>
								<strong>Allowed executors:</strong> {trust.acceptExecutionFrom.join(', ')} (
								{trust.maintainers.join(', ')})
							</li>
							<li>
								<strong>Shared object store:</strong> Read + Write on{' '}
								<ExternalTextLink href={repository.objectStoreUrl}>{repository.objectStoreUrl}</ExternalTextLink>
							</li>
							<li>
								<strong>Sandbox auth:</strong> Single-use attenuated credentials (<code>jti</code> replay-checked, short
								TTL, zero host secret leakage)
							</li>
							<li>
								<strong>Merge automation:</strong> Merging to <code>main</code> mirrors to GitHub and triggers releases,
								docs + <code>llms.txt</code> publishing, and wiki refresh
							</li>
						</ul>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div>
							<CardTitle>Untrusted execution (External Contributors)</CardTitle>
							<CardDescription>Encouraged for fast local and fork verification without trust risk.</CardDescription>
						</div>
						<StatusPill status="active" label="read-only cache" />
					</CardHeader>
					<CardContent>
						<ul className="tevm-trust-list">
							<li>
								<strong>Untrusted runs encouraged:</strong> {trust.allowUntrustedExecution ? 'Yes' : 'No'} (run any
								build, test, or Uphill audit locally or in a fork)
							</li>
							<li>
								<strong>Shared cache hits:</strong> Read-only access enabled so contributors reuse warm ZEVM and package
								builds immediately
							</li>
							<li>
								<strong>Cache poisoning blocked:</strong> Write tokens (<code>SMITHERS_CACHE_WRITE_TOKEN</code>) are
								never exposed to fork PRs or untrusted runs
							</li>
							<li>
								<strong>Gate integrity:</strong> Untrusted results never skip maintainer review or sandboxed gates
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card className="tevm-mcp-card">
				<CardHeader>
					<div>
						<CardTitle>Connect Your Own Agent (BYOA via OAuth 2.1 + PKCE)</CardTitle>
						<CardDescription>
							Public MCP endpoint: <code>{repository.mcpUrl}</code> ({cloud.flowCount} flows, {cloud.triggerCount}{' '}
							triggers)
						</CardDescription>
					</div>
					<Badge variant="outline">OAuth 2.1 · Streamable HTTP</Badge>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="claude" className="tevm-factory-tabs">
						<TabsList aria-label="MCP client setup">
							<TabsTrigger value="claude">Claude Code</TabsTrigger>
							<TabsTrigger value="codex">Codex CLI</TabsTrigger>
							<TabsTrigger value="agy">Antigravity</TabsTrigger>
							<TabsTrigger value="cursor">Cursor</TabsTrigger>
							{role === 'maintainer' ? <TabsTrigger value="sandbox">One-Time Sandbox Auth</TabsTrigger> : null}
						</TabsList>
						<TabsContent value="claude">
							<CodeBlock code={commands.mcpClaude} language="shell" defaultWrap />
						</TabsContent>
						<TabsContent value="codex">
							<CodeBlock code={commands.mcpCodex} language="shell" defaultWrap />
						</TabsContent>
						<TabsContent value="agy">
							<CodeBlock code={commands.mcpAntigravity} language="shell" defaultWrap />
						</TabsContent>
						<TabsContent value="cursor">
							<CodeBlock code={cursorConfig} language="json" defaultWrap />
						</TabsContent>
						{role === 'maintainer' ? (
							<TabsContent value="sandbox">
								<p className="tevm-target-detail__note">
									Mint a single-use, replay-protected sandbox credential (reads signing key from{' '}
									<code>SMITHERS_SANDBOX_AUTH_SECRET</code> or a <code>0600</code> file, never argv):
								</p>
								<CodeBlock code={commands.sandboxAuthMint} language="shell" defaultWrap />
							</TabsContent>
						) : null}
					</Tabs>
				</CardContent>
			</Card>
		</section>
	)
}
