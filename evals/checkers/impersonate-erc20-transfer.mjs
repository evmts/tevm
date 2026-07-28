import { candidateDir, checkJson } from '../lib/check.mjs'
checkJson({ workdir: candidateDir(), required: [/Token\.sol/, /tevmSetAccount/, /transfer/, /balanceOf/, /from\s*:/], validate: (v, a) => { a.deepEqual(v, { holder: '750', recipient: '250' }) } })
