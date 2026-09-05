const S = Smithers

type BuildAttrs = Parameters<typeof S.Shell.Build>[0]
type TestAttrs = Parameters<typeof S.Shell.Test>[0]
type RunAttrs = Parameters<typeof S.Shell.Run>[0]
type ServeAttrs = Parameters<typeof S.Shell.Serve>[0]
type DiffAttrs = Parameters<typeof S.Shell.Diff>[0]

type AttrRecord = Record<string, unknown>
type ToolRecord = {
	readonly _tag?: string
	readonly bin?: string
	readonly name?: string
	readonly package?: string
	readonly spec?: string
}

const executableName = (tool: ToolRecord): string | undefined => {
	switch (tool._tag) {
		case 'NodeModuleBin':
			return tool.bin ?? tool.package?.split('/').at(-1)
		case 'HostBin':
		case 'MiseBin':
		case 'NixBin':
			return tool.name
		case 'RuntimeBin':
			return 'node'
		case 'CargoBin':
			return 'cargo'
		case 'GoBin':
			return 'go'
		default:
			return undefined
	}
}

const scope = <Attrs>(directory: string, attrs: Attrs): Attrs => {
	if (!/^[A-Za-z0-9._/-]+$/.test(directory) || directory.startsWith('/') || directory.includes('..')) {
		throw new TypeError(`invalid package shell directory: ${directory}`)
	}
	const record = attrs as AttrRecord
	if (typeof record.command === 'string') {
		return { ...record, command: `cd -- '${directory}' && ${record.command}` } as Attrs
	}
	if (typeof record.bun === 'string') {
		return { ...record, bun: `process.chdir(${JSON.stringify(directory)})\n${record.bun}` } as Attrs
	}
	if (record.script !== undefined) {
		throw new TypeError(`scoped Shell.script is unsupported in ${directory}; use a root-relative script declaration`)
	}
	const tool = record.bin as ToolRecord | undefined
	if (tool?._tag === 'PackageManagerBin') {
		return {
			...record,
			args: ['--dir', directory, ...((record.args as ReadonlyArray<unknown> | undefined) ?? [])],
		} as Attrs
	}
	if (tool?._tag === 'RuntimeNpx') {
		return {
			...record,
			bin: S.PackageManager.bin,
			args: ['--dir', directory, 'dlx', tool.spec, ...((record.args as ReadonlyArray<unknown> | undefined) ?? [])],
		} as Attrs
	}
	const executable = tool === undefined ? undefined : executableName(tool)
	if (executable === undefined)
		throw new TypeError(`unsupported scoped shell executable in ${directory}: ${tool?._tag}`)
	return {
		...record,
		bin: S.PackageManager.bin,
		args: ['--dir', directory, 'exec', executable, ...((record.args as ReadonlyArray<unknown> | undefined) ?? [])],
	} as Attrs
}

/**
 * Shell flavors whose processes explicitly enter a package directory.
 * Package-mode Flows otherwise starts every Shell target at the workspace
 * root, regardless of the PACKAGE.ts file that declared it.
 */
export const scopedShell = (directory: string) => ({
	Build: (attrs: BuildAttrs) => S.Shell.Build(scope(directory, attrs)),
	Diff: (attrs: DiffAttrs) => S.Shell.Diff(scope(directory, attrs)),
	Run: (attrs: RunAttrs) => S.Shell.Run(scope(directory, attrs)),
	Serve: (attrs: ServeAttrs) => S.Shell.Serve(scope(directory, attrs)),
	Test: (attrs: TestAttrs) => S.Shell.Test(scope(directory, attrs)),
})
