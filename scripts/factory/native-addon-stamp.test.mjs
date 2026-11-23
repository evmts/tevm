import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { stampContents, writeNativeAddonStamp } from './native-addon-stamp.mjs'

test('native addon stamp is deterministic and changes with addon bytes', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'tevm-native-stamp-'))
	try {
		const addon = join(directory, 'zevm.node')
		const stamp = join(directory, 'native-addon.sha256')

		writeFileSync(addon, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 1]))
		const first = await writeNativeAddonStamp({ addon, stamp })
		assert.equal(readFileSync(stamp, 'utf8'), first)
		assert.match(first, /^[0-9a-f]{64} {2}\.\.\/zevm\/npm\/zevm\/native\/zevm\.node\n$/)
		assert.equal(await writeNativeAddonStamp({ addon, stamp }), first, 'same bytes must yield the same stamp')

		writeFileSync(addon, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2]))
		const second = await writeNativeAddonStamp({ addon, stamp })
		assert.notEqual(second, first, 'rebuilt addon bytes must change the stamp')
		assert.equal(readFileSync(stamp, 'utf8'), second)
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})

test('stamp digest is SHA-256 of the addon bytes', () => {
	assert.equal(
		stampContents(Buffer.from('abc')).slice(0, 64),
		'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
	)
})
