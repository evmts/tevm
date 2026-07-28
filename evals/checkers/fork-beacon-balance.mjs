import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/createMemoryClient/, /fork\s*:/, /20_?000_?000n/, /getBalance|tevmGetAccount/], timeout: 150_000, validate: (v, a) => { a.deepEqual(v, { balance: '45549706393368784369090454', block: '20000000' }) } })
