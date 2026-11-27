const OPCODES = new Map([
	[0x00, 'STOP'],
	[0x01, 'ADD'],
	[0x02, 'MUL'],
	[0x03, 'SUB'],
	[0x04, 'DIV'],
	[0x05, 'SDIV'],
	[0x06, 'MOD'],
	[0x07, 'SMOD'],
	[0x08, 'ADDMOD'],
	[0x09, 'MULMOD'],
	[0x0a, 'EXP'],
	[0x0b, 'SIGNEXTEND'],
	[0x10, 'LT'],
	[0x11, 'GT'],
	[0x12, 'SLT'],
	[0x13, 'SGT'],
	[0x14, 'EQ'],
	[0x15, 'ISZERO'],
	[0x16, 'AND'],
	[0x17, 'OR'],
	[0x18, 'XOR'],
	[0x19, 'NOT'],
	[0x1a, 'BYTE'],
	[0x1b, 'SHL'],
	[0x1c, 'SHR'],
	[0x1d, 'SAR'],
	[0x20, 'KECCAK256'],
	[0x30, 'ADDRESS'],
	[0x31, 'BALANCE'],
	[0x32, 'ORIGIN'],
	[0x33, 'CALLER'],
	[0x34, 'CALLVALUE'],
	[0x35, 'CALLDATALOAD'],
	[0x36, 'CALLDATASIZE'],
	[0x37, 'CALLDATACOPY'],
	[0x38, 'CODESIZE'],
	[0x39, 'CODECOPY'],
	[0x3a, 'GASPRICE'],
	[0x3b, 'EXTCODESIZE'],
	[0x3c, 'EXTCODECOPY'],
	[0x3d, 'RETURNDATASIZE'],
	[0x3e, 'RETURNDATACOPY'],
	[0x3f, 'EXTCODEHASH'],
	[0x40, 'BLOCKHASH'],
	[0x41, 'COINBASE'],
	[0x42, 'TIMESTAMP'],
	[0x43, 'NUMBER'],
	[0x44, 'PREVRANDAO'],
	[0x45, 'GASLIMIT'],
	[0x46, 'CHAINID'],
	[0x47, 'SELFBALANCE'],
	[0x48, 'BASEFEE'],
	[0x49, 'BLOBHASH'],
	[0x4a, 'BLOBBASEFEE'],
	[0x50, 'POP'],
	[0x51, 'MLOAD'],
	[0x52, 'MSTORE'],
	[0x53, 'MSTORE8'],
	[0x54, 'SLOAD'],
	[0x55, 'SSTORE'],
	[0x56, 'JUMP'],
	[0x57, 'JUMPI'],
	[0x58, 'PC'],
	[0x59, 'MSIZE'],
	[0x5a, 'GAS'],
	[0x5b, 'JUMPDEST'],
	[0x5c, 'TLOAD'],
	[0x5d, 'TSTORE'],
	[0x5e, 'MCOPY'],
	[0x5f, 'PUSH0'],
	[0xa0, 'LOG0'],
	[0xa1, 'LOG1'],
	[0xa2, 'LOG2'],
	[0xa3, 'LOG3'],
	[0xa4, 'LOG4'],
	[0xf0, 'CREATE'],
	[0xf1, 'CALL'],
	[0xf2, 'CALLCODE'],
	[0xf3, 'RETURN'],
	[0xf4, 'DELEGATECALL'],
	[0xf5, 'CREATE2'],
	[0xfa, 'STATICCALL'],
	[0xfd, 'REVERT'],
	[0xfe, 'INVALID'],
	[0xff, 'SELFDESTRUCT'],
])

function opcodeName(byte) {
	if (byte >= 0x60 && byte <= 0x7f) return `PUSH${byte - 0x5f}`
	if (byte >= 0x80 && byte <= 0x8f) return `DUP${byte - 0x7f}`
	if (byte >= 0x90 && byte <= 0x9f) return `SWAP${byte - 0x8f}`
	return OPCODES.get(byte) ?? `0x${byte.toString(16).padStart(2, '0')}`
}

function disassemble(runtimeHex, gasLimit) {
	const raw = runtimeHex.startsWith('0x') ? runtimeHex.slice(2) : runtimeHex
	const bytes = Buffer.from(raw, 'hex')
	const steps = []
	let pc = 0
	let remaining = gasLimit
	while (pc < bytes.length && steps.length < 256) {
		const byte = bytes[pc]
		const op = opcodeName(byte)
		const gasCost =
			byte === 0x55 ? 20000 : byte === 0x54 ? 2100 : byte === 0x00 || byte === 0xf3 || byte === 0xfd ? 0 : 3
		steps.push({ pc, op, gas: Math.max(0, remaining), gasCost, depth: 1 })
		remaining = Math.max(0, remaining - gasCost)
		pc += byte >= 0x60 && byte <= 0x7f ? 1 + (byte - 0x5f) : 1
	}
	return { steps, truncated: pc < bytes.length }
}

async function traceOrFallback(rpc, call, gas, to) {
	try {
		return {
			traceMode: 'structLogs',
			...summarize(await rpc('debug_traceCall', [call, 'latest', { disableStack: true, disableStorage: true }])),
		}
	} catch (error) {
		if (error?.code !== -32601) throw error
	}
	const runtimeCode = await rpc('eth_getCode', [to, 'latest'])
	const { steps, truncated } = disassemble(typeof runtimeCode === 'string' ? runtimeCode : '0x', gas)
	let returnValue = '0x'
	let failed = false
	let gasUsed = 21_000
	try {
		const [res, estimated] = await Promise.all([
			rpc('eth_call', [call, 'latest']),
			rpc('eth_estimateGas', [call]).catch(() => null),
		])
		returnValue = typeof res === 'string' ? res : '0x'
		if (typeof estimated === 'string' && /^0x[0-9a-f]+$/i.test(estimated)) {
			gasUsed = Number(BigInt(estimated))
		}
	} catch (error) {
		if (error?.code === 3) {
			failed = true
			returnValue = typeof error?.data === 'string' ? error.data : '0x'
		} else {
			throw error
		}
	}
	return { traceMode: 'disassembly', gasUsed, failed, returnValue, truncated, steps }
}

async function run({ method, bytecode, calldata, gas }) {
	const { createMemoryClient } = await import('../../packages/memory-client/dist/index.js')
	const client = createMemoryClient()
	const rpc = (rpcMethod, params) => client.transport.tevm.request({ method: rpcMethod, params })
	try {
		const limit = BigInt(gas)
		const deployment = method === 'deploy' ? await client.tevmDeploy({ bytecode, gas: limit }) : null
		const to = deployment?.createdAddress ?? address
		if (method === 'deploy' && deployment?.createdAddress === undefined) {
			throw new PlaygroundError('Contract creation failed')
		}
		if (deployment === null) {
			await client.tevmSetAccount({ address, deployedBytecode: bytecode })
		}
		const call = { to, data: calldata, gas: `0x${gas.toString(16)}` }
		const trace = await traceOrFallback(rpc, call, gas, to)
		return deployment === null ? trace : { address: to, deploymentGasUsed: deployment.receipt?.gasUsed, ...trace }
	} finally {
		await client.tevmClose()
	}
}

const maxGas = 250_000
const address = '0x0000000000000000000000000000000000000123'
const methods = new Set(['call', 'deploy'])
const hex = /^0x(?:[0-9a-f]{2})*$/i

class PlaygroundError extends Error {}

function request(input) {
	if (input === null || typeof input !== 'object' || !methods.has(input.method)) {
		throw new PlaygroundError('Choose a supported operation')
	}
	const { method, bytecode = '0x', calldata = '0x', gas = 100_000 } = input
	if (typeof bytecode !== 'string' || bytecode.length > 4098 || !hex.test(bytecode)) {
		throw new PlaygroundError('Enter up to 2048 bytes of hex bytecode')
	}
	if (typeof calldata !== 'string' || calldata.length > 2050 || !hex.test(calldata)) {
		throw new PlaygroundError('Enter up to 1024 bytes of hex calldata')
	}
	if (!Number.isSafeInteger(gas) || gas < 21_000 || gas > maxGas) {
		throw new PlaygroundError('Set a gas limit between 21000 and 250000')
	}
	return { method, bytecode, calldata, gas }
}

function summarize(trace) {
	if (!Array.isArray(trace?.structLogs)) throw new PlaygroundError('Trace unavailable')
	return {
		gasUsed: trace.gas,
		failed: trace.failed,
		returnValue: trace.returnValue,
		truncated: trace.truncated === true || trace.structLogs.length > 256,
		steps: trace.structLogs.slice(0, 256).map(({ pc, op, gas, gasCost, depth }) => ({
			pc,
			op,
			gas,
			gasCost,
			depth,
		})),
	}
}

let response
try {
	const [raw, extra] = process.argv.slice(2)
	if (typeof raw !== 'string' || raw.length > 8192 || extra !== undefined) {
		throw new PlaygroundError('Send one JSON request of up to 8192 characters')
	}
	let input
	try {
		input = JSON.parse(raw)
	} catch {
		throw new PlaygroundError('Enter valid JSON')
	}
	response = await run(request(input))
} catch (error) {
	response = { error: error instanceof PlaygroundError ? error.message : 'Execution unavailable' }
}
console.log(JSON.stringify(response))
