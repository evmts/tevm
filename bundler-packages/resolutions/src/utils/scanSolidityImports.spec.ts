import { describe, expect, it } from 'vitest'
import { scanSolidityImports } from './scanSolidityImports.js'

const paths = (code: string) => scanSolidityImports(code).map((i) => i.path)

describe('scanSolidityImports', () => {
	it('finds an import after a line comment that opens a block comment', () => {
		expect(paths('// /*\nimport "./A.sol";')).toEqual(['./A.sol'])
	})

	it('ends a line comment at a lone carriage return', () => {
		expect(paths('// import "Hidden.sol";\rimport "Visible.sol";')).toEqual(['Visible.sol'])
	})

	it('decodes Solidity escapes while retaining source offsets', () => {
		const raw = String.raw`./\x41\u0042/\xC3\xA9/\\u0043/it\'s\".sol`
		const code = `import '${raw}';`
		expect(scanSolidityImports(code)).toEqual([{ path: `./AB/é/\\u0043/it's".sol`, start: 8, end: 8 + raw.length }])
	})

	it.each(['\n', '\r\n', '\r'])('decodes a UTF-8 path split by a line continuation (%j)', (eol) => {
		expect(paths(`import "\\xC3\\${eol}\\xA9.sol";`)).toEqual(['é.sol'])
	})

	it('finds multiple imports on one line', () => {
		expect(paths('import "./A.sol"; import \'./B.sol\';import {C} from "./C.sol";')).toEqual([
			'./A.sol',
			'./B.sol',
			'./C.sol',
		])
	})

	it('finds an import after a pragma on the same line', () => {
		expect(paths('pragma solidity ^0.8.0; import "./A.sol";')).toEqual(['./A.sol'])
	})

	it('parses every import form', () => {
		const code = [
			'import * as X from "./Star.sol";',
			'import { A, B as C } from "./Named.sol";',
			'import "./Alias.sol" as Y;',
			'import\n  {\n    D\n  }\n  from\n  "./Multiline.sol";',
			'import /* "./NotThis.sol" */ "./Commented.sol";',
		].join('\n')
		expect(paths(code)).toEqual(['./Star.sol', './Named.sol', './Alias.sol', './Multiline.sol', './Commented.sol'])
	})

	it('ignores imports inside comments and strings', () => {
		const code = [
			'// import "./Line.sol";',
			'/* import "./Block.sol";',
			'import "./StillBlock.sol"; */',
			'string constant s = "import \\"./String.sol\\";";',
			"string constant t = 'it\\'s import \"./Single.sol\";';",
			'contract importer { uint256 importCount; }',
			'import "./Real.sol";',
		].join('\n')
		expect(paths(code)).toEqual(['./Real.sol'])
	})

	it('keeps quotes of the other kind inside the path', () => {
		expect(paths(`import "./it's/A.sol";`)).toEqual(["./it's/A.sol"])
	})

	it('reports offsets into the original source', () => {
		const code = '/* x */ import "./A.sol";'
		const [found] = scanSolidityImports(code)
		expect(code.slice(found?.start, found?.end)).toBe('./A.sol')
	})

	it('returns an empty path for an empty import string', () => {
		expect(paths('import {X} from "";')).toEqual([''])
	})
})

describe('scanSolidityImports without semicolons', () => {
	it('does not merge consecutive imports that lack a semicolon', () => {
		expect(paths('import { A } from "./A.sol"\nimport { B } from "./B.sol"\n')).toEqual(['./A.sol', './B.sol'])
	})
})
