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
		'//.github/ISSUE_TEMPLATE/*.yml',
		'//sites/contributor/src/generated/factory-data.json',
	]),
})

const policyLint = S.Shell.Test({
	bin: S.Runtime.bin,
	args: ['scripts/factory/check-policy.mjs'],
	data: [policy, issueForms, conventions, scripts],
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

const check = S.Suite({
	tests: [
		policyLint,
		queueLint,
		issueIntakeTest,
		changesetCandidateTest,
		labelsTest,
		declarationsTypecheck,
		shellScopeLint,
		repositoryMetadataLint,
		sourceIntegrity,
		contributorDataLint,
	],
})

export const Package = S.Package({
	targets: {
		check,
		conventions,
		contributorDataInputs,
		contributorDataLint,
		contributorDataWrite,
		declarations,
		declarationsTypecheck,
		issueForms,
		issueIntakeTest,
		changesetCandidateTest,
		labelsTest,
		policy,
		policyLint,
		preflight,
		queue,
		queueLint,
		repositoryMetadataLint,
		repositoryMetadataWrite,
		shellScopeLint,
		sourceIntegrity,
		scripts,
	},
})
