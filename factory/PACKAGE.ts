/// <reference path="../smithers.d.ts" />
const S = Smithers

const policy = S.Filegroup({
	srcs: S.glob(['policy.json', 'policy.schema.json', 'schemas/**']),
})

const issueForms = S.Filegroup({
	srcs: S.glob(['//.github/ISSUE_TEMPLATE/**', '//.github/labels.yml']),
})

const conventions = S.Filegroup({
	srcs: S.glob(['//AGENTS.md', '//CONTRIBUTING.md', '//SECURITY.md', '//.smithers/UI.json', 'README.md']),
})

const scripts = S.Filegroup({
	srcs: S.glob(['//scripts/factory/**']),
})

const declarations = S.Filegroup({
	srcs: S.glob([
		'//WORKSPACE.ts',
		'//PACKAGE.ts',
		'//**/PACKAGE.ts',
		'//factory/bench.ts',
		'//factory/scoped-shell.ts',
		'//smithers.d.ts',
		'//tsconfig.factory.json',
	]),
})

const queue = S.Filegroup({
	srcs: S.glob(['queue/**']),
})

const repositoryMetadataInputs = S.Filegroup({
	srcs: S.glob(['//**/package.json', '//.github/workflows/*.yml', '//.github/workflows/*.yaml']),
})

const contributorDataInputs = S.Filegroup({
	srcs: S.glob([
		'//.smithers/UI.json',
		'//.smithers/factory.json',
		'//.smithers/home.json',
		'//.smithers/coding-project.json',
		'//.smithers/history/mythical.json',
		'//.agents/uphill/lighthouse-snapshot.json',
		'//.github/ISSUE_TEMPLATE/*.yml',
		'//sites/contributor/src/generated/factory-data.json',
	]),
})

const smithersCloudInputs = S.Filegroup({
	srcs: S.glob([
		'//.smithers/FACTORY.ts',
		'//.smithers/factory.json',
		'//.smithers/home.json',
		'//.smithers/coding-project.json',
		'//.smithers/workflows/**',
		'//.smithers/flows/**',
		'//.smithers/wiki/**',
		'//.smithers/history/**',
		'//.smithers/playground/**',
	]),
})

const docsLlmsInputs = S.Filegroup({
	srcs: S.glob(['//docs/node/pages/**', '//docs/node/public/llms.txt']),
})

const policyLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/check-policy.mjs'],
	data: [policy, issueForms, conventions, scripts, S.file('//.github/workflows/factory-issue.yml')],
})

const queueLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/queue-lint.mjs'],
	data: [queue, scripts],
})

const issueIntakeTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/issue-intake.test.mjs'],
	data: [policy, scripts],
})

const changesetCandidateTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/changeset-candidate.test.mjs'],
	data: [scripts],
})

const conformanceCorpusTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/fetch-conformance-corpus.test.mjs'],
	data: [scripts],
})

const nativeAddonStampTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/native-addon-stamp.test.mjs'],
	data: [scripts],
})

const labelsTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/labels.mjs'],
	data: [issueForms, scripts],
})

const declarationsTypecheck = S.Shell.Test({
	bin: S.NodeModule.Bin('typescript', 'tsc'),
	args: ['-p', 'tsconfig.factory.json', '--pretty', 'false'],
	data: [declarations],
})

const shellScopeLint = S.Shell.Test({
	command: 'node --test scripts/factory/scope-declarations.test.mjs && node scripts/factory/scope-declarations.mjs',
	data: [declarations, scripts],
})

// PR #2091 was an 85-manifest provenance repair after the repository rename.
// Keep that invariant deterministic and offer the same one-rule codegen sweep.
const repositoryMetadataLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/repository-metadata.mjs'],
	data: [repositoryMetadataInputs, scripts],
})

const repositoryMetadataWrite = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['scripts/factory/repository-metadata.mjs', '--write'],
	data: [repositoryMetadataInputs, scripts],
	changes: ['package.json', '**/package.json', '.github/workflows/*.yml', '.github/workflows/*.yaml'],
})

// PR #1971 accumulated conflict markers in generated docs and PR #1822
// removed an accidental gitlink. Both are deterministic source-integrity
// failures and do not need an agent seat.
const sourceIntegrity = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/source-integrity.mjs'],
	data: [S.gitDiff(), scripts],
})

// The portal consumes policy, issue-form, and local Smithers-plugin facts as
// one checked-in deterministic artifact. This keeps contributor calls to
// action aligned with the executable factory instead of hand-copying labels
// and target names into React.
const contributorDataLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/contributor-data.mjs'],
	data: [policy, conventions, contributorDataInputs, scripts],
})

const contributorDataWrite = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['scripts/factory/contributor-data.mjs', '--write'],
	data: [policy, conventions, contributorDataInputs, scripts],
	changes: ['sites/contributor/src/generated/factory-data.json'],
})

// This is intentionally a Run target: preflight observes host tools and
// sibling checkouts, so caching it as a source-only test would be dishonest.
const preflight = S.Shell.Run({
	bin: S.Runtime.bin,
	args: ['scripts/factory/preflight.mjs', '--mode', 'core'],
	data: [policy, scripts, S.file('//package.json'), S.file('//.nvmrc')],
})

const projectionLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/project-factory.mjs'],
	data: [smithersCloudInputs, policy, scripts],
})

const projectionWrite = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['scripts/factory/project-factory.mjs', '--write'],
	data: [smithersCloudInputs, policy, scripts],
	changes: ['.smithers/factory.json', '.smithers/home.json'],
})

const trustBoundaryTest = S.Shell.Test({
	command: 'node --test scripts/factory/trust-boundary.test.mjs && node scripts/factory/trust-boundary.mjs',
	data: [policy, smithersCloudInputs, repositoryMetadataInputs, S.file('//WORKSPACE.ts'), scripts],
})

const sandboxAuthTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/sandbox-auth.test.mjs'],
	data: [policy, scripts],
})

const cloudWorkflowsTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/verify-cloud-workflows.test.mjs'],
	data: [smithersCloudInputs, scripts],
})

const wikiAndHistoryTest = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['--test', 'scripts/factory/wiki-and-history.test.mjs'],
	data: [smithersCloudInputs, scripts],
})

const llmsTxtLint = S.Shell.Test({
	command: 'node scripts/factory/generate-llms-txt.mjs && node --test scripts/factory/emit-docs-markdown.test.mjs',
	data: [docsLlmsInputs, smithersCloudInputs, scripts],
})

const llmsTxtWrite = S.Shell.Diff({
	bin: S.Runtime.bin,
	args: ['scripts/factory/generate-llms-txt.mjs', '--write'],
	data: [docsLlmsInputs, scripts],
	changes: ['docs/node/public/llms.txt'],
})

const check = S.Suite({
	tests: [
		policyLint,
		queueLint,
		issueIntakeTest,
		changesetCandidateTest,
		conformanceCorpusTest,
		nativeAddonStampTest,
		labelsTest,
		declarationsTypecheck,
		shellScopeLint,
		repositoryMetadataLint,
		sourceIntegrity,
		contributorDataLint,
		projectionLint,
		trustBoundaryTest,
		sandboxAuthTest,
		cloudWorkflowsTest,
		wikiAndHistoryTest,
		llmsTxtLint,
	],
})

export const Package = S.Package({
	targets: {
		check,
		cloudWorkflowsTest,
		conventions,
		contributorDataInputs,
		contributorDataLint,
		contributorDataWrite,
		declarations,
		declarationsTypecheck,
		docsLlmsInputs,
		issueForms,
		issueIntakeTest,
		changesetCandidateTest,
		conformanceCorpusTest,
		nativeAddonStampTest,
		labelsTest,
		llmsTxtLint,
		llmsTxtWrite,
		policy,
		policyLint,
		preflight,
		projectionLint,
		projectionWrite,
		queue,
		queueLint,
		repositoryMetadataLint,
		repositoryMetadataWrite,
		sandboxAuthTest,
		shellScopeLint,
		smithersCloudInputs,
		sourceIntegrity,
		scripts,
		trustBoundaryTest,
		wikiAndHistoryTest,
	},
})
