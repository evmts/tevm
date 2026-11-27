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
import { sectionTitle } from '../components/sectionTitle'
import { factoryData, type LighthouseCategory, scoreBand, type ViewerRole } from '../data'

const CIRCUMFERENCE = 2 * Math.PI * 40

const LighthouseGauge = ({ category }: { category: LighthouseCategory }) => {
	const band = scoreBand(category.score)
	const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, category.score)) / 100)
	return (
		<div
			className={`lh-gauge lh-gauge--${band}`}
			role="img"
			aria-label={`${category.title}: ${category.score} out of 100`}
		>
			<div className="lh-gauge__ring">
				<svg viewBox="0 0 100 100" aria-hidden="true">
					<circle className="lh-gauge__track" cx="50" cy="50" r="40" />
					<circle
						className="lh-gauge__arc"
						cx="50"
						cy="50"
						r="40"
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={offset}
						transform="rotate(-90 50 50)"
					/>
				</svg>
				<span className="lh-gauge__score">{category.score}</span>
			</div>
			<strong className="lh-gauge__label">{category.title}</strong>
			<span className="lh-gauge__sub">{category.metrics.length} audits</span>
		</div>
	)
}

export const LighthouseAudit = ({ role }: { role: ViewerRole }) => {
	const { lighthouse } = factoryData

	return (
		<section className="tevm-section" id="audit">
			<SectionHeader
				eyebrow="Backpressure audit report"
				title={sectionTitle(<h2>Lighthouse quality and trust gauges</h2>)}
			>
				<p>
					Continuous Uphill scoring replaces opaque CI logs with four measurable Lighthouse categories. Every pull
					request compares directly against baseline so quality only climbs.
				</p>
			</SectionHeader>

			<Card className="lh-report">
				<CardHeader>
					<div>
						<CardTitle>TEVM Backpressure Score: {lighthouse.overallScore} / 100</CardTitle>
						<CardDescription>
							Generated from committed Uphill metrics across Footprint, Quality, Architecture, and Factory Trust.
						</CardDescription>
					</div>
					<StatusPill status={lighthouse.overallScore >= 90 ? 'ready' : 'active'} label="uphill verified" />
				</CardHeader>
				<CardContent>
					<div className="lh-gauges" role="list" aria-label="Lighthouse category scores">
						{lighthouse.categories.map((category) => (
							<div role="listitem" key={category.id}>
								<LighthouseGauge category={category} />
							</div>
						))}
					</div>

					<div className="lh-scale" role="note" aria-label="Score band legend">
						<span className="lh-scale__item">
							<i className="lh-dot lh-dot--poor" /> 0-49 Poor
						</span>
						<span className="lh-scale__item">
							<i className="lh-dot lh-dot--average" /> 50-89 Needs improvement
						</span>
						<span className="lh-scale__item">
							<i className="lh-dot lh-dot--good" /> 90-100 Good
						</span>
					</div>

					<Tabs defaultValue={lighthouse.categories[0]?.id ?? 'factory'} className="tevm-factory-tabs">
						<TabsList aria-label="Audit categories">
							{lighthouse.categories.map((category) => (
								<TabsTrigger value={category.id} count={category.score} key={category.id}>
									{category.title}
								</TabsTrigger>
							))}
						</TabsList>
						{lighthouse.categories.map((category) => (
							<TabsContent value={category.id} key={category.id}>
								<p className="lh-category-desc">{category.description}</p>
								<ul className="lh-metrics-list">
									{category.metrics.map((metric) => {
										const band = scoreBand(metric.score)
										return (
											<li className="lh-metric-row" key={metric.id}>
												<div className="lh-metric-row__main">
													<span className={`lh-chip lh-chip--${band}`}>{metric.score}</span>
													<div>
														<strong>{metric.title}</strong>
														<p className="lh-metric-row__desc">{metric.description}</p>
													</div>
												</div>
												<div className="lh-metric-row__meta">
													<Badge variant="outline">
														{metric.passed}/{metric.total} pass
													</Badge>
													{metric.weight > 1 ? <Badge variant="muted">weight {metric.weight}x</Badge> : null}
												</div>
											</li>
										)
									})}
								</ul>
							</TabsContent>
						))}
					</Tabs>

					{lighthouse.opportunities.length > 0 ? (
						<div className="lh-opportunities">
							<h3 className="lh-opportunities__title">Top score opportunities</h3>
							<ul>
								{lighthouse.opportunities.map((opp, idx) => (
									<li key={`${opp.category}-${opp.metric}-${opp.item ?? idx}`}>
										<span className="lh-gain">+{opp.gain} pts</span>
										<strong>
											{opp.category} / {opp.metric}
										</strong>
										<span>
											{opp.item ? `${opp.item} ` : `${opp.items} items `}({String(opp.value)} → {String(opp.target)})
										</span>
									</li>
								))}
							</ul>
						</div>
					) : null}

					{role !== 'viewer' ? (
						<div className="lh-run-box">
							<p>Run the exact same Lighthouse audit locally before opening a Change:</p>
							<CodeBlock code={factoryData.commands.uphill} language="shell" defaultWrap />
						</div>
					) : null}
				</CardContent>
			</Card>
		</section>
	)
}
