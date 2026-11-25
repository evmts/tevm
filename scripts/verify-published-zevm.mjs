#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// TEVM's server needs block filters, and deployments look up pending transactions
// by hash. Exercise the published platform binary before promoting or publishing.
/** @param {{rpc: (input: string) => string}} native */
export function verifyNativeRpc(native) {
	/** @param {string} method @param {unknown[]} [params] */
	const rpc = (method, params = []) => {
		const response = JSON.parse(native.rpc(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })))
		assert.ok(!response.error, `${method}: ${JSON.stringify(response.error)}`)
		return response.result
	}
	const filter = rpc('eth_newBlockFilter')
	assert.match(filter, /^0x[0-9a-f]+$/i)
	assert.equal(rpc('eth_uninstallFilter', [filter]), true)
	rpc('evm_setAutomine', [false])
	const [from, to] = rpc('eth_accounts')
	const hash = rpc('eth_sendTransaction', [{ from, to, value: '0x1', gas: '0x5208' }])
	assert.match(hash, /^0x[0-9a-f]{64}$/i)
	assert.equal(
		rpc('eth_getTransactionByHash', [hash])?.hash,
		hash,
		'eth_getTransactionByHash must return the pending transaction',
	)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
	const { version } = JSON.parse(readFileSync(new URL('../../zevm/npm/zevm/package.json', import.meta.url), 'utf8'))
	const scratch = mkdtempSync(join(tmpdir(), 'tevm-published-zevm-'))
	try {
		execFileSync(
			'npm',
			[
				'install',
				'--prefix',
				scratch,
				'--ignore-scripts',
				'--no-audit',
				'--no-fund',
				'--no-save',
				`@evmts/zevm@${version}`,
			],
			{ stdio: 'inherit' },
		)
		const entry = createRequire(join(scratch, 'package.json')).resolve('@evmts/zevm')
		// The package supports a local development override. Publication must load the installed binary.
		delete process.env.ZEVM_NATIVE_PATH
		const { NativeNode } = await import(pathToFileURL(entry).href)
		const native = new NativeNode()
		try {
			verifyNativeRpc(native)
			console.log(`Published @evmts/zevm@${version} passed TEVM block-filter and pending-transaction checks`)
		} finally {
			native.close()
		}
	} finally {
		rmSync(scratch, { recursive: true, force: true })
	}
}
