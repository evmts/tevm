import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runPromise, runSync } from 'effect/Effect'
import { afterAll, beforeAll, bench, describe } from 'vitest'
import { moduleFactory } from '../src/index.js'
import { resolveImports } from '../src/resolveImports.js'

const benchOpts = { time: 200, warmupTime: 50, warmupIterations: 5, throws: true }

const fao = {
	readFileSync,
	readFile: (p: string, enc: BufferEncoding) => readFile(p, { encoding: enc }),
	existsSync,
	exists: async (p: string) => existsSync(p),
}

let tempDir: string
let entryPath: string
let entryCode: string

beforeAll(() => {
	tempDir = mkdtempSync(join(tmpdir(), 'tevm-resolutions-bench-'))
	writeFileSync(
		join(tempDir, 'Base.sol'),
		`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Base { uint256 public value; }
`,
	)
	writeFileSync(
		join(tempDir, 'Ownable.sol'),
		`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./Base.sol";
contract Ownable is Base { address public owner; }
`,
	)
	entryCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
/* multi-line
 * comment with import "./Fake.sol";
 */
import "./Base.sol";
import "./Ownable.sol";
contract Token is Ownable {
	mapping(address => uint256) public balances;
}
`
	entryPath = join(tempDir, 'Token.sol')
	writeFileSync(entryPath, entryCode)
})

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true })
})

describe('@tevm/resolutions', () => {
	bench(
		'resolveImports (sync, 2 relative imports)',
		() => {
			const res = runSync(resolveImports(entryPath, entryCode, {}, [], true))
			if (res.length !== 2) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'moduleFactory (sync, 3-file dependency graph)',
		() => {
			const mods = runSync(moduleFactory(entryPath, entryCode, {}, [], fao, true))
			if (mods.size !== 3) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'moduleFactory (async, 3-file dependency graph)',
		async () => {
			const mods = await runPromise(moduleFactory(entryPath, entryCode, {}, [], fao, false))
			if (mods.size !== 3) throw new Error('unexpected')
		},
		benchOpts,
	)
})
