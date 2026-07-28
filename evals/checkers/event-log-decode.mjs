import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/ValueSet/, /decodeEventLog/, /logs/], validate: (v, a) => { a.equal(v.event, 'ValueSet'); a.equal(v.value, '23'); a.ok(Number.isInteger(v.logCount) && v.logCount > 0) } })
