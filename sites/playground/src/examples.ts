/**
 * The prebuilt playground examples.
 *
 * Each `code` string is a COMPLETE runnable TypeScript file — imports included —
 * so the copy button yields something that works when pasted into a fresh
 * project with `tevm@1.0.0-rc.151` and `viem` installed.
 *
 * The Solidity shown for local examples is precompiled (solc 0.8.28) and the
 * resulting bytecode is embedded in the TS. In-browser solc compilation is not
 * part of this first version.
 */

export const COUNTER_SOLIDITY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Counter {
    uint256 public count;
    event Incremented(address indexed by, uint256 newCount);

    function increment() public {
        count += 1;
        emit Incremented(msg.sender, count);
    }

    function setCount(uint256 newCount) public {
        require(newCount > count, "Counter: new count must be greater than current");
        count = newCount;
        emit Incremented(msg.sender, newCount);
    }
}`

const USDC_SOLIDITY = `// The fork examples run against the REAL, already-deployed
// mainnet USDC contract (0xA0b8...eB48) — nothing to compile.
// This is the interface the TypeScript talks to:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}`

const COUNTER_ABI = `[
	{ type: 'function', name: 'count', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
	{ type: 'function', name: 'increment', inputs: [], outputs: [], stateMutability: 'nonpayable' },
	{ type: 'function', name: 'setCount', inputs: [{ name: 'newCount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
	{ type: 'event', name: 'Incremented', inputs: [{ name: 'by', type: 'address', indexed: true }, { name: 'newCount', type: 'uint256', indexed: false }] },
] as const`

const COUNTER_BYTECODE =
	'0x6080604052348015600e575f5ffd5b5061034d8061001c5f395ff3fe608060405234801561000f575f5ffd5b506004361061003f575f3560e01c806306661abd14610043578063d09de08a14610061578063d14e62b81461006b575b5f5ffd5b61004b610087565b60405161005891906101a7565b60405180910390f35b61006961008c565b005b610085600480360381019061008091906101ee565b6100f5565b005b5f5481565b60015f5f82825461009d9190610246565b925050819055503373ffffffffffffffffffffffffffffffffffffffff167f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa54205f546040516100eb91906101a7565b60405180910390a2565b5f548111610138576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012f906102f9565b60405180910390fd5b805f819055503373ffffffffffffffffffffffffffffffffffffffff167f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa54208260405161018491906101a7565b60405180910390a250565b5f819050919050565b6101a18161018f565b82525050565b5f6020820190506101ba5f830184610198565b92915050565b5f5ffd5b6101cd8161018f565b81146101d7575f5ffd5b50565b5f813590506101e8816101c4565b92915050565b5f60208284031215610203576102026101c0565b5b5f610210848285016101da565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6102508261018f565b915061025b8361018f565b925082820190508082111561027357610272610219565b5b92915050565b5f82825260208201905092915050565b7f436f756e7465723a206e657720636f756e74206d7573742062652067726561745f8201527f6572207468616e2063757272656e740000000000000000000000000000000000602082015250565b5f6102e3602f83610279565b91506102ee82610289565b604082019050919050565b5f6020820190508181035f830152610310816102d7565b905091905056fea2646970667358221220baa3ff98bf9d775e2e7ff27378677c73630fe2af1a074c6c51a98ce97414f80464736f6c634300081c0033'

const FORK_SETUP = `// Public RPC — swap in your own endpoint if this one rate-limits you.
const RPC_URL = 'https://ethereum-rpc.publicnode.com'

const rpc = async (method, params) => {
	const response = await fetch(RPC_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	})
	if (!response.ok) throw new Error(\`Public RPC returned HTTP \${response.status}\`)
	const payload = await response.json()
	if (payload.error) throw new Error(\`Public RPC: \${payload.error.message}\`)
	return payload.result
}

// tevm rc.151 needs a fork base block without EIP-4844 blob transactions.
// Pick a recent one so the public endpoint does not need archival access.
const recentNonBlobBlock = async () => {
	const latest = BigInt(await rpc('eth_blockNumber', []))
	for (let offset = 0n; offset < 24n; offset++) {
		const number = latest - offset
		const block = await rpc('eth_getBlockByNumber', [\`0x\${number.toString(16)}\`, false])
		if (BigInt(block.blobGasUsed ?? '0x0') === 0n) return number
	}
	throw new Error('Could not find a recent non-blob block to fork')
}

const forkBlock = await recentNonBlobBlock()
console.log('forking mainnet block:', forkBlock)`

export interface Example {
	id: string
	title: string
	blurb: string
	solidity: string
	usesNetwork: boolean
	code: string
}

export const examples: Example[] = [
	{
		id: 'deploy',
		title: 'Deploy & call',
		blurb: 'Deploy a contract and call it — entirely in this page. No node, no RPC.',
		solidity: COUNTER_SOLIDITY,
		usesNetwork: false,
		code: `import { createMemoryClient } from 'tevm'

// A complete Ethereum node in memory. Synchronous to create, nothing to connect to.
const client = createMemoryClient()

const abi = ${COUNTER_ABI}

// Precompiled Counter.sol (solc 0.8.28) — see the Solidity pane.
const bytecode = '${COUNTER_BYTECODE}'

const deploy = await client.tevmDeploy({ abi, bytecode })
await client.tevmMine()
console.log('deployed at', deploy.createdAddress)

const tx = await client.tevmContract({
	to: deploy.createdAddress!,
	abi,
	functionName: 'increment',
	addToBlockchain: true,
})
console.log('gas used:', tx.executionGasUsed)
console.log('logs:', tx.logs)

const read = await client.tevmContract({ to: deploy.createdAddress!, abi, functionName: 'count' })
console.log('count is now:', read.data)
`,
	},
	{
		id: 'fork',
		title: 'Fork mainnet',
		blurb: 'Fork Ethereum mainnet in the browser and read a real account balance.',
		solidity: USDC_SOLIDITY,
		usesNetwork: true,
		code: `import { createMemoryClient, http, parseAbi } from 'tevm'
import { formatEther, formatUnits } from 'viem'

${FORK_SETUP}

// Fork mainnet at a fixed block. State is fetched lazily over RPC and cached;
// execution happens locally in this page.
const client = createMemoryClient({
	fork: { transport: http(RPC_URL), blockTag: forkBlock },
})

const vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const balance = await client.getBalance({ address: vitalik })
console.log('vitalik.eth balance:', formatEther(balance), 'ETH')

const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const abi = parseAbi(['function balanceOf(address) view returns (uint256)'])
const res = await client.tevmContract({ to: usdc, abi, functionName: 'balanceOf', args: [vitalik] })
console.log('vitalik.eth USDC:', formatUnits(res.data!, 6))
console.log('gas used:', res.executionGasUsed)
`,
	},
	{
		id: 'whale',
		title: 'Impersonate a whale',
		blurb: 'Send USDC from a whale you do not control. Your fork, your rules.',
		solidity: USDC_SOLIDITY,
		usesNetwork: true,
		code: `import { createMemoryClient, http, parseAbi } from 'tevm'
import { formatUnits } from 'viem'

${FORK_SETUP}

const client = createMemoryClient({
	fork: { transport: http(RPC_URL), blockTag: forkBlock },
})

const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const abi = parseAbi([
	'function balanceOf(address) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
])

// A real USDC whale. On your local fork you can send from ANY address —
// no key, no signature. Try doing this against a real RPC.
const whale = '0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341'
const you = '0x1111111111111111111111111111111111111111'

const before = await client.tevmContract({ to: usdc, abi, functionName: 'balanceOf', args: [whale] })
console.log('whale USDC:', formatUnits(before.data!, 6))

const tx = await client.tevmContract({
	to: usdc,
	abi,
	functionName: 'transfer',
	args: [you, 1_000_000_000n], // 1,000 USDC
	from: whale,
	addToBlockchain: true,
})
console.log('transfer succeeded:', tx.data, '— gas used:', tx.executionGasUsed)

const after = await client.tevmContract({ to: usdc, abi, functionName: 'balanceOf', args: [you] })
console.log('your USDC:', formatUnits(after.data!, 6))
`,
	},
	{
		id: 'revert',
		title: 'Catch a revert',
		blurb: 'See the actual revert reason, decoded, exactly as tevm reports it.',
		solidity: COUNTER_SOLIDITY,
		usesNetwork: false,
		code: `import { createMemoryClient } from 'tevm'

const client = createMemoryClient()

const abi = ${COUNTER_ABI}

const bytecode = '${COUNTER_BYTECODE}'

const deploy = await client.tevmDeploy({ abi, bytecode })
await client.tevmMine()

// setCount(0) violates the require() — count starts at 0.
// With throwOnFail: false, tevm returns the failure instead of throwing.
const res = await client.tevmContract({
	to: deploy.createdAddress!,
	abi,
	functionName: 'setCount',
	args: [0n],
	throwOnFail: false,
})

for (const err of res.errors ?? []) {
	console.log('error name:', err.name)
	console.log(err.message)
}
`,
	},
	{
		id: 'trace',
		title: 'Step through a trace',
		blurb: 'Get an opcode-level struct trace of a call — from a client running in a web page.',
		solidity: COUNTER_SOLIDITY,
		usesNetwork: false,
		code: `import { createMemoryClient } from 'tevm'

const client = createMemoryClient()

const abi = ${COUNTER_ABI}

const bytecode = '${COUNTER_BYTECODE}'

const deploy = await client.tevmDeploy({ abi, bytecode })
await client.tevmMine()

// createTrace: true returns an EVM struct log: every opcode, its gas, stack depth.
const res = await client.tevmContract({
	to: deploy.createdAddress!,
	abi,
	functionName: 'increment',
	createTrace: true,
})

const steps = res.trace?.structLogs ?? []
console.log('executed', steps.length, 'opcodes, gas used:', res.executionGasUsed)
console.log('first 15 opcodes:')
for (const step of steps.slice(0, 15)) {
	console.log(\`  pc=\${String(step.pc).padStart(4)} \${step.op.padEnd(10)} gasCost=\${step.gasCost}\`)
}
const sstore = steps.find((s) => s.op === 'SSTORE')
console.log('the SSTORE that bumped the counter:', sstore && \`pc=\${sstore.pc} gasCost=\${sstore.gasCost}\`)
`,
	},
]
