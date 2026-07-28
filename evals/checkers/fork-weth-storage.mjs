import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/createMemoryClient/, /fork\s*:/, /20_?000_?000n/, /getStorageAt|storageRoot|storage/], timeout: 150_000, validate: (v, a) => { a.equal(v.block, '20000000'); a.equal(v.slot.toLowerCase(), '0x577261707065642045746865720000000000000000000000000000000000001a') } })
