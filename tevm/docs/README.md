**tevm**

***

<p align="center">
  TypeScript programming with the full power of the Ethereum Virtual Machine
<p>

[![CI](https://github.com/evmts/tevm/actions/workflows/ci.yml/badge.svg)](https://github.com/evmts/tevm/actions/workflows/ci.yml)
<a href="https://www.npmjs.com/package/tevm">
<img src="https://img.shields.io/npm/v/tevm?style=flat" alt="Version">
</a>
<a href="https://www.npmjs.com/package/tevm" target="\_parent">
<img alt="" src="https://img.shields.io/npm/dm/tevm.svg" />
</a>
<a href="https://bundlephobia.com/package/tevm@latest" target="\_parent">
<img alt="" src="https://badgen.net/bundlephobia/minzip/tevm" />
</a><a href="#badge">

# tevm-monorepo

Tevm is an ethereum development toolkit that offers

- Arbitrary EVM execution and forking akin to [anvil](https://github.com/foundry-rs/foundry/tree/master/crates/anvil)
- A powerful solidity scripting environment akin to [foundry scripts](https://book.getfoundry.sh/guides/scripting-with-solidity)
- Build tooling to create a smooth interface between your Solidity scripts and TypeScript code

Use Node.js 24 for the native client. Browser applications can connect to a running Tevm server with a viem HTTP transport.

## Try it out

Try out our [online frontend example on stackblitz](https://stackblitz.com/~/github.com/evmts/tevm-vite-wagmi-example)

## Visit [Docs](https://tevm.sh/) for docs, guides, API and more! 📄

## Code example

Tevm scripting is a simple yet powerful way to program.

1. Write a solidity script `HelloWorld.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract HelloWorld {
    function greet(string memory name) public pure returns (string memory) {
        return string(abi.encodePacked("Hello ", name, "!"));
    }
}
```

2. With the Tevm Solidity bundler plugin configured, import the contract in JavaScript or TypeScript.

```typescript
import { HelloWorld } from "./HelloWorld.sol";

console.log(HelloWorld.abi);
console.log(HelloWorld.bytecode);
```

3. Load the compiled runtime bytecode into a memory client and call `greet`.

```typescript
import { HelloWorld } from "./HelloWorld.sol";
import { createMemoryClient } from "tevm";

const client = createMemoryClient();
try {
  const address = "0x0000000000000000000000000000000000000123";
  await client.tevmSetAccount({ address, deployedBytecode: HelloWorld.deployedBytecode });
  const result = await client.tevmContract({
    address,
    abi: HelloWorld.abi,
    functionName: "greet",
    args: ["World"],
  });
  console.log(result.data); // Hello World!
} finally {
  await client.tevmClose();
}
```

This is just a small subset of what Tevm offers. See [docs](https://tevm.sh/) for more information.

## Contributing 💻

Contributions are encouraged, but please open an issue before doing any major changes to make sure your change will be accepted.

See [CONTRIBUTING.md](_media/CONTRIBUTING.md) for contributing information

## License 📄

<a href="_media/LICENSE"><img src="https://user-images.githubusercontent.com/35039927/231030761-66f5ce58-a4e9-4695-b1fe-255b1bceac92.png" width="200" /></a>
