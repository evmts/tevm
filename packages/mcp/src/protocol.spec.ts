import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Tevm MCP stdio protocol', () => {
	const client = new Client({ name: 'tevm-mcp-test', version: '1.0.0' })

	beforeAll(async () => {
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: ['src/cli.js'],
				cwd: process.cwd(),
				stderr: 'pipe',
			}),
		)
	})

	afterAll(async () => {
		await client.close()
	})

	it('lists tools and drives a real EVM tool through MCP', async () => {
		const listed = await client.listTools()
		expect(listed.tools.some((tool) => tool.name === 'evm_create_session')).toBe(true)

		const response = await client.callTool({ name: 'evm_create_session', arguments: {} })
		expect(response.isError).not.toBe(true)
		expect(response.content[0]).toMatchObject({ type: 'text' })
		const payload = JSON.parse((response.content[0] as { type: 'text'; text: string }).text)
		expect(payload.handle).toMatch(/^[0-9a-f-]{36}$/)
		expect(payload.chainId).toBe(31337)
		expect(payload.blockNumber).toBe('0')
	})

	it('returns schema errors as MCP tool errors', async () => {
		const response = await client.callTool({
			name: 'evm_get_account',
			arguments: { session: 'bad', address: 'bad' },
		})
		expect(response.isError).toBe(true)
		expect((response.content[0] as { type: 'text'; text: string }).text).toMatch(/Invalid|uuid/i)
	})
})
