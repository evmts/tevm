import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/getBlock/, /getTransactionReceipt/, /gasUsed/, /tevmMine|mine/], validate: (v, a) => { a.equal(v.transactions, 2); a.ok(BigInt(v.blockGasUsed) > 0n); a.ok(BigInt(v.receiptGasSum) > 0n); a.equal(v.equal, true); a.equal(v.blockGasUsed, v.receiptGasSum) } })
