import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/snapshot/, /revert/, /request/], validate: (v, a) => { a.deepEqual(v, { before: '5', mutated: '10', restored: '5', reverted: true }) } })
