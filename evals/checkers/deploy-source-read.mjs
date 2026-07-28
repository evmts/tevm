import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/solc/, /Counter\.sol/, /tevmDeploy|deployContract/, /tevmContract|readContract/], validate: (v, a) => { a.equal(v.value, '42'); a.match(v.address, /^0x[0-9a-fA-F]{40}$/) } })
