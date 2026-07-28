import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/failWithReason/, /catch|throwOnFail\s*:\s*false/, /errors|error/], validate: (v, a) => { a.deepEqual(v, { reverted: true, reason: 'blocked by eval' }) } })
