import assert from 'node:assert/strict'
import { collector, equal, loadCase, VITALIK } from '../lib/check.js'
import { addresses, enabledLltv, morphoAbi } from '../fixtures/morpho-blue/project.js'

const results = collector('morpho-blue')
const { client, factory } = await loadCase('createMorphoBlueSdk')
const sdk = await factory(client)
const [owner, irmEnabled, lltvEnabled, nonce] = await Promise.all([
  client.readContract({ address: addresses.morpho, abi: morphoAbi, functionName: 'owner' }),
  client.readContract({
    address: addresses.morpho,
    abi: morphoAbi,
    functionName: 'isIrmEnabled',
    args: [addresses.adaptiveCurveIrm],
  }),
  client.readContract({
    address: addresses.morpho,
    abi: morphoAbi,
    functionName: 'isLltvEnabled',
    args: [enabledLltv],
  }),
  client.readContract({
    address: addresses.morpho, abi: morphoAbi, functionName: 'nonce', args: [VITALIK],
  }),
])
const config = await sdk.getProtocolConfig()

await results.check('owner matches pinned mainnet', () => equal(config.owner, owner))
await results.check('adaptive curve IRM is enabled', () => equal(config.irmEnabled, irmEnabled))
await results.check('LLTV is enabled', () => equal(config.lltvEnabled, lltvEnabled))
await results.check('authorization nonce matches pinned mainnet', async () => {
  equal(await sdk.getNonce(VITALIK), nonce)
})
await results.check('supply, borrow, and event surface is present', () => {
  assert.equal(typeof sdk.prepareSupply, 'function')
  assert.equal(typeof sdk.prepareBorrow, 'function')
  assert.equal(typeof sdk.getSupplyEvents, 'function')
})
results.finish()

