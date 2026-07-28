#!/usr/bin/env node

import { startMcpServer } from './startMcpServer.js'

startMcpServer().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
