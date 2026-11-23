#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot } from './lib.mjs'

// The addon lives in the ../zevm sibling, outside the Flows workspace, so no
// PACKAGE.ts can declare it. Native test targets instead declare this
// gitignored, host-local stamp. Flows digests a named S.file even when it is
// gitignored, so a rebuilt addon re-keys every target that declares the stamp.

/** Absolute path of the addon `@evmts/zevm` loads. */
export const nativeAddonPath = resolve(repositoryRoot, '../zevm/npm/zevm/native/zevm.node')

/** Absolute path of the stamp; PACKAGE.ts files declare `//factory/native-addon.sha256`. */
export const nativeAddonStampPath = resolve(repositoryRoot, 'factory/native-addon.sha256')

/**
 * Renders the stamp in `sha256sum` format. The content depends only on the
 * addon bytes and the fixed sibling-relative path, so it is deterministic.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export const stampContents = (bytes) =>
	`${createHash('sha256').update(bytes).digest('hex')}  ${relative(repositoryRoot, nativeAddonPath).replaceAll('\\', '/')}\n`

/**
 * Writes the stamp for the addon at `addon`. Returns the stamp text.
 * @param {{ addon?: string, stamp?: string }} [paths]
 * @returns {Promise<string>}
 */
export const writeNativeAddonStamp = async ({ addon = nativeAddonPath, stamp = nativeAddonStampPath } = {}) => {
	const contents = stampContents(await readFile(addon))
	await writeFile(stamp, contents)
	return contents
}

// Refresh the stamp after building ../zevm outside build-native.mjs.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.stdout.write(await writeNativeAddonStamp())
}
