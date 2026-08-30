#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { assert, command, readJson, readPolicy, repositoryRoot } from './lib.mjs'

const policy = await readPolicy()
const schema = await readJson(resolve(repositoryRoot, 'factory/schemas/issue-intake.schema.json'))
const planSchema = await readJson(resolve(repositoryRoot, 'factory/schemas/issue-plan.schema.json'))
const packageJson = await readJson(resolve(repositoryRoot, 'package.json'))
const workspace = await readFile(resolve(repositoryRoot, 'WORKSPACE.ts'), 'utf8')
const smithersTypes = await readFile(resolve(repositoryRoot, 'smithers.d.ts'), 'utf8')
const labels = await readFile(resolve(repositoryRoot, '.github/labels.yml'), 'utf8')
const gitmodules = await readFile(resolve(repositoryRoot, '.gitmodules'), 'utf8')
const miseConfig = await readFile(resolve(repositoryRoot, 'mise.toml'), 'utf8')
const configureWorkflow = await readFile(resolve(repositoryRoot, '.github/workflows/factory-configure.yml'), 'utf8')
const intakeWorkflow = await readFile(resolve(repositoryRoot, '.github/workflows/factory-intake.yml'), 'utf8')
const issueWorkflow = await readFile(resolve(repositoryRoot, '.github/workflows/factory-issue.yml'), 'utf8')

assert(policy.schemaVersion === 1, 'factory/policy.json must use schemaVersion 1')
assert(/^[0-9a-f]{40}$/.test(policy.toolchain.flows.revision), 'Flows revision must be a full Git SHA')
assert(/^[0-9a-f]{40}$/.test(policy.toolchain.zevm.revision), 'Zevm revision must be a full Git SHA')
assert(packageJson.packageManager === `pnpm@${policy.toolchain.pnpm}`, 'policy pnpm version must match packageManager')
assert(
	packageJson.devDependencies?.['@smthrs/build-cli'] === `link:${policy.toolchain.flows.localPath}/packages/build-cli`,
	'@smthrs/build-cli must resolve through the vendored Flows submodule',
)
assert(
	packageJson.devDependencies?.['@smthrs/targets'] === `link:${policy.toolchain.flows.localPath}/packages/targets`,
	'@smthrs/targets must resolve through the vendored Flows submodule',
)
assert(
	packageJson.scripts?.postinstall === 'node scripts/factory/build-vendored.mjs',
	'pnpm install must build the vendored Flows and zevm sources through postinstall',
)
assert(
	workspace.includes("S.Mise({ config: S.file('//mise.toml') })"),
	'WORKSPACE.ts must declare mise.toml as the S.Mise layer',
)
for (const tool of ['bun', 'foundry']) {
	assert(new RegExp(`^${tool}\\s*=\\s*"[^"]+"`, 'm').test(miseConfig), `mise.toml must pin ${tool}`)
}
assert(
	workspace.includes(`model: '${policy.toolchain.models.implementation}'`),
	'implementation model drifted from policy',
)
assert(workspace.includes(`model: '${policy.toolchain.models.review}'`), 'review model drifted from policy')
assert(!smithersTypes.includes('declare module'), 'smithers.d.ts must not mask the linked local package types')
// The repository index pins each vendored checkout; policy.json restates the
// SHA so the factory can name it without git. The two must agree, and the
// submodule must point at the repository policy names.
for (const checkout of [policy.toolchain.flows, policy.toolchain.zevm]) {
	assert(
		gitmodules.includes(`path = ${checkout.localPath}\n\turl = ${checkout.repository}`),
		`${checkout.localPath} must be a .gitmodules entry for ${checkout.repository}`,
	)
	const gitlink = /^160000 ([0-9a-f]{40}) 0\t/.exec(
		command('git', ['ls-files', '--stage', '--', checkout.localPath]),
	)?.[1]
	assert(
		gitlink === checkout.revision,
		`${checkout.localPath} gitlink ${gitlink} drifted from policy ${checkout.revision}`,
	)
}

assert(intakeWorkflow.includes('permissions:\n  contents: read\n  issues: read'), 'intake must remain read-only')
assert(intakeWorkflow.includes('persist-credentials: false'), 'intake checkout must not persist repository credentials')
assert(
	configureWorkflow.includes('environment: factory-admin'),
	'configuration writes must use the factory-admin environment',
)
assert(
	configureWorkflow.includes('persist-credentials: false'),
	'configuration checkout must not persist repository credentials',
)
assert(configureWorkflow.includes('issues: write'), 'label configuration needs explicit issues write permission')

const [candidateWorkflow, settlementWorkflow] = issueWorkflow.split('\n  settle:')
assert(settlementWorkflow, 'factory issue workflow must retain a distinct settlement job')
assert(
	candidateWorkflow.includes('environment: factory-candidate'),
	'candidate must use the factory-candidate environment',
)
assert(
	candidateWorkflow.includes('persist-credentials: false'),
	'candidate checkout must not persist repository credentials',
)
assert(!candidateWorkflow.includes('GH_TOKEN'), 'candidate must not receive a GitHub write token')
assert(
	candidateWorkflow.includes(`github.event.label.name == '${policy.issues.approvalLabel}'`),
	'candidate label drifted from policy',
)
assert(
	candidateWorkflow.includes(`--input approval=${policy.issues.approvalLabel}`),
	'candidate approval literal drifted from policy',
)
assert(candidateWorkflow.includes('issue-to-pr)'), 'factory workflow must retain its implementation route')
assert(
	candidateWorkflow.includes('issue-to-plan|conformance-triage)'),
	'factory workflow must retain plan-first routes',
)
assert(candidateWorkflow.includes('//workflows/issue-triage:triageIssue'), 'plan-first routes must use governed triage')
assert(
	settlementWorkflow.includes('environment: factory-approval'),
	'settlement must use the protected approval environment',
)
assert(settlementWorkflow.includes('contents: write'), 'settlement needs explicit contents write permission')
assert(settlementWorkflow.includes('pull-requests: write'), 'settlement needs explicit pull-request write permission')

const uniqueTypes = new Set(policy.issues.types)
assert(uniqueTypes.size === policy.issues.types.length, 'issue types must be unique')
assert(Object.keys(policy.issues.routes).length === uniqueTypes.size, 'every issue type must have exactly one route')

const schemaTypes = schema.properties.type.enum.filter((type) => type !== 'unknown').sort()
assert(
	JSON.stringify(schemaTypes) === JSON.stringify([...uniqueTypes].sort()),
	'intake schema issue types drifted from policy',
)
assert(
	JSON.stringify([...planSchema.properties.type.enum].sort()) === JSON.stringify([...uniqueTypes].sort()),
	'issue-plan schema types drifted from policy',
)
assert(labels.includes(`name: ${policy.issues.approvalLabel}`), 'approval label is missing from .github/labels.yml')
for (const label of policy.issues.pauseLabels) {
	assert(labels.includes(`name: ${label}`), `pause label ${label} is missing from .github/labels.yml`)
}

for (const type of policy.issues.types) {
	const templatePath = resolve(repositoryRoot, `.github/ISSUE_TEMPLATE/${type}.yml`)
	await access(templatePath)
	const template = await readFile(templatePath, 'utf8')
	assert(template.includes(`- type:${type}`), `${type} issue form must apply type:${type}`)
	for (const heading of [...policy.issues.requiredHeadings.all, ...(policy.issues.requiredHeadings[type] ?? [])]) {
		assert(template.includes(`label: ${heading}`), `${type} issue form is missing the ${heading} field`)
	}
}

for (const path of [
	'AGENTS.md',
	'CONTRIBUTING.md',
	'SECURITY.md',
	'factory/README.md',
	'tsconfig.factory.json',
	'.github/workflows/factory-configure.yml',
	'.smithers/UI.json',
	'sites/contributor/PACKAGE.ts',
	'sites/contributor/src/generated/factory-data.json',
	'workflows/issue-triage/PACKAGE.ts',
	'workflows/issue-to-pr/PACKAGE.ts',
]) {
	await access(resolve(repositoryRoot, path))
}

console.log(
	`factory policy ok: ${policy.issues.types.length} issue routes, ${Object.keys(policy.gates).length} gate sets`,
)
