import { createMemoryClient, PREFUNDED_ACCOUNTS } from 'tevm'
import { describe, expect, it } from 'vitest'

describe('debugger UI documentation', () => {
	it('collects stable display data through the public onStep hook', async () => {
		const client = createMemoryClient()
		const contract = '0x4444444444444444444444444444444444444444'

		await client.tevmSetAccount({
			address: contract,
			deployedBytecode: '0x6001600055',
		})

		const steps: Array<{
			pc: number
			opcode: string
			gasLeft: bigint
			depth: number
			stack: bigint[]
		}> = []

		const result = await client.tevmCall({
			from: PREFUNDED_ACCOUNTS[0].address,
			to: contract,
			createTrace: true,
			throwOnFail: false,
			onStep(step, next) {
				steps.push({
					pc: step.pc,
					opcode: step.opcode.name,
					gasLeft: step.gasLeft,
					depth: step.depth,
					stack: Array.from(step.stack),
				})
				next?.()
			},
		})

		expect(result.errors).toBeUndefined()
		expect(result.executionGasUsed).toBeGreaterThan(0n)
		expect(steps.map(({ opcode }) => opcode)).toEqual(['PUSH1', 'PUSH1', 'SSTORE'])
	})

	it('returns the documented serializable trace fields', async () => {
		const client = createMemoryClient()
		const contract = '0x4444444444444444444444444444444444444444'

		await client.tevmSetAccount({
			address: contract,
			deployedBytecode: '0x6001600055',
		})

		const result = await client.tevmCall({
			from: PREFUNDED_ACCOUNTS[0].address,
			to: contract,
			createTrace: true,
		})
		const first = result.trace?.structLogs[0]

		expect(first).toMatchObject({
			pc: 0,
			op: 'PUSH1',
			depth: 0,
		})
		expect(typeof first?.gas).toBe('bigint')
		expect(typeof first?.gasCost).toBe('bigint')
		expect(first?.stack).toEqual([])
	})
})
