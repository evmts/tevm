import { candidateDir, checkBundler } from '../lib/check.mjs'
checkBundler({ workdir: candidateDir() })
