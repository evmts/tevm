import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/createMemoryClient/, /fork\s*:/, /20_?000_?000n/, /readContract|tevmContract/], timeout: 150_000, validate: (v, a) => { a.deepEqual(v, { name: 'Wrapped Ether', block: '20000000' }) } })
