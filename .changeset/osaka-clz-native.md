---
"@tevm/node": patch
---

Execute EIP-7939 CLZ through the native engine when the selected block context
activates Osaka, preserving rejection before activation. Native builds require
the accompanying Guillotine Mini and Voltaire source updates.
