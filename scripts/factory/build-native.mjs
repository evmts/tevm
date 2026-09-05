#!/usr/bin/env node
import { copyFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command, repositoryRoot } from './lib.mjs'

const root = resolve(repositoryRoot, '../zevm')
const expected = /zig = "([^"]+)"/.exec(await readFile(resolve(repositoryRoot, 'mise.toml'), 'utf8'))?.[1]
const version = command('zig', ['version']).trim()
if (version !== expected) throw new Error(`Expected Zig ${expected}; run mise install`)
// Zig tracks all three local repositories by content. Never key an uncommitted
// sibling build only on its HEAD revision: that would silently use stale code.
command('zig', ['build', 'npm-native', '-Doptimize=ReleaseSafe'], { cwd: root, stdio: 'inherit' })
const addon = resolve(root, 'npm/zevm/native/zevm.node')
await copyFile(resolve(root, 'zig-out/npm/native/zevm.node'), addon)
console.log('Native ZEVM addon built from ../zevm, ../voltaire, and ../guillotine-mini')
