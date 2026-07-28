import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/createMemoryClient/, /tevmSetAccount/, /sendTransaction|tevmCall/, /tevmMine|mine/], validate: (v, a) => { a.equal(v.recipient, '1000000000000000000'); a.equal(v.senderBelowOneEther, true); a.match(v.txHash, /^0x[0-9a-fA-F]{64}$/) } })
