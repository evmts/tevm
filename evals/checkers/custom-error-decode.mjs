import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/restricted/, /decodeErrorResult/, /Unauthorized/], validate: (v, a) => { a.equal(v.errorName, 'Unauthorized'); a.equal(v.caller.toLowerCase(), '0x0000000000000000000000000000000000001234') } })
