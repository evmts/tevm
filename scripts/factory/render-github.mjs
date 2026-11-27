import * as github from '@smthrs/build-cli/GithubRender'
import { discover } from '@smthrs/build-cli/PackageDiscovery'
import { PackageIndex } from '@smthrs/build-cli/PackageIndex'
import { load } from '@smthrs/build-cli/PackageLoader'
import { Smithers } from '@smthrs/targets'
import { metadata } from '@smthrs/targets/Target'

globalThis.Smithers = Smithers
const root = process.cwd()
const index = PackageIndex.make(await load(await discover(root)))
const rows = index.targets().filter(({ packagePath }) => packagePath === '.github')
const generator = rows.find(({ key }) => key === 'github')
const { args, changes } = metadata(generator.target).attrs
const spec = Smithers.Github.CiGen({
	workflows: rows.filter(({ target }) => metadata(target).target === 'Github.Workflow').map(({ target }) => target),
	preserve: args.slice(1),
	changes,
})
const rendered = github.render({
	ciGen: spec,
	packageDir: '.github',
	workspace: { ...index.workspace, runtime: Smithers.Runtime.Node({ manifest: Smithers.file('//.nvmrc') }) },
	resolve: {
		labelOf: (target) => (target === spec ? generator.label : index.labelOf(target)),
		targets: () => index.targets(),
	},
})

// Replace the pinned renderer’s cache step until Github.Setup supports step env.
// Refuse an unfamiliar layout so a renderer upgrade cannot silently drop later steps.
const action = rendered.files.find(({ path }) => path === 'actions/setup/action.yml')
const cacheStep =
	/ {4}- run: \|\n {8}if \[ -n "\$\{\{ inputs\.cache-url \}\}" \]; then\n(?: {10}echo [^\n]+\n)+ {8}fi\n {6}shell: bash\n$/
if (!cacheStep.test(action.content)) throw new Error('Unexpected Github.Setup cache step')
action.content = action.content.replace(
	cacheStep,
	() => `    - shell: bash
      env:
        CACHE_URL: \${{ inputs.cache-url }}
        CACHE_TOKEN: \${{ inputs.cache-token }}
      run: |
        CACHE_URL="\${CACHE_URL:-https://build.smithers.sh}"
        [[ "$CACHE_URL$CACHE_TOKEN" != *$'\\n'* && "$CACHE_URL$CACHE_TOKEN" != *$'\\r'* ]] || exit 1
        printf 'SMITHERS_CACHE_URL=%s\\n' "$CACHE_URL" >> "$GITHUB_ENV"
        if [[ -n "$CACHE_TOKEN" ]]; then
          printf 'SMITHERS_CACHE_TOKEN=%s\\n' "$CACHE_TOKEN" >> "$GITHUB_ENV"
        fi
`,
)
if (process.argv.includes('--check')) {
	const report = await github.check(root, rendered)
	if (!report.clean)
		throw new Error(JSON.stringify(report.entries.filter((entry) => !['clean', 'preserved'].includes(entry.status))))
	console.log(`${rendered.files.length} generated GitHub files match the declarations`)
} else {
	const report = await github.write(root, rendered)
	console.log(`Wrote ${report.wrote.length} generated GitHub files`)
}
