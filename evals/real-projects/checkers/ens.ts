import assert from 'node:assert/strict'
import { namehash } from 'viem'
import { collector, equal, loadCase } from '../lib/check.js'
import { addresses, registryAbi, resolverAbi } from '../fixtures/ens/project.js'

const results = collector('ens')
const { client, factory } = await loadCase('createEnsSdk')
const sdk = await factory(client)
const node = namehash('vitalik.eth')
const owner = await client.readContract({
  address: addresses.registry, abi: registryAbi, functionName: 'owner', args: [node],
})
const resolver = await client.readContract({
  address: addresses.registry, abi: registryAbi, functionName: 'resolver', args: [node],
})
const ttl = await client.readContract({
  address: addresses.registry, abi: registryAbi, functionName: 'ttl', args: [node],
})
const address = await client.readContract({
  address: resolver, abi: resolverAbi, functionName: 'addr', args: [node],
})
const actual = await sdk.resolve('vitalik.eth')

await results.check('owner matches pinned mainnet', () => equal(actual.owner, owner))
await results.check('resolver matches pinned mainnet', () => equal(actual.resolver, resolver))
await results.check('address matches pinned mainnet', () => equal(actual.address, address))
await results.check('ttl matches pinned mainnet', () => equal(actual.ttl, ttl))
await results.check('write and event surface is present', async () => {
  const request = await sdk.prepareSetAddress('vitalik.eth', owner)
  assert.equal(request.functionName, 'setAddr')
  assert.equal(typeof sdk.getTransferEvents, 'function')
})
results.finish()
