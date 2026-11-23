---
"@tevm/config": patch
---

Keep a remapping whose prefix is `__proto__`. Config validation and the Foundry remapping loader built the remappings record by assignment, which silently dropped that entry from `remappings.txt`, `tevm.config.json` and `forge config` output.
