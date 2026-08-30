import { describe, expect, it } from 'vitest'
import { tolerantSignatureLookup } from './tolerantSignatureLookup.js'

describe('tolerantSignatureLookup', () => {
	it('passes results through when the inner lookup answers', async () => {
		const lookup = tolerantSignatureLookup({
			loadFunctions: async (selector) => [`fn(${selector})`],
			loadEvents: async (hash) => [`ev(${hash})`],
		})
		expect(await lookup.loadFunctions('0x06fdde03')).toEqual(['fn(0x06fdde03)'])
		expect(await lookup.loadEvents('0xabc')).toEqual(['ev(0xabc)'])
	})

	it('degrades to no names, reporting the error, when the inner lookup rejects', async () => {
		const seen: unknown[] = []
		const failure = new Error('OpenChainSignatureLookup load error: fetch failed')
		const lookup = tolerantSignatureLookup(
			{
				loadFunctions: async () => {
					throw failure
				},
				loadEvents: async () => {
					throw failure
				},
			},
			(error) => seen.push(error),
		)
		expect(await lookup.loadFunctions('0x06fdde03')).toEqual([])
		expect(await lookup.loadEvents('0xabc')).toEqual([])
		expect(seen).toEqual([failure, failure])
	})
})
