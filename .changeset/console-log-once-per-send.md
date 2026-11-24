---
"@tevm/node": patch
---

Deliver each Solidity `console.log` once when `eth_sendTransaction` omits `gas`. The pinned ZEVM revision no longer records console calls during the gas estimate that runs first, and `eth_signTransaction` and `eth_createAccessList` no longer leak calls into the next drained request.
