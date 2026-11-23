#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { copyFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, repositoryRoot } from './lib.mjs'
import { nativeAddonPath, writeNativeAddonStamp } from './native-addon-stamp.mjs'

const platformPackageKey = () => {
	if (process.platform === 'win32') return `${process.platform}-${process.arch}-msvc`
	if (process.platform !== 'linux') return `${process.platform}-${process.arch}`
	const report = process.report?.getReport?.()
	const glibc = report?.header?.glibcVersionRuntime ?? report?.header?.glibcVersionCompiler
	return `${process.platform}-${process.arch}-${glibc ? 'gnu' : 'musl'}`
}

const root = resolve(repositoryRoot, '../zevm')
const expected = /zig = "([^"]+)"/.exec(await readFile(resolve(repositoryRoot, 'mise.toml'), 'utf8'))?.[1]
const version = command('zig', ['version']).trim()
if (version !== expected) throw new Error(`Expected Zig ${expected}; run mise install`)
// Zig tracks all three local repositories by content. Never key an uncommitted
// sibling build only on its HEAD revision: that would silently use stale code.
command('zig', ['build', 'npm-native', '-Doptimize=ReleaseSafe'], { cwd: root, stdio: 'inherit' })
const built = resolve(root, 'zig-out/npm/native/zevm.node')
await copyFile(built, nativeAddonPath)
// @evmts/zevm resolves its optional platform package before the local native/
// fallback; keep the host platform directory in sync so stale prebuilds never
// shadow a freshly built local addon.
const platformDir = resolve(root, 'npm/platforms', platformPackageKey())
if (existsSync(platformDir)) {
	await copyFile(built, resolve(platformDir, 'zevm.node'))
}
// Native test targets declare this stamp, so new addon bytes re-key their cache.
process.stdout.write(await writeNativeAddonStamp())
console.log('Native ZEVM addon built from ../zevm, ../voltaire, and ../guillotine-mini')
