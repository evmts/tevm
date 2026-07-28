import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/createMemoryClient/, /tevmMine/, /blockCount\s*:\s*3/, /getBlockNumber/], validate: (v, a) => { a.equal(v.delta, '3'); a.equal(v.hashCount, 3); a.ok(BigInt(v.lastBlock) >= 3n) } })
