import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CodeBlock,
	RowButton,
	SectionHeader,
	StatusPill,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@smthrs/ui'
import { useState } from 'react'
import { sectionTitle } from '../components/sectionTitle'
import { entriesForGroup, factoryData, type PluginGroup, targetCommand } from '../data'

const GroupPanel = ({ group }: { group: PluginGroup }) => {
	const entries = entriesForGroup(group.id)
	const [selectedId, setSelectedId] = useState(entries[0]?.id ?? '')
	const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0]

	if (!selected) return <p>No targets are configured for this group.</p>

	return (
		<div className="tevm-target-browser">
			<div className="tevm-target-list">
				{entries.map((entry) => (
					<RowButton active={entry.id === selected.id} key={entry.id} onClick={() => setSelectedId(entry.id)}>
						<span className="tevm-target-row__copy">
							<strong>{entry.title}</strong>
							<code>{entry.label}</code>
						</span>
						<span className="tevm-target-row__badges">
							{entry.agentic ? <Badge>agentic</Badge> : <Badge variant="muted">deterministic</Badge>}
						</span>
					</RowButton>
				))}
			</div>

			<Card className="tevm-target-detail">
				<CardHeader>
					<div>
						<CardTitle>{selected.title}</CardTitle>
						<CardDescription>{selected.summary}</CardDescription>
					</div>
					<div className="tevm-target-detail__status">
						<StatusPill
							status={selected.agentic ? 'active' : 'skipped'}
							label={selected.agentic ? 'agentic' : 'deterministic'}
							withDot={false}
						/>
						{selected.approval ? <StatusPill status="waiting-approval" label="approval" withDot={false} /> : null}
					</div>
				</CardHeader>
				<CardContent>
					<CodeBlock code={targetCommand(selected)} language="shell" defaultWrap />
					<p className="tevm-target-detail__note">
						Open this repository in the local Smithers desktop to run the same entry from <code>.smithers/UI.json</code>
						.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}

export const FactoryDeck = () => (
	<section className="tevm-section" id="factory">
		<SectionHeader eyebrow="Executable repository map" title={sectionTitle(<h2>Run the factory deliberately</h2>)}>
			<p>
				Deterministic targets are cheap; agentic lanes read only the relevant diff and stay inside declared write sets.
			</p>
		</SectionHeader>

		<Tabs defaultValue={factoryData.plugin.groups[0]?.id ?? 'checks'} className="tevm-factory-tabs">
			<TabsList aria-label="Factory target groups">
				{factoryData.plugin.groups.map((group) => (
					<TabsTrigger value={group.id} count={entriesForGroup(group.id).length} key={group.id}>
						{group.title}
					</TabsTrigger>
				))}
			</TabsList>
			{factoryData.plugin.groups.map((group) => (
				<TabsContent value={group.id} key={group.id}>
					<GroupPanel group={group} />
				</TabsContent>
			))}
		</Tabs>

		<div className="tevm-guided" id="recipes">
			<SectionHeader eyebrow="Parameterized agent lanes" title={sectionTitle(<h3>Guided codegen and repair</h3>)}>
				<p>Copy a command, replace its explicit inputs, inspect its plan, then choose whether to run it.</p>
			</SectionHeader>
			<div className="tevm-guided__grid">
				{factoryData.guidedWorkflows.map((workflow) => (
					<Card className="tevm-guided-card" key={workflow.id}>
						<CardHeader>
							<div>
								<CardTitle>{workflow.title}</CardTitle>
								<CardDescription>{workflow.summary}</CardDescription>
							</div>
							{workflow.approval ? <Badge variant="warning">approval input</Badge> : <Badge>Agent.Diff</Badge>}
						</CardHeader>
						<CardContent>
							<code className="tevm-guided-card__label">{workflow.label}</code>
							<CodeBlock code={workflow.command} language="shell" defaultWrap />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	</section>
)
