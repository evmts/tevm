import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/debug_traceCall/, /structLogs/, /SSTORE/], validate: (v, a) => { a.equal(v.opcode, 'SSTORE'); a.ok(Number.isInteger(v.index) && v.index >= 0); a.ok(Number.isInteger(v.stepCount) && v.stepCount > v.index) } })
