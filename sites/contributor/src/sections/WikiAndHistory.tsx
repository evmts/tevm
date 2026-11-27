import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	SectionHeader,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@smthrs/ui'
import { ExternalTextLink } from '../components/ExternalAction'
import { sectionTitle } from '../components/sectionTitle'
import { factoryData } from '../data'

export const WikiAndHistory = () => {
	const { wiki, mythicalHistory } = factoryData

	return (
		<section className="tevm-section" id="wiki">
			<SectionHeader eyebrow="Living knowledge graph" title={sectionTitle(<h2>Obsidian wiki and mythical history</h2>)}>
				<p>
					Every subsystem is documented in an Obsidian-compatible wiki verified for citation freshness, paired with a
					clean from-scratch mythical history of how TEVM is built.
				</p>
			</SectionHeader>

			<Tabs defaultValue="wiki" className="tevm-factory-tabs">
				<TabsList aria-label="Knowledge views">
					<TabsTrigger value="wiki" count={wiki.length}>
						Engineering Wiki
					</TabsTrigger>
					<TabsTrigger value="mythical" count={mythicalHistory.length}>
						Mythical History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="wiki">
					<div className="tevm-guided__grid">
						{wiki.map((page) => (
							<Card key={page.id}>
								<CardHeader>
									<div>
										<CardTitle>{page.title}</CardTitle>
										<CardDescription>{page.purpose}</CardDescription>
									</div>
									<Badge variant="outline">{page.id}</Badge>
								</CardHeader>
								<CardContent>
									<div className="tevm-wiki-links">
										{page.related.map((rel) => (
											<Badge variant="muted" key={rel}>
												[[{rel}]]
											</Badge>
										))}
									</div>
									<p className="tevm-target-detail__note">
										<ExternalTextLink href={page.url}>Read {page.document} on Smithers Cloud</ExternalTextLink>
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="mythical">
					<div className="tevm-mythical-list">
						{mythicalHistory.map((epic) => (
							<Card key={epic.id}>
								<CardHeader>
									<div>
										<CardTitle>{epic.title}</CardTitle>
										<CardDescription>{epic.summary}</CardDescription>
									</div>
									<Badge variant="outline">{epic.chapters.length} chapters</Badge>
								</CardHeader>
								<CardContent>
									<ul className="tevm-mythical-chapters">
										{epic.chapters.map((chapter) => (
											<li key={chapter.id}>
												<strong>{chapter.title}</strong>
												<p className="tevm-mythical-chapters__desc">{chapter.notes}</p>
												<div className="tevm-wiki-links">
													{chapter.paths.map((p) => (
														<code key={p}>{p}</code>
													))}
													{chapter.provenanceCommits.map((sha) => (
														<Badge variant="muted" key={sha}>
															{sha}
														</Badge>
													))}
												</div>
											</li>
										))}
									</ul>
									{epic.abandonedExperiments.length > 0 ? (
										<div className="tevm-mythical-notes">
											<strong>Retained notes on superseded experiments</strong>
											<ul>
												{epic.abandonedExperiments.map((note) => (
													<li key={note}>{note}</li>
												))}
											</ul>
										</div>
									) : null}
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</section>
	)
}
