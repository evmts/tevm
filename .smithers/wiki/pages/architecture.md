# TEVM Layered Architecture

TEVM separates public developer ergonomics, Viem transport adapters, JSON-RPC handlers, and native EVM execution into lean, independently cached workspace packages.

```mermaid
flowchart TB
  subgraph Public["Public Facade & Surfaces"]
    Tevm["tevm"]
    Cli["@tevm/cli"]
    Server["@tevm/server"]
    Mcp["@tevm/mcp"]
  end
  subgraph Client["Client & Actions"]
    Mem["@tevm/memory-client"]
    Viem["@tevm/viem"]
    Actions["@tevm/actions"]
    Contract["@tevm/contract"]
  end
  subgraph Core["Node & Primitives"]
    Node["@tevm/node"]
    Common["@tevm/common"]
    Errors["@tevm/errors"]
    Utils["@tevm/utils"]
    JsonRpc["@tevm/jsonrpc"]
    Http["@tevm/http-client"]
    Predeploys["@tevm/predeploys"]
  end
  subgraph Native["Native Sibling Repositories"]
    Zevm["evmts/zevm (N-API)"]
    Voltaire["evmts/voltaire (Zig crypto)"]
    Guillotine["evmts/guillotine-mini (EVM)"]
  end
  Tevm --> Mem
  Tevm --> Node
  Tevm --> Actions
  Tevm --> Contract
  Cli --> Mem
  Server --> Node
  Mcp --> Mem
  Mem --> Actions
  Mem --> Node
  Viem --> Mem
  Actions --> Node
  Actions --> Errors
  Node --> Zevm
  Zevm --> Voltaire
  Zevm --> Guillotine
```

## Key Invariants

1. **Synchronized facade**: Every public subpath in `tevm/package.json` maps to its facade directory and recursive barrel exports, verified continuously by Uphill's `tevm-facade-exports` metric ([[backpressure-and-uphill]]).
2. **One concept per module**: Production modules stay under 250 lines with functions at or under 70 lines (TigerStyle) and complete JSDoc on exported symbols.
3. **Isolated node state**: Tests and the embedded playground create fresh `createMemoryClient()` instances and dispose native handles with `await client.tevmClose()`.

## Related Pages

- [[start-here]]
- [[zevm-native-engine]]
- [[json-rpc-contract]]
