import { stat } from 'node:fs/promises'

const [file, rawLimit] = process.argv.slice(2)

if (!file || !rawLimit) {
	throw new Error('Usage: node scripts/check-file-size.mjs <file> <limit>')
}

const units = new Map([
	['b', 1],
	['kb', 1_000],
	['mb', 1_000_000],
	['kib', 1_024],
	['mib', 1_048_576],
])
const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|kib|mib)$/i.exec(rawLimit.trim())

if (!match) {
	throw new Error(`Invalid size limit "${rawLimit}"; use b, kb, mb, kib, or mib`)
}

const multiplier = units.get(match[2].toLowerCase())
const limit = Number(match[1]) * multiplier
const { size } = await stat(file)

if (size > limit) {
	throw new Error(`${file} is ${size} bytes, exceeding the ${limit}-byte budget`)
}

console.log(`${file}: ${size}/${limit} bytes`)
