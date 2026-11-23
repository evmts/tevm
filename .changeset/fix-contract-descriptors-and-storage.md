---
"@tevm/actions": patch
"@tevm/contract": patch
---

Use the selected function overload to decode contract call results. Encode short storage slots and values as 32-byte words for account updates. Restrict read and write selectors to overloads with the corresponding state mutability. Expose the declared function name on read and write action creators before invocation.
