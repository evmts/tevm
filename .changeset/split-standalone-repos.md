---
"tevm": patch
"@tevm/cli": patch
---

`tevm` and `@tevm/cli` now depend on the bundler packages (`@tevm/base-bundler`, `@tevm/bundler-cache`, `@tevm/compiler`, `@tevm/config`, `@tevm/solc`, `@tevm/ts-plugin` and the bundler plugins) through the npm range `^1.0.0-rc.151` instead of a workspace link. Those packages, with `@tevm/effect`, `@tevm/logger`, `@tevm/ethers`, `@tevm/test-utils`, `@tevm/lsp`, `tevm-run` and the example apps, are now developed in `evmts/tevm-bundler`, `evmts/tevm-logger`, `evmts/tevm-ethers`, `evmts/tevm-test`, `evmts/tevm-cli` and `evmts/tevm-examples`. The `tevm/bundler/*` entry points are unchanged.
