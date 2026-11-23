import { afterEach, describe, expect, it } from 'vitest'
import { compileSolidity } from './compileSolidity.js'
import { createSessionManager } from './createSessionManager.js'
import { executeTool } from './executeTool.js'
import { toJsonValue } from './toJsonValue.js'
import { toolDefinitions } from './toolDefinitions.js'
import { toolSchemas } from './toolSchemas.js'

describe('@tevm/mcp edge cases and error paths', () => {
	const openSessions: Array<{ sessions: ReturnType<typeof createSessionManager>; handle: string }> = []

	afterEach(async () => {
		while (openSessions.length > 0) {
			const entry = openSessions.pop()
			if (entry) await entry.sessions.close(entry.handle)
		}
	})

	it('serializes Uint8Array, Set, Map, and Error values in toJsonValue', () => {
		const cause = new Error('root cause')
		const wrapped = new Error('outer failure', { cause })
		const plainError = new Error('plain failure')

		expect(toJsonValue(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('0xdeadbeef')
		expect(toJsonValue(new Set([1n, 2n]))).toEqual(['1', '2'])
		expect(toJsonValue(new Map([['a', 42n]]))).toEqual({ a: '42' })
		expect(toJsonValue(wrapped)).toEqual({
			name: 'Error',
			message: 'outer failure',
			cause: { name: 'Error', message: 'root cause' },
		})
		expect(toJsonValue(plainError)).toEqual({
			name: 'Error',
			message: 'plain failure',
		})
	})

	it('reports compilation errors, empty outputs, missing contract names, and abstract contracts', () => {
		expect(() => compileSolidity({ source: 'contract Broken { function f( }' })).toThrow(/Solidity compilation failed/)
		expect(() => compileSolidity({ source: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;' })).toThrow(
			/produced no contracts/,
		)
		expect(() =>
			compileSolidity({
				source: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0; contract Foo {}',
				contractName: 'Bar',
			}),
		).toThrow(/Contract "Bar" was not found/)
		expect(() =>
			compileSolidity({
				source: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0; interface IFoo { function x() external; }',
				contractName: 'IFoo',
			}),
		).toThrow(/has no deployable bytecode/)

		const compiled = compileSolidity({
			source: 'pragma solidity ^0.8.0; contract Unoptimized { uint256 public v = 1; }',
			optimize: false,
		})
		expect(compiled.contractName).toBe('Unoptimized')
		expect(compiled.warnings.length).toBeGreaterThan(0)
	})

	it('rejects invalid tool schema inputs', () => {
		const session = crypto.randomUUID()
		const address = '0x0000000000000000000000000000000000000123'

		expect(() => toolSchemas.evm_fork_chain.parse({ url: 'ftp://example.com' })).toThrow(/http or https/)
		expect(() => toolSchemas.evm_call_contract.parse({ session, address })).toThrow(/Provide abi or signature/)
		expect(() => toolSchemas.evm_deploy_contract.parse({ session })).toThrow(/Provide bytecode or Solidity source/)
		expect(() => toolSchemas.evm_set_account.parse({ session, address })).toThrow(/at least one state field/)
		expect(() =>
			toolSchemas.evm_get_block.parse({
				session,
				blockNumber: '0',
				blockHash: `0x${'00'.repeat(32)}`,
			}),
		).toThrow(/only one of blockNumber or blockHash/)
		expect(() => toolSchemas.evm_trace_call.parse({ session, address })).toThrow(/Provide data, abi, or signature/)
		for (const invalid of ['0x', '0xzz', `0x${'00'.repeat(33)}`]) {
			expect(() => toolSchemas.evm_get_account.parse({ session, address, storageSlot: invalid })).toThrow(
				/1 to 32 bytes/,
			)
			expect(() => toolSchemas.evm_set_account.parse({ session, address, storage: { '0x00': invalid } })).toThrow(
				/1 to 32 bytes/,
			)
			expect(() => toolSchemas.evm_set_account.parse({ session, address, storage: { [invalid]: '0x01' } })).toThrow()
		}
		expect(toolDefinitions.length).toBe(Object.keys(toolSchemas).length)
	})

	it('exercises executeTool error handling, tuple/array coercion, blockHash lookup, interval mining, and trace truncation', async () => {
		const sessions = createSessionManager()
		await expect(executeTool('evm_nonexistent_tool', {}, sessions)).rejects.toThrow(/Unknown tool:/)

		const created = (await executeTool('evm_create_session', {}, sessions)) as { handle: string }
		const session = created.handle
		openSessions.push({ sessions, handle: session })

		const source = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Helper {
	struct Pair { uint256 a; uint256 b; }
	function sumPair(Pair memory p, uint256[] memory xs) external pure returns (uint256) {
		uint256 total = p.a + p.b;
		for (uint256 i = 0; i < xs.length; i++) {
			total += xs[i];
		}
		return total;
	}
	error Denied();
	function overload() external pure returns (uint) { return 0; }
	function overload(Pair[] memory pairs) external pure returns (uint) { return pairs[0].a + pairs[0].b; }
	function choose(uint256) external pure returns (uint) { return 1; }
	function choose(string memory) external pure returns (uint) { return 2; }
	function deny() external pure { revert Denied(); }
	function failRaw() external pure {
		assembly {
			mstore(0, 0xdeadbeef)
			revert(28, 4)
		}
	}
}`
		const deployed = (await executeTool(
			'evm_deploy_contract',
			{ session, source, contractName: 'Helper' },
			sessions,
		)) as { contractAddress: string; abi: Array<Record<string, unknown>> }
		await executeTool('evm_mine', { session, blockCount: 1 }, sessions)

		// Ambiguous multi-function ABI without functionName
		await expect(
			executeTool('evm_call_contract', { session, address: deployed.contractAddress, abi: deployed.abi }, sessions),
		).rejects.toThrow(/functionName is required/)

		// Missing function name in ABI
		await expect(
			executeTool(
				'evm_call_contract',
				{ session, address: deployed.contractAddress, abi: deployed.abi, functionName: 'doesNotExist' },
				sessions,
			),
		).rejects.toThrow(/was not found in the supplied ABI/)

		// Tuple and array ABI string-integer coercion
		const sumRes = (await executeTool(
			'evm_call_contract',
			{
				session,
				address: deployed.contractAddress,
				abi: deployed.abi,
				functionName: 'sumPair',
				args: [
					['10', '20'],
					['3', '4'],
				],
			},
			sessions,
		)) as { decodedOutput: string }
		expect(sumRes.decodedOutput).toBe('37')

		const target = { session, address: deployed.contractAddress, abi: deployed.abi }
		expect(
			await executeTool(
				'evm_call_contract',
				{ ...target, functionName: 'overload', args: [[{ b: '5', a: '9007199254740993' }]] },
				sessions,
			),
		).toMatchObject({ decodedOutput: '9007199254740998' })
		await expect(executeTool('evm_call_contract', { ...target, functionName: 'deny' }, sessions)).rejects.toThrow(
			'Denied',
		)
		expect(await executeTool('evm_trace_call', { ...target, functionName: 'deny' }, sessions)).toMatchObject({
			failed: true,
			revertReason: 'Denied',
		})

		expect(
			await executeTool('evm_call_contract', { ...target, functionName: 'choose', args: ['word'] }, sessions),
		).toMatchObject({ decodedOutput: '2' })
		await expect(
			executeTool('evm_call_contract', { ...target, functionName: 'choose', args: ['123'] }, sessions),
		).rejects.toThrow(/ambiguous overload/i)
		expect(
			await executeTool('evm_call_contract', { ...target, signature: 'choose(uint256)', args: ['123'] }, sessions),
		).toMatchObject({ decodedOutput: '1' })

		// Trace truncation + undecodable raw 4-byte revert payload
		const traceRes = (await executeTool(
			'evm_trace_call',
			{
				session,
				address: deployed.contractAddress,
				abi: deployed.abi,
				functionName: 'failRaw',
				maxSteps: 10,
			},
			sessions,
		)) as { failed: boolean; revertReason?: string; returnedSteps: number; totalSteps: number; truncation?: unknown }
		expect(traceRes.failed).toBe(true)
		expect(traceRes.revertReason).toBeUndefined()
		expect(traceRes.returnedSteps).toBeLessThanOrEqual(10)
		if (traceRes.totalSteps > 10) {
			expect(traceRes.truncation).toBeDefined()
		}

		// Mine with explicit intervalSeconds & fetch block by blockHash
		const mined = (await executeTool('evm_mine', { session, blockCount: 1, intervalSeconds: 5 }, sessions)) as {
			blockNumber: string
		}
		const byNumber = (await executeTool('evm_get_block', { session, blockNumber: mined.blockNumber }, sessions)) as {
			hash: string
			number: string
		}
		const byHash = (await executeTool('evm_get_block', { session, blockHash: byNumber.hash }, sessions)) as {
			hash: string
			number: string
		}
		expect(byHash.hash).toBe(byNumber.hash)
		expect(byHash.number).toBe(byNumber.number)

		await executeTool('evm_close_session', { session }, sessions)
	})
})
