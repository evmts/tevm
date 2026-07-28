import { candidateDir, checkVitest } from '../lib/check.mjs'
checkVitest({ workdir: candidateDir(), required: [/createMemoryClient/, /tevmSetAccount/, /123456n/, /expect/] })
