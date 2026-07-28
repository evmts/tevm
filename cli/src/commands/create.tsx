import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Box, Text } from 'ink'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { Creating } from '../components/Creating.js'
import { FancyCreateTitle } from '../components/FancyCreateTitle.js'
import { InteractivePrompt } from '../components/InteractivePrompt.js'
import RawOutput from '../components/RawOutput.js'
import type { State } from '../state/State.js'
import { useStore } from '../state/Store.js'
import { args } from '../utils/create-args.js'
import { options } from '../utils/create-options.js'
import { formatJsonFailure, formatJsonSuccess } from '../utils/output.js'

export { args, options }

type Props = {
	options: z.infer<typeof options>
	args: z.infer<typeof args>
}

// Add command description for help output
export const description = 'Create a new TEVM project\nExample: tevm create my-tevm-app --skip-prompts'

export default function Create({ options, args: [defaultName] }: Props) {
	const createdRef = useRef(false)
	const [creationError, setCreationError] = useState<Error>()
	const direct = options.skipPrompts || process.env['TEVM_JSON'] === 'true'

	// Initialize store with default values
	useEffect(() => {
		useStore.setState({
			name: defaultName,
			currentStep: 0,
			path: path.resolve(defaultName),
			nameInput: '',
			framework: options.template,
			useCase: 'ui',
			packageManager: 'npm',
			noGit: false,
			noInstall: false,
			currentPage: direct ? 'creating' : 'interactive',
			walletConnectProjectId: '',
		} satisfies State)
	}, [defaultName, direct, options.template])

	const store = useStore()
	const currentPage = direct && store.currentPage === 'interactive' ? 'creating' : store.currentPage

	useEffect(() => {
		if (store.currentPage !== 'creating' || createdRef.current) {
			return
		}

		createdRef.current = true

		try {
			const projectName = store.name || defaultName
			const packageName = path
				.basename(projectName)
				.toLowerCase()
				.replace(/[^a-z0-9._-]+/g, '-')
			const projectPath = path.resolve(projectName)
			const srcPath = path.join(projectPath, 'src')
			const writeIfMissing = (filePath: string, content: string) => {
				if (!existsSync(filePath)) {
					writeFileSync(filePath, content)
				}
			}

			mkdirSync(srcPath, { recursive: true })
			writeIfMissing(
				path.join(projectPath, 'package.json'),
				`${JSON.stringify(
					{
						name: packageName,
						type: 'module',
						scripts: {
							build: 'tevm generate contract',
						},
						dependencies: {
							tevm: 'latest',
							viem: 'latest',
						},
						devDependencies: {
							'@tevm/ts-plugin': 'latest',
							typescript: 'latest',
						},
					},
					null,
					2,
				)}
`,
			)
			writeIfMissing(
				path.join(projectPath, 'tsconfig.json'),
				`{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true,
    "plugins": [{ "name": "@tevm/ts-plugin" }]
  },
  "include": ["src"]
}
`,
			)
			writeIfMissing(
				path.join(srcPath, 'Counter.sol'),
				`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
`,
			)
			writeIfMissing(
				path.join(projectPath, 'README.md'),
				`# ${path.basename(projectName)}

Generated with Tevm.
`,
			)

			if (store.framework === 'foundry') {
				writeIfMissing(
					path.join(projectPath, 'foundry.toml'),
					`[profile.default]
src = "src"
out = "out"
libs = ["lib"]
`,
				)
			}

			useStore.setState({ path: projectPath, currentPage: 'complete' })
		} catch (error) {
			const normalized = error instanceof Error ? error : new Error(String(error))
			process.exitCode = 1
			setCreationError(normalized)
		}
	}, [defaultName, store.currentPage, store.framework, store.name])

	if (creationError) {
		return process.env['TEVM_JSON'] === 'true' ? (
			<RawOutput value={formatJsonFailure('create', creationError)} exitCode={1} />
		) : (
			<Text color="red">{creationError.message}</Text>
		)
	}

	const pages = {
		interactive: <InteractivePrompt defaultName={defaultName} store={store} />,
		creating: <Creating store={store} />,
		complete:
			process.env['TEVM_JSON'] === 'true' ? (
				<RawOutput value={formatJsonSuccess('create', { path: store.path })} />
			) : (
				<Text>Created {store.path}</Text>
			),
	}

	if (process.env['TEVM_JSON'] === 'true') {
		return pages[currentPage]
	}

	return (
		<Box display="flex" flexDirection="column">
			<FancyCreateTitle key={currentPage} loading={currentPage === 'creating'} />
			{pages[currentPage]}
		</Box>
	)
}
