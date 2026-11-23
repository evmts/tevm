import { describe, expect, it } from 'vitest'
import { parseRemappings } from './parseRemappings.js'

describe('parseRemappings', () => {
	it('splits on the first = and trims both halves', () => {
		expect(parseRemappings([' @a/ = lib/a=b/ ', '', '  '], '/p')).toEqual({ remappings: { '@a/': '/p/lib/a=b/' } })
	})

	it.each(['/project', 'C:\\project'])('preserves rooted targets when the config directory is %s', (base) => {
		for (const target of ['/opt/lib/', 'D:\\deps\\', 'd:/deps/', '\\\\server\\share\\lib']) {
			expect(parseRemappings([`lib/ = ${target} `], base)).toEqual({ remappings: { 'lib/': target } })
		}
		const sep = base.startsWith('/') ? '/' : '\\'
		expect(parseRemappings(['lib/=C:relative'], base)).toEqual({ remappings: { 'lib/': `${base}${sep}C:relative` } })
	})

	it('reports the first entry without a non-empty prefix', () => {
		expect(parseRemappings(['ok/=x/', 'no-separator', '=y'], '/p')).toEqual({ invalid: 'no-separator' })
		expect(parseRemappings(['=y'], '/p')).toEqual({ invalid: '=y' })
	})

	it('rejects non-string entries', () => {
		expect(parseRemappings([5 as unknown as string], '/p')).toEqual({ invalid: '5' })
	})

	it('keeps __proto__, constructor and prototype as own keys without polluting prototypes', () => {
		const parsed = parseRemappings(['__proto__=lib/p/', 'constructor=lib/c/', 'prototype=lib/t/'], '/p')
		if (!('remappings' in parsed)) throw new Error('expected remappings')
		const { remappings } = parsed
		expect(Object.getPrototypeOf(remappings)).toBe(Object.prototype)
		expect(Object.entries(remappings)).toEqual([
			['__proto__', '/p/lib/p/'],
			['constructor', '/p/lib/c/'],
			['prototype', '/p/lib/t/'],
		])
		expect(({} as Record<string, unknown>)['prototype']).toBeUndefined()
		expect(({} as Record<string, unknown>).constructor).toBe(Object)
	})
})
