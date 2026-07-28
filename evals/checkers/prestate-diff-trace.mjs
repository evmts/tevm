import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/debug_traceCall/, /prestateTracer/, /diffMode\s*:\s*true/, /storage/], validate: (v, a) => { a.equal(v.before, '0x1'); a.equal(v.after, '0x2'); a.match(v.address, /^0x[0-9a-f]{40}$/) } })
