import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/nonce/, /tevmMine|mine/, /getTransactionReceipt/], validate: (v, a) => { a.equal(v.sameBlock, true); a.equal(v.ordered, true); a.equal(v.gasUsedPositive, true); a.equal(v.hashes.length, 2); for (const hash of v.hashes) a.match(hash, /^0x[0-9a-fA-F]{64}$/) } })
