import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/debug_traceCall/, /callTracer/, /callDouble/, /Callee/], validate: (v, a) => { a.equal(v.type, 'CALL'); a.match(v.to, /^0x[0-9a-f]{40}$/); a.equal(v.output, '42') } })
