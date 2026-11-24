// Bun preloads this file for every `bun` process started at the repository root
// (bunfig.toml). The Smithers MDX plugin exists only after `.smithers/` has its own
// install, which CI jobs and fresh clones do not have. Skip the plugin there instead
// of failing every Bun command, including the Claude review action.
try {
	const { mdxPlugin } = await import('./.smithers/node_modules/smithers-orchestrator/src/index.js')
	mdxPlugin()
} catch (error) {
	if ((error as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND') throw error
}
