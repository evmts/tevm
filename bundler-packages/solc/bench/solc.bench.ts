import solc from 'solc'
import { bench, describe } from 'vitest'
import { solcCompile } from '../src/index.js'

const benchOpts = { time: 400, warmupTime: 100, warmupIterations: 2, throws: true }

const simpleInput = {
	language: 'Solidity' as const,
	sources: {
		'Counter.sol': {
			content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Counter {
	uint256 public count;
	function inc() external { count += 1; }
	function get() external view returns (uint256) { return count; }
}
`,
		},
	},
	settings: {
		outputSelection: {
			'*': {
				'*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
			},
		},
	},
}

const erc20Input = {
	language: 'Solidity' as const,
	sources: {
		'Token.sol': {
			content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Token {
	string public name = "BenchToken";
	string public symbol = "BNCH";
	uint8 public decimals = 18;
	uint256 public totalSupply;
	mapping(address => uint256) public balanceOf;
	mapping(address => mapping(address => uint256)) public allowance;
	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(address indexed owner, address indexed spender, uint256 value);
	constructor(uint256 supply) { totalSupply = supply; balanceOf[msg.sender] = supply; }
	function transfer(address to, uint256 amt) external returns (bool) {
		require(balanceOf[msg.sender] >= amt, "bal");
		balanceOf[msg.sender] -= amt;
		balanceOf[to] += amt;
		emit Transfer(msg.sender, to, amt);
		return true;
	}
	function approve(address spender, uint256 amt) external returns (bool) {
		allowance[msg.sender][spender] = amt;
		emit Approval(msg.sender, spender, amt);
		return true;
	}
	function transferFrom(address from, address to, uint256 amt) external returns (bool) {
		require(allowance[from][msg.sender] >= amt, "allow");
		require(balanceOf[from] >= amt, "bal");
		allowance[from][msg.sender] -= amt;
		balanceOf[from] -= amt;
		balanceOf[to] += amt;
		emit Transfer(from, to, amt);
		return true;
	}
}
`,
		},
	},
	settings: {
		outputSelection: {
			'*': {
				'*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
			},
		},
	},
}

describe('@tevm/solc', () => {
	bench(
		'solcCompile (Counter.sol)',
		() => {
			const out = solcCompile(solc, simpleInput)
			if (!out.contracts?.['Counter.sol']?.Counter) throw new Error('unexpected')
		},
		benchOpts,
	)

	bench(
		'solcCompile (ERC20 Token.sol)',
		() => {
			const out = solcCompile(solc, erc20Input)
			if (!out.contracts?.['Token.sol']?.Token) throw new Error('unexpected')
		},
		benchOpts,
	)
})
