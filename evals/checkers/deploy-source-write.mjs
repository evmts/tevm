import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/solc/, /tevmDeploy|deployContract/, /set/, /tevmMine|mine/], validate: (v, a) => { a.equal(v.before, '1'); a.equal(v.after, '9'); a.match(v.txHash, /^0x[0-9a-fA-F]{64}$/) } })
