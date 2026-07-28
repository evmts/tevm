import assert from 'node:assert/strict'
import { collector, equal, loadCase, VITALIK } from '../lib/check.js'
import { addresses, seaportAbi } from '../fixtures/seaport/project.js'

const results = collector('seaport')
const { client, factory } = await loadCase('createSeaportSdk')
const sdk = await factory(client)
const information = await client.readContract({
  address: addresses.seaport, abi: seaportAbi, functionName: 'information',
})
const counter = await client.readContract({
  address: addresses.seaport, abi: seaportAbi, functionName: 'getCounter', args: [VITALIK],
})
const actual = await sdk.getInformation()

await results.check('version matches pinned mainnet', () => equal(actual.version, information[0]))
await results.check('domain separator matches pinned mainnet', () => {
  equal(actual.domainSeparator, information[1])
})
await results.check('conduit controller matches pinned mainnet', () => {
  equal(actual.conduitController, information[2])
})
await results.check('offerer counter matches pinned mainnet', async () => {
  equal(await sdk.getCounter(VITALIK), counter)
})
await results.check('order write and event surface is present', () => {
  assert.equal(sdk.prepareIncrementCounter().functionName, 'incrementCounter')
  assert.equal(typeof sdk.prepareValidate, 'function')
  assert.equal(typeof sdk.getOrderHash, 'function')
  assert.equal(typeof sdk.getOrderFulfilledEvents, 'function')
})
results.finish()

