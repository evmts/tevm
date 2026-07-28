import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/tevmDumpState/, /tevmLoadState/, /tevmGetAccount/], validate: (v, a) => { a.equal(v.balance, '77'); a.equal(v.nonce, '3'); a.ok(Number.isInteger(v.stateEntries) && v.stateEntries > 0) } })
