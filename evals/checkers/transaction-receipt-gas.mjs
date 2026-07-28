import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/tevmSetAccount/, /sendTransaction|tevmCall/, /tevmMine|mine/, /getTransactionReceipt/], validate: (v, a) => { a.equal(v.status, 'success'); a.ok(BigInt(v.blockNumber) >= 1n); a.ok(BigInt(v.gasUsed) > 0n); a.match(v.txHash, /^0x[0-9a-fA-F]{64}$/) } })
