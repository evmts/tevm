# @tevm/mcp

Give an AI agent an isolated, in-process EVM through the Model Context Protocol. The server can fork a public chain, compile Solidity, deploy and call contracts, alter account state, mine blocks, inspect the txpool, and return bounded execution traces. It does not start a node or container.

## Install and run

The published command is:

```sh
npx -y @tevm/mcp
```

For this checkout, build once with `pnpm --filter @tevm/mcp build`, then replace `npx -y @tevm/mcp` in the configurations below with:

```text
node /absolute/path/to/tevm-monorepo/packages/mcp/dist/cli.js
```

The server uses standard input and output. Standard output is reserved for MCP messages.

## Claude Code

Add this project-level `.mcp.json`:

```json
{
  "mcpServers": {
    "tevm": {
      "command": "npx",
      "args": ["-y", "@tevm/mcp"]
    }
  }
}
```

## Codex

Add this block to `~/.codex/config.toml`:

```toml
[mcp_servers.tevm]
command = "npx"
args = ["-y", "@tevm/mcp"]
```

## Generic MCP client

Use this stdio server configuration:

```json
{
  "name": "tevm",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@tevm/mcp"]
}
```

With the JavaScript MCP SDK:

```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const client = new Client({ name: 'agent', version: '1.0.0' })
await client.connect(
  new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@tevm/mcp'],
  }),
)
```

## Session model

State is explicit and isolated. Call `evm_create_session` for a local EVM or `evm_fork_chain` for forked state, then pass the returned `session` handle to every stateful tool.

A session lives in the MCP server process and expires after 30 minutes without a tool call. Each successful lookup refreshes that idle lifetime. The default limit is 32 live sessions. A process restart discards all sessions. Call `evm_close_session` as soon as a session is no longer useful.

This design prevents unrelated agents and tasks from sharing one implicit mutable chain.

## Tools

| Tool | Use it when |
| --- | --- |
| `evm_create_session` | A clean local chain is enough |
| `evm_fork_chain` | Real mainnet, Optimism, or Base state is needed |
| `evm_close_session` | A session can be discarded |
| `evm_compile_solidity` | The input is a Solidity snippet |
| `evm_deploy_contract` | Bytecode or source must become a running contract |
| `evm_call_contract` | Reading a contract without changing state |
| `evm_send_transaction` | Running a write and placing it in the txpool |
| `evm_get_account` | Reading balance, nonce, code, or an exact storage slot |
| `evm_set_account` | Directly changing balance, nonce, code, or storage |
| `evm_mine` | Committing pending writes or advancing blocks and time |
| `evm_get_block` | Inspecting block data |
| `evm_get_transaction_receipt` | Inspecting a mined transaction result |
| `evm_get_txpool` | Inspecting pending and queued transactions |
| `evm_trace_call` | Understanding opcode flow or gas use |

Integers that may exceed JSON precision use base-10 strings. Byte data uses even-length `0x` hex strings. Contract calls accept either a JSON ABI plus `functionName`, or one human-readable signature such as `balanceOf(address) view returns (uint256)`.

`evm_send_transaction` and `evm_deploy_contract` put transactions in the session txpool. Call `evm_mine` to commit them. The call result already includes decoded output, gas use, logs, and the transaction hash.

`evm_trace_call` defaults to at most 200 opcode steps and accepts up to 2,000. When a trace is longer, it keeps the first 70 percent and final 30 percent, reports the omitted middle count, and preserves failure status, gas use, and return data.

`evm_trace_call` never throws on a failing call. A revert or an out-of-gas returns `failed: true` alongside `errors`, a decoded `revertReason` when the payload is a standard or ABI-declared error, and the steps that ran, because a failing call is the case worth tracing. The other tools surface a failure as an MCP tool error.

## Minimal agent flow

1. Call `evm_create_session`.
2. Call `evm_compile_solidity` with a source snippet.
3. Call `evm_deploy_contract` with the returned ABI and bytecode.
4. Call `evm_mine`.
5. Call `evm_call_contract` with the created address and a signature.
6. Call `evm_close_session`.

Fork URLs are provided by the caller. Public endpoints work without an API key, while private endpoints can be used when their historical range or rate limits are preferable.
