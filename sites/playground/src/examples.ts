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

const COUNTER_ABI = `[
	{ type: 'function', name: 'count', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
	{ type: 'function', name: 'increment', inputs: [], outputs: [], stateMutability: 'nonpayable' },
	{ type: 'function', name: 'setCount', inputs: [{ name: 'newCount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
	{ type: 'event', name: 'Incremented', inputs: [{ name: 'by', type: 'address', indexed: true }, { name: 'newCount', type: 'uint256', indexed: false }] },
] as const`

const COUNTER_BYTECODE =
	'0x6080604052348015600e575f5ffd5b5061034d8061001c5f395ff3fe608060405234801561000f575f5ffd5b506004361061003f575f3560e01c806306661abd14610043578063d09de08a14610061578063d14e62b81461006b575b5f5ffd5b61004b610087565b60405161005891906101a7565b60405180910390f35b61006961008c565b005b610085600480360381019061008091906101ee565b6100f5565b005b5f5481565b60015f5f82825461009d9190610246565b925050819055503373ffffffffffffffffffffffffffffffffffffffff167f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa54205f546040516100eb91906101a7565b60405180910390a2565b5f548111610138576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012f906102f9565b60405180910390fd5b805f819055503373ffffffffffffffffffffffffffffffffffffffff167f38ac789ed44572701765277c4d0970f2db1c1a571ed39e84358095ae4eaa54208260405161018491906101a7565b60405180910390a250565b5f819050919050565b6101a18161018f565b82525050565b5f6020820190506101ba5f830184610198565b92915050565b5f5ffd5b6101cd8161018f565b81146101d7575f5ffd5b50565b5f813590506101e8816101c4565b92915050565b5f60208284031215610203576102026101c0565b5b5f610210848285016101da565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6102508261018f565b915061025b8361018f565b925082820190508082111561027357610272610219565b5b92915050565b5f82825260208201905092915050565b7f436f756e7465723a206e657720636f756e74206d7573742062652067726561745f8201527f6572207468616e2063757272656e740000000000000000000000000000000000602082015250565b5f6102e3602f83610279565b91506102ee82610289565b604082019050919050565b5f6020820190508181035f830152610310816102d7565b905091905056fea2646970667358221220baa3ff98bf9d775e2e7ff27378677c73630fe2af1a074c6c51a98ce97414f80464736f6c634300081c0033'

export interface Example {
	id: string
	title: string
	blurb: string
	solidity: string
	code: string
}

const setup = `import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { foundry } from 'viem/chains'

const transport = http('http://localhost:8545', { retryCount: 0 })
const client = createPublicClient({ chain: foundry, transport })
const wallet = createWalletClient({ chain: foundry, transport })
const [account] = await wallet.getAddresses()
const abi = ${COUNTER_ABI}
const hash = await wallet.deployContract({ account, abi, bytecode: '${COUNTER_BYTECODE}' })
const receipt = await client.waitForTransactionReceipt({ hash })
const address = receipt.contractAddress
console.log('Deployed:', address)
`

export const examples: Example[] = [
	{
		id: 'deploy',
		title: 'Deploy & call',
		blurb: 'Deploy and update a counter on your local native node.',
		solidity: COUNTER_SOLIDITY,
		code:
			setup +
			`
console.log('Before:', await client.readContract({address, abi, functionName:'count'}))
const increment = await wallet.writeContract({account,address,abi,functionName:'increment'})
await client.waitForTransactionReceipt({hash:increment})
console.log('After:', await client.readContract({address, abi, functionName:'count'}))
`,
	},
	{
		id: 'revert',
		title: 'Catch a revert',
		blurb: 'Decode a revert returned by native contract execution.',
		solidity: COUNTER_SOLIDITY,
		code:
			setup +
			`
try {
 await client.simulateContract({account,address,abi,functionName:'setCount',args:[0n]})
} catch (error) {
 console.log(error.message)
}
`,
	},
	{
		id: 'trace',
		title: 'Trace execution',
		blurb: 'Inspect the native debug_traceCall response.',
		solidity: COUNTER_SOLIDITY,
		code:
			setup +
			`
const trace = await client.request({method:'debug_traceCall',params:[{to:address,data:'0x06661abd'},'latest',{}]})
console.log(trace)
`,
	},
]
