import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import manifest from '../package.json' with { type: 'json' }
import { createMcpServer } from './createMcpServer.js'

describe('Tevm MCP stdio protocol', () => {
	const client = new Client({ name: 'tevm-mcp-test', version: '1.0.0' })

	beforeAll(async () => {
		await client.connect(
			new StdioClientTransport({
				command: process.execPath,
				args: [fileURLToPath(new URL('./cli.js', import.meta.url))],
				env: { ...(process.env.ZEVM_NATIVE_PATH ? { ZEVM_NATIVE_PATH: process.env.ZEVM_NATIVE_PATH } : {}) },
				stderr: 'pipe',
			}),
		)
	})

	afterAll(async () => {
		await client.close()
	})

	it('lists tools and drives a real EVM tool through MCP', async () => {
		expect(client.getServerVersion()?.version).toBe(manifest.version)
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

it('drops session handles when the MCP transport disconnects', async () => {
	const server = createMcpServer({ maximumSessions: 1 })
	const connect = async () => {
		const client = new Client({ name: 'test', version: '1' })
		const [local, remote] = InMemoryTransport.createLinkedPair()
		await server.connect(remote)
		await client.connect(local)
		return client
	}
	const first = await connect()
	const created = await first.callTool({ name: 'evm_create_session', arguments: {} })
	const handle = created.structuredContent?.handle
	await first.close()
	const next = await connect()
	try {
		const response = await next.callTool({ name: 'evm_close_session', arguments: { session: handle } })
		expect(response.structuredContent).toEqual({ closed: false })
		expect((await next.callTool({ name: 'evm_create_session', arguments: {} })).isError).not.toBe(true)
	} finally {
		await next.close()
	}
})
